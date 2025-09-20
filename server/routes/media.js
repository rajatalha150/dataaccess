const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { authenticateToken, requireOwnershipOrAdmin, optionalAuth } = require('../middleware/auth');
const { upload, processFiles } = require('../middleware/upload');
const path = require('path');
const fs = require('fs').promises;

const router = express.Router();

// Upload media files
router.post('/upload', [
  authenticateToken,
  upload.array('files', 10), // Allow up to 10 files
  processFiles,
  body('folderId')
    .optional()
    .isUUID()
    .withMessage('Folder ID must be a valid UUID'),
  body('title')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Title must be less than 255 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'No files uploaded'
      });
    }

    const { folderId, title, description, tags } = req.body;
    const userId = req.user.id;

    // Verify folder access if specified
    if (folderId) {
      const folderResult = await query(
        'SELECT owner_id FROM folders WHERE id = $1',
        [folderId]
      );

      if (folderResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Folder not found'
        });
      }

      const folder = folderResult.rows[0];
      if (folder.owner_id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only upload to your own folders'
        });
      }
    }

    const uploadedFiles = [];
    const uploadErrors = [];

    for (const file of req.files) {
      try {
        // Process media file (extract metadata, generate thumbnails)
        const processedFile = await processMedia(file);

        // Save to database
        const mediaResult = await query(`
          INSERT INTO media_files (
            filename, original_filename, file_path, file_size, mime_type,
            media_type, width, height, duration, thumbnail_path,
            title, description, folder_id, owner_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          RETURNING id, filename, original_filename, file_size, mime_type, 
                   media_type, width, height, duration, thumbnail_path, created_at
        `, [
          processedFile.filename,
          processedFile.originalname,
          processedFile.path,
          processedFile.size,
          processedFile.mimetype,
          processedFile.mediaType,
          processedFile.width || null,
          processedFile.height || null,
          processedFile.duration || null,
          processedFile.thumbnailPath || null,
          title || processedFile.originalname,
          description || null,
          folderId || null,
          userId
        ]);

        const mediaFile = mediaResult.rows[0];

        // Add tags if provided
        if (tags && Array.isArray(tags) && tags.length > 0) {
          for (const tag of tags) {
            if (typeof tag === 'string' && tag.trim()) {
              await query(`
                INSERT INTO media_tags (media_id, tag_name)
                VALUES ($1, $2)
                ON CONFLICT (media_id, tag_name) DO NOTHING
              `, [mediaFile.id, tag.trim().toLowerCase()]);
            }
          }
        }

        uploadedFiles.push({
          id: mediaFile.id,
          filename: mediaFile.filename,
          originalFilename: mediaFile.original_filename,
          fileSize: mediaFile.file_size,
          mimeType: mediaFile.mime_type,
          mediaType: mediaFile.media_type,
          width: mediaFile.width,
          height: mediaFile.height,
          duration: mediaFile.duration,
          thumbnailPath: mediaFile.thumbnail_path,
          createdAt: mediaFile.created_at
        });

        // Log activity
        await query(`
          INSERT INTO activity_logs (user_id, action, resource_type, resource_id, details, ip_address, user_agent)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          userId,
          'media.uploaded',
          'media',
          mediaFile.id,
          JSON.stringify({ 
            filename: processedFile.originalname, 
            mediaType: processedFile.mediaType,
            fileSize: processedFile.size 
          }),
          req.ip,
          req.get('User-Agent')
        ]);

      } catch (fileError) {
        console.error(`Error processing file ${file.originalname}:`, fileError);
        uploadErrors.push({
          filename: file.originalname,
          error: fileError.message
        });
      }
    }

    res.status(201).json({
      message: `Successfully uploaded ${uploadedFiles.length} file(s)`,
      files: uploadedFiles,
      errors: uploadErrors.length > 0 ? uploadErrors : undefined
    });

  } catch (err) {
    console.error('Upload media error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to upload media files'
    });
  }
});

// Get media files with filtering and pagination
router.get('/', optionalAuth, async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const {
      folderId,
      mediaType,
      search,
      tags,
      page = 1,
      limit = 20,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build WHERE clause
    let whereClause = '(mf.owner_id = $1 OR f.is_public = true OR mf.folder_id IS NULL)';
    let queryParams = [userId];
    let paramCount = 2;

    if (folderId) {
      whereClause += ` AND mf.folder_id = $${paramCount}`;
      queryParams.push(folderId);
      paramCount++;
    }

    if (mediaType) {
      whereClause += ` AND mf.media_type = $${paramCount}`;
      queryParams.push(mediaType);
      paramCount++;
    }

    if (search) {
      whereClause += ` AND (mf.title ILIKE $${paramCount} OR mf.original_filename ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
      paramCount++;
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      whereClause += ` AND EXISTS (
        SELECT 1 FROM media_tags mt 
        WHERE mt.media_id = mf.id AND mt.tag_name = ANY($${paramCount})
      )`;
      queryParams.push(tagArray);
      paramCount++;
    }

    // Validate sort parameters
    const validSortFields = ['created_at', 'title', 'file_size', 'original_filename'];
    const validSortOrders = ['ASC', 'DESC'];
    
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const sortDirection = validSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    // Get total count
    const countResult = await query(`
      SELECT COUNT(DISTINCT mf.id) as total
      FROM media_files mf
      LEFT JOIN folders f ON mf.folder_id = f.id
      WHERE ${whereClause}
    `, queryParams);

    const total = parseInt(countResult.rows[0].total);

    // Get media files
    const mediaResult = await query(`
      SELECT DISTINCT
        mf.id,
        mf.filename,
        mf.original_filename,
        mf.file_size,
        mf.mime_type,
        mf.media_type,
        mf.width,
        mf.height,
        mf.duration,
        mf.thumbnail_path,
        mf.title,
        mf.description,
        mf.folder_id,
        mf.owner_id,
        mf.created_at,
        f.name as folder_name,
        u.first_name as owner_first_name,
        u.last_name as owner_last_name,
        ARRAY_AGG(DISTINCT mt.tag_name) FILTER (WHERE mt.tag_name IS NOT NULL) as tags
      FROM media_files mf
      LEFT JOIN folders f ON mf.folder_id = f.id
      LEFT JOIN users u ON mf.owner_id = u.id
      LEFT JOIN media_tags mt ON mf.id = mt.media_id
      WHERE ${whereClause}
      GROUP BY mf.id, f.name, u.first_name, u.last_name
      ORDER BY mf.${sortField} ${sortDirection}
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `, [...queryParams, parseInt(limit), offset]);

    const mediaFiles = mediaResult.rows.map(file => ({
      id: file.id,
      filename: file.filename,
      originalFilename: file.original_filename,
      fileSize: file.file_size,
      mimeType: file.mime_type,
      mediaType: file.media_type,
      width: file.width,
      height: file.height,
      duration: file.duration,
      thumbnailPath: file.thumbnail_path,
      title: file.title,
      description: file.description,
      folderId: file.folder_id,
      folderName: file.folder_name,
      ownerId: file.owner_id,
      owner: {
        firstName: file.owner_first_name,
        lastName: file.owner_last_name
      },
      tags: file.tags || [],
      createdAt: file.created_at,
      canEdit: userId && (file.owner_id === userId || (req.user && req.user.role === 'admin'))
    }));

    res.json({
      mediaFiles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (err) {
    console.error('Get media files error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get media files'
    });
  }
});

// Get media file by ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const mediaId = req.params.id;
    const userId = req.user ? req.user.id : null;

    const mediaResult = await query(`
      SELECT 
        mf.*,
        f.name as folder_name,
        f.is_public as folder_is_public,
        u.first_name as owner_first_name,
        u.last_name as owner_last_name,
        ARRAY_AGG(DISTINCT mt.tag_name) FILTER (WHERE mt.tag_name IS NOT NULL) as tags
      FROM media_files mf
      LEFT JOIN folders f ON mf.folder_id = f.id
      LEFT JOIN users u ON mf.owner_id = u.id
      LEFT JOIN media_tags mt ON mf.id = mt.media_id
      WHERE mf.id = $1
      GROUP BY mf.id, f.name, f.is_public, u.first_name, u.last_name
    `, [mediaId]);

    if (mediaResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Media file not found'
      });
    }

    const media = mediaResult.rows[0];

    // Check access permissions
    const hasAccess = !media.folder_id || // No folder (public)
                     media.folder_is_public || 
                     (userId && media.owner_id === userId) || 
                     (req.user && req.user.role === 'admin');

    if (!hasAccess) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to view this media file'
      });
    }

    res.json({
      id: media.id,
      filename: media.filename,
      originalFilename: media.original_filename,
      fileSize: media.file_size,
      mimeType: media.mime_type,
      mediaType: media.media_type,
      width: media.width,
      height: media.height,
      duration: media.duration,
      thumbnailPath: media.thumbnail_path,
      title: media.title,
      description: media.description,
      folderId: media.folder_id,
      folderName: media.folder_name,
      ownerId: media.owner_id,
      owner: {
        firstName: media.owner_first_name,
        lastName: media.owner_last_name
      },
      tags: media.tags || [],
      createdAt: media.created_at,
      updatedAt: media.updated_at,
      canEdit: userId && (media.owner_id === userId || (req.user && req.user.role === 'admin'))
    });

  } catch (err) {
    console.error('Get media file error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get media file'
    });
  }
});

