const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { authenticateToken, requireOwnershipOrAdmin, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Get all folders for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const parentId = req.query.parentId || null;
    const folderType = req.query.type || null;

    let whereClause = 'WHERE (owner_id = $1 OR is_public = true)';
    let queryParams = [userId];
    let paramCount = 2;

    if (parentId) {
      whereClause += ` AND parent_id = $${paramCount}`;
      queryParams.push(parentId);
      paramCount++;
    } else {
      whereClause += ' AND parent_id IS NULL';
    }

    if (folderType) {
      whereClause += ` AND folder_type = $${paramCount}`;
      queryParams.push(folderType);
    }

    const foldersResult = await query(`
      SELECT 
        f.id,
        f.name,
        f.description,
        f.parent_id,
        f.owner_id,
        f.is_public,
        f.folder_type,
        f.created_at,
        f.updated_at,
        u.first_name as owner_first_name,
        u.last_name as owner_last_name,
        COUNT(mf.id) as media_count,
        COUNT(cf.id) as child_folder_count
      FROM folders f
      LEFT JOIN users u ON f.owner_id = u.id
      LEFT JOIN media_files mf ON f.id = mf.folder_id
      LEFT JOIN folders cf ON f.id = cf.parent_id
      ${whereClause}
      GROUP BY f.id, u.first_name, u.last_name
      ORDER BY f.name
    `, queryParams);

    res.json({
      folders: foldersResult.rows.map(folder => ({
        id: folder.id,
        name: folder.name,
        description: folder.description,
        parentId: folder.parent_id,
        ownerId: folder.owner_id,
        isPublic: folder.is_public,
        folderType: folder.folder_type,
        createdAt: folder.created_at,
        updatedAt: folder.updated_at,
        owner: {
          firstName: folder.owner_first_name,
          lastName: folder.owner_last_name
        },
        mediaCount: parseInt(folder.media_count),
        childFolderCount: parseInt(folder.child_folder_count),
        canEdit: folder.owner_id === userId || req.user.role === 'admin'
      }))
    });

  } catch (err) {
    console.error('Get folders error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get folders'
    });
  }
});

// Create new folder
router.post('/', [
  authenticateToken,
  body('name')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Folder name must be between 1 and 255 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  body('parentId')
    .optional()
    .isUUID()
    .withMessage('Parent ID must be a valid UUID'),
  body('folderType')
    .optional()
    .isIn(['general', 'photos', 'videos', 'movies'])
    .withMessage('Folder type must be general, photos, videos, or movies'),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { name, description, parentId, folderType, isPublic } = req.body;
    const userId = req.user.id;

    // Check if parent folder exists and user has access
    if (parentId) {
      const parentResult = await query(
        'SELECT id, owner_id FROM folders WHERE id = $1',
        [parentId]
      );

      if (parentResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Parent folder not found'
        });
      }

      const parent = parentResult.rows[0];
      if (parent.owner_id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only create folders in your own folders'
        });
      }
    }

    // Check for duplicate folder name in the same parent
    const duplicateCheck = await query(`
      SELECT id FROM folders 
      WHERE name = $1 AND owner_id = $2 AND 
      ${parentId ? 'parent_id = $3' : 'parent_id IS NULL'}
    `, parentId ? [name, userId, parentId] : [name, userId]);

    if (duplicateCheck.rows.length > 0) {
      return res.status(400).json({
        error: 'Folder already exists',
        message: 'A folder with this name already exists in the same location'
      });
    }

    // Create folder
    const folderResult = await query(`
      INSERT INTO folders (name, description, parent_id, owner_id, folder_type, is_public)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, description, parent_id, owner_id, folder_type, is_public, created_at
    `, [
      name,
      description || null,
      parentId || null,
      userId,
      folderType || 'general',
      isPublic || false
    ]);

    const newFolder = folderResult.rows[0];

    // Log activity
    await query(`
      INSERT INTO activity_logs (user_id, action, resource_type, resource_id, details, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      userId,
      'folder.created',
      'folder',
      newFolder.id,
      JSON.stringify({ name, folderType: folderType || 'general' }),
      req.ip,
      req.get('User-Agent')
    ]);

    res.status(201).json({
      message: 'Folder created successfully',
      folder: {
        id: newFolder.id,
        name: newFolder.name,
        description: newFolder.description,
        parentId: newFolder.parent_id,
        ownerId: newFolder.owner_id,
        folderType: newFolder.folder_type,
        isPublic: newFolder.is_public,
        createdAt: newFolder.created_at,
        mediaCount: 0,
        childFolderCount: 0,
        canEdit: true
      }
    });

  } catch (err) {
    console.error('Create folder error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create folder'
    });
  }
});

// Get folder by ID with contents
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const folderId = req.params.id;
    const userId = req.user ? req.user.id : null;

    // Get folder details
    const folderResult = await query(`
      SELECT 
        f.id,
        f.name,
        f.description,
        f.parent_id,
        f.owner_id,
        f.is_public,
        f.folder_type,
        f.created_at,
        f.updated_at,
        u.first_name as owner_first_name,
        u.last_name as owner_last_name
      FROM folders f
      LEFT JOIN users u ON f.owner_id = u.id
      WHERE f.id = $1
    `, [folderId]);

    if (folderResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Folder not found'
      });
    }

    const folder = folderResult.rows[0];

    // Check access permissions
    const hasAccess = folder.is_public || 
                     (userId && folder.owner_id === userId) || 
                     (req.user && req.user.role === 'admin');

    if (!hasAccess) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You do not have permission to view this folder'
      });
    }

    // Get child folders
    const childFoldersResult = await query(`
      SELECT 
        id, name, description, folder_type, is_public, created_at,
        COUNT(mf.id) as media_count
      FROM folders f
      LEFT JOIN media_files mf ON f.id = mf.folder_id
      WHERE f.parent_id = $1
      GROUP BY f.id
      ORDER BY f.name
    `, [folderId]);

    // Get media files in this folder
    const mediaFilesResult = await query(`
      SELECT 
        id, filename, original_filename, file_size, mime_type, media_type,
        width, height, duration, thumbnail_path, title, description,
        created_at
      FROM media_files
      WHERE folder_id = $1
      ORDER BY created_at DESC
    `, [folderId]);

    res.json({
      folder: {
        id: folder.id,
        name: folder.name,
        description: folder.description,
        parentId: folder.parent_id,
        ownerId: folder.owner_id,
        isPublic: folder.is_public,
        folderType: folder.folder_type,
        createdAt: folder.created_at,
        updatedAt: folder.updated_at,
        owner: {
          firstName: folder.owner_first_name,
          lastName: folder.owner_last_name
        },
        canEdit: userId && (folder.owner_id === userId || req.user.role === 'admin')
      },
      childFolders: childFoldersResult.rows.map(child => ({
        id: child.id,
        name: child.name,
        description: child.description,
        folderType: child.folder_type,
        isPublic: child.is_public,
        createdAt: child.created_at,
        mediaCount: parseInt(child.media_count)
      })),
      mediaFiles: mediaFilesResult.rows.map(file => ({
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
        createdAt: file.created_at
      }))
    });

  } catch (err) {
    console.error('Get folder error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get folder'
    });
  }
});

// Update folder
router.put('/:id', [
  authenticateToken,
  requireOwnershipOrAdmin('id', 'owner_id', 'folders'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Folder name must be between 1 and 255 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  body('folderType')
    .optional()
    .isIn(['general', 'photos', 'videos', 'movies'])
    .withMessage('Folder type must be general, photos, videos, or movies'),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const folderId = req.params.id;
    const { name, description, folderType, isPublic } = req.body;

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }

    if (description !== undefined) {
      updates.push(`description = $${paramCount}`);
      values.push(description);
      paramCount++;
    }

    if (folderType !== undefined) {
      updates.push(`folder_type = $${paramCount}`);
      values.push(folderType);
      paramCount++;
    }

    if (isPublic !== undefined) {
      updates.push(`is_public = $${paramCount}`);
      values.push(isPublic);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'No valid fields to update'
      });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(folderId);

    const updateQuery = `
      UPDATE folders 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, name, description, folder_type, is_public, updated_at
    `;

    const result = await query(updateQuery, values);
    const updatedFolder = result.rows[0];

    // Log activity
    await query(`
      INSERT INTO activity_logs (user_id, action, resource_type, resource_id, details, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      req.user.id,
      'folder.updated',
      'folder',
      folderId,
      JSON.stringify(req.body),
      req.ip,
      req.get('User-Agent')
    ]);

    res.json({
      message: 'Folder updated successfully',
      folder: {
        id: updatedFolder.id,
        name: updatedFolder.name,
        description: updatedFolder.description,
        folderType: updatedFolder.folder_type,
        isPublic: updatedFolder.is_public,
        updatedAt: updatedFolder.updated_at
      }
    });

  } catch (err) {
    console.error('Update folder error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update folder'
    });
  }
});