// Stream media file
router.get('/:id/stream', optionalAuth, async (req, res) => {
  try {
    const mediaId = req.params.id;
    const userId = req.user ? req.user.id : null;

    const mediaResult = await query(`
      SELECT 
        mf.file_path, mf.mime_type, mf.file_size, mf.original_filename,
        f.is_public as folder_is_public, mf.owner_id
      FROM media_files mf
      LEFT JOIN folders f ON mf.folder_id = f.id
      WHERE mf.id = $1
    `, [mediaId]);

    if (mediaResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Media file not found'
      });
    }

    const media = mediaResult.rows[0];

    // Check access permissions
    const hasAccess = media.folder_is_public || 
                     (userId && media.owner_id === userId) || 
                     (req.user && req.user.role === 'admin');

    if (!hasAccess) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }

    const filePath = media.file_path;
    const stat = await fs.stat(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      // Handle range requests for video streaming
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': media.mime_type,
        'Cache-Control': 'public, max-age=31536000'
      });

      const stream = require('fs').createReadStream(filePath, { start, end });
      stream.pipe(res);
    } else {
      // Full file response
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': media.mime_type,
        'Content-Disposition': `inline; filename="${media.original_filename}"`,
        'Cache-Control': 'public, max-age=31536000'
      });

      const stream = require('fs').createReadStream(filePath);
      stream.pipe(res);
    }

  } catch (err) {
    console.error('Stream media error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to stream media file'
    });
  }
});

// Update media file metadata
router.put('/:id', [
  authenticateToken,
  requireOwnershipOrAdmin('id', 'owner_id', 'media_files'),
  body('title')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Title must be less than 255 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('folderId')
    .optional()
    .isUUID()
    .withMessage('Folder ID must be a valid UUID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const mediaId = req.params.id;
    const { title, description, tags, folderId } = req.body;

    // Verify folder access if changing folder
    if (folderId) {
      const folderResult = await query(
        'SELECT owner_id FROM folders WHERE id = $1',
        [folderId]
      );

      if (folderResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Folder not found'
        });
      }

      const folder = folderResult.rows[0];
      if (folder.owner_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only move files to your own folders'
        });
      }
    }

    // Build update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramCount}`);
      values.push(title);
      paramCount++;
    }

    if (description !== undefined) {
      updates.push(`description = $${paramCount}`);
      values.push(description);
      paramCount++;
    }

    if (folderId !== undefined) {
      updates.push(`folder_id = $${paramCount}`);
      values.push(folderId);
      paramCount++;
    }

    if (updates.length > 0) {
      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(mediaId);

      const updateQuery = `
        UPDATE media_files 
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
        RETURNING id, title, description, folder_id, updated_at
      `;

      await query(updateQuery, values);
    }

    // Update tags if provided
    if (tags !== undefined && Array.isArray(tags)) {
      // Remove existing tags
      await query('DELETE FROM media_tags WHERE media_id = $1', [mediaId]);

      // Add new tags
      for (const tag of tags) {
        if (typeof tag === 'string' && tag.trim()) {
          await query(`
            INSERT INTO media_tags (media_id, tag_name)
            VALUES ($1, $2)
          `, [mediaId, tag.trim().toLowerCase()]);
        }
      }
    }

    // Log activity
    await query(`
      INSERT INTO activity_logs (user_id, action, resource_type, resource_id, details, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      req.user.id,
      'media.updated',
      'media',
      mediaId,
      JSON.stringify(req.body),
      req.ip,
      req.get('User-Agent')
    ]);

    res.json({
      message: 'Media file updated successfully'
    });

  } catch (err) {
    console.error('Update media error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update media file'
    });
  }
});

// Delete media file
router.delete('/:id', [
  authenticateToken,
  requireOwnershipOrAdmin('id', 'owner_id', 'media_files')
], async (req, res) => {
  try {
    const mediaId = req.params.id;

    // Get file path for cleanup
    const mediaResult = await query(
      'SELECT file_path, thumbnail_path FROM media_files WHERE id = $1',
      [mediaId]
    );

    if (mediaResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Media file not found'
      });
    }

    const media = mediaResult.rows[0];

    // Delete from database (cascades to media_tags)
    await query('DELETE FROM media_files WHERE id = $1', [mediaId]);

    // Delete physical files
    try {
      if (media.file_path) {
        await fs.unlink(media.file_path);
      }
      if (media.thumbnail_path) {
        await fs.unlink(media.thumbnail_path);
      }
    } catch (fileError) {
      console.error('Error deleting physical files:', fileError);
      // Continue - database cleanup is more important
    }

    // Log activity
    await query(`
      INSERT INTO activity_logs (user_id, action, resource_type, resource_id, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      req.user.id,
      'media.deleted',
      'media',
      mediaId,
      req.ip,
      req.get('User-Agent')
    ]);

    res.json({
      message: 'Media file deleted successfully'
    });

  } catch (err) {
    console.error('Delete media error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete media file'
    });
  }
});

// Get all unique tags
router.get('/tags/all', optionalAuth, async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;

    const tagsResult = await query(`
      SELECT DISTINCT mt.tag_name, COUNT(*) as usage_count
      FROM media_tags mt
      JOIN media_files mf ON mt.media_id = mf.id
      LEFT JOIN folders f ON mf.folder_id = f.id
      WHERE (mf.owner_id = $1 OR f.is_public = true OR mf.folder_id IS NULL)
      GROUP BY mt.tag_name
      ORDER BY usage_count DESC, mt.tag_name
    `, [userId]);

    res.json({
      tags: tagsResult.rows.map(row => ({
        name: row.tag_name,
        count: parseInt(row.usage_count)
      }))
    });

  } catch (err) {
    console.error('Get tags error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get tags'
    });
  }
});

module.exports = router;