// Delete folder
router.delete('/:id', [
  authenticateToken,
  requireOwnershipOrAdmin('id', 'owner_id', 'folders')
], async (req, res) => {
  try {
    const folderId = req.params.id;

    // Check if folder has child folders or media files
    const childrenResult = await query(`
      SELECT 
        (SELECT COUNT(*) FROM folders WHERE parent_id = $1) as child_folders,
        (SELECT COUNT(*) FROM media_files WHERE folder_id = $1) as media_files
    `, [folderId]);

    const children = childrenResult.rows[0];

    if (parseInt(children.child_folders) > 0 || parseInt(children.media_files) > 0) {
      return res.status(400).json({
        error: 'Folder not empty',
        message: 'Cannot delete folder that contains subfolders or media files'
      });
    }

    // Delete folder
    await query('DELETE FROM folders WHERE id = $1', [folderId]);

    // Log activity
    await query(`
      INSERT INTO activity_logs (user_id, action, resource_type, resource_id, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      req.user.id,
      'folder.deleted',
      'folder',
      folderId,
      req.ip,
      req.get('User-Agent')
    ]);

    res.json({
      message: 'Folder deleted successfully'
    });

  } catch (err) {
    console.error('Delete folder error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete folder'
    });
  }
});

// Get folder breadcrumb path
router.get('/:id/breadcrumb', optionalAuth, async (req, res) => {
  try {
    const folderId = req.params.id;
    const userId = req.user ? req.user.id : null;

    const breadcrumb = [];
    let currentId = folderId;

    while (currentId) {
      const folderResult = await query(`
        SELECT id, name, parent_id, owner_id, is_public
        FROM folders WHERE id = $1
      `, [currentId]);

      if (folderResult.rows.length === 0) {
        break;
      }

      const folder = folderResult.rows[0];

      // Check access
      const hasAccess = folder.is_public || 
                       (userId && folder.owner_id === userId) || 
                       (req.user && req.user.role === 'admin');

      if (!hasAccess) {
        return res.status(403).json({
          error: 'Access denied'
        });
      }

      breadcrumb.unshift({
        id: folder.id,
        name: folder.name
      });

      currentId = folder.parent_id;
    }

    res.json({ breadcrumb });

  } catch (err) {
    console.error('Get breadcrumb error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get folder breadcrumb'
    });
  }
});

module.exports = router;