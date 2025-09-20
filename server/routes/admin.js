const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get system dashboard stats (main endpoint)
router.get('/dashboard', [
  authenticateToken,
  requireAdmin
], async (req, res) => {
  try {
    // Get user stats
    const userStats = await query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE role = 'admin') as admin_users,
        COUNT(*) FILTER (WHERE role = 'user') as regular_users,
        COUNT(*) FILTER (WHERE role = 'viewer') as viewer_users,
        COUNT(*) FILTER (WHERE is_active = true) as active_users,
        COUNT(*) FILTER (WHERE last_login > CURRENT_DATE - INTERVAL '30 days') as active_last_30_days
      FROM users
    `);

    // Get media stats
    const mediaStats = await query(`
      SELECT 
        COUNT(*) as total_files,
        COUNT(*) FILTER (WHERE media_type = 'image') as total_images,
        COUNT(*) FILTER (WHERE media_type = 'video') as total_videos,
        COUNT(*) FILTER (WHERE media_type = 'movie') as total_movies,
        COALESCE(SUM(file_size), 0) as total_storage_bytes,
        COUNT(*) FILTER (WHERE created_at > CURRENT_DATE - INTERVAL '7 days') as files_last_7_days
      FROM media_files
    `);

    // Get folder stats
    const folderStats = await query(`
      SELECT 
        COUNT(*) as total_folders,
        COUNT(*) FILTER (WHERE folder_type = 'photos') as photo_folders,
        COUNT(*) FILTER (WHERE folder_type = 'videos') as video_folders,
        COUNT(*) FILTER (WHERE folder_type = 'movies') as movie_folders
      FROM folders
    `);

    // Get recent activity
    const recentActivity = await query(`
      SELECT 
        al.action,
        al.resource_type,
        al.created_at,
        u.email as user_email,
        u.first_name,
        u.last_name
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT 10
    `);

    res.json({
      stats: {
        users: userStats.rows[0],
        media: mediaStats.rows[0],
        folders: folderStats.rows[0]
      },
      recentActivity: recentActivity.rows
    });

  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get dashboard stats'
    });
  }
});

// Get dashboard stats specifically (frontend compatibility)
router.get('/dashboard/stats', [
  authenticateToken,
  requireAdmin
], async (req, res) => {
  // Prevent caching to ensure fresh data
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  try {
    // Get user stats
    const userStats = await query(`
      SELECT
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE role = 'admin') as admin_users,
        COUNT(*) FILTER (WHERE role = 'user') as regular_users,
        COUNT(*) FILTER (WHERE role = 'viewer') as viewer_users,
        COUNT(*) FILTER (WHERE is_active = true) as active_users,
        COUNT(*) FILTER (WHERE last_login > CURRENT_DATE - INTERVAL '30 days') as active_last_30_days
      FROM users
    `);

    // Get media stats
    const mediaStats = await query(`
      SELECT
        COUNT(*) as total_files,
        COUNT(*) FILTER (WHERE media_type = 'image') as total_images,
        COUNT(*) FILTER (WHERE media_type = 'video') as total_videos,
        COUNT(*) FILTER (WHERE media_type = 'movie') as total_movies,
        COALESCE(SUM(file_size), 0) as total_storage_bytes,
        COUNT(*) FILTER (WHERE created_at > CURRENT_DATE - INTERVAL '7 days') as files_last_7_days
      FROM media_files
    `);

    // Get folder stats
    const folderStats = await query(`
      SELECT
        COUNT(*) as total_folders,
        COUNT(*) FILTER (WHERE folder_type = 'photos') as photo_folders,
        COUNT(*) FILTER (WHERE folder_type = 'videos') as video_folders,
        COUNT(*) FILTER (WHERE folder_type = 'movies') as movie_folders
      FROM folders
    `);

    const users = userStats.rows[0] || {};
    const media = mediaStats.rows[0] || {};
    const folders = folderStats.rows[0] || {};

    const responseData = {
      users: {
        totalUsers: parseInt(users.total_users) || 0,
        adminUsers: parseInt(users.admin_users) || 0,
        regularUsers: parseInt(users.regular_users) || 0,
        viewerUsers: parseInt(users.viewer_users) || 0,
        activeUsers: parseInt(users.active_users) || 0,
        activeLast30Days: parseInt(users.active_last_30_days) || 0
      },
      media: {
        totalFiles: parseInt(media.total_files) || 0,
        totalImages: parseInt(media.total_images) || 0,
        totalVideos: parseInt(media.total_videos) || 0,
        totalMovies: parseInt(media.total_movies) || 0,
        totalStorageBytes: parseInt(media.total_storage_bytes) || 0,
        filesLast7Days: parseInt(media.files_last_7_days) || 0
      },
      folders: {
        totalFolders: parseInt(folders.total_folders) || 0,
        photoFolders: parseInt(folders.photo_folders) || 0,
        videoFolders: parseInt(folders.video_folders) || 0,
        movieFolders: parseInt(folders.movie_folders) || 0
      }
    };

    console.log('Dashboard stats response:', JSON.stringify(responseData, null, 2));
    res.json(responseData);

  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get dashboard stats'
    });
  }
});

// Get system settings
router.get('/settings', [
  authenticateToken,
  requireAdmin
], async (req, res) => {
  try {
    const settingsResult = await query(`
      SELECT setting_key, setting_value, setting_type, description, updated_at
      FROM system_settings
      ORDER BY setting_key
    `);

    const settings = {};
    settingsResult.rows.forEach(row => {
      let value = row.setting_value;
      
      // Convert value based on type
      switch (row.setting_type) {
        case 'number':
          value = parseFloat(value);
          break;
        case 'boolean':
          value = value === 'true';
          break;
        case 'json':
          try {
            value = JSON.parse(value);
          } catch (e) {
            value = row.setting_value;
          }
          break;
      }

      settings[row.setting_key] = {
        value,
        type: row.setting_type,
        description: row.description,
        updatedAt: row.updated_at
      };
    });

    res.json({ settings });

  } catch (err) {
    console.error('Get settings error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get system settings'
    });
  }
});

// Update system setting
router.put('/settings/:key', [
  authenticateToken,
  requireAdmin,
  body('value').exists().withMessage('Value is required'),
  body('type').optional().isIn(['string', 'number', 'boolean', 'json']).withMessage('Invalid type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { key } = req.params;
    const { value, type } = req.body;

    // Check if setting exists
    const existingSetting = await query(
      'SELECT setting_key, setting_type FROM system_settings WHERE setting_key = $1',
      [key]
    );

    if (existingSetting.rows.length === 0) {
      return res.status(404).json({
        error: 'Setting not found'
      });
    }

    const settingType = type || existingSetting.rows[0].setting_type;
    let settingValue = value;

    // Validate and convert value based on type
    switch (settingType) {
      case 'number':
        if (isNaN(value)) {
          return res.status(400).json({
            error: 'Invalid number value'
          });
        }
        settingValue = value.toString();
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          return res.status(400).json({
            error: 'Invalid boolean value'
          });
        }
        settingValue = value.toString();
        break;
      case 'json':
        try {
          settingValue = JSON.stringify(value);
        } catch (e) {
          return res.status(400).json({
            error: 'Invalid JSON value'
          });
        }
        break;
      default:
        settingValue = value.toString();
    }

    // Update setting
    await query(`
      UPDATE system_settings 
      SET setting_value = $1, setting_type = $2, updated_by = $3, updated_at = CURRENT_TIMESTAMP
      WHERE setting_key = $4
    `, [settingValue, settingType, req.user.id, key]);

    // Log activity
    await query(`
      INSERT INTO activity_logs (user_id, action, resource_type, details, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      req.user.id,
      'system.setting_updated',
      'setting',
      JSON.stringify({ key, value, type: settingType }),
      req.ip,
      req.get('User-Agent')
    ]);

    res.json({
      message: 'Setting updated successfully',
      setting: {
        key,
        value,
        type: settingType
      }
    });

  } catch (err) {
    console.error('Update setting error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update setting'
    });
  }
});

// Get activity logs
router.get('/activity', [
  authenticateToken,
  requireAdmin
], async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const action = req.query.action || '';
    const userId = req.query.userId || '';

    let whereClause = '';
    let queryParams = [limit, offset];
    let paramCount = 3;

    const conditions = [];

    if (action) {
      conditions.push(`al.action ILIKE $${paramCount}`);
      queryParams.push(`%${action}%`);
      paramCount++;
    }

    if (userId) {
      conditions.push(`al.user_id = $${paramCount}`);
      queryParams.push(userId);
      paramCount++;
    }

    if (conditions.length > 0) {
      whereClause = `WHERE ${conditions.join(' AND ')}`;
    }

    // Get activity logs with user info
    const logsResult = await query(`
      SELECT 
        al.id,
        al.action,
        al.resource_type,
        al.resource_id,
        al.details,
        al.ip_address,
        al.user_agent,
        al.created_at,
        u.email as user_email,
        u.first_name,
        u.last_name
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT $1 OFFSET $2
    `, queryParams);

    // Get total count
    const countParams = queryParams.slice(2); // Remove limit and offset
    const countResult = await query(`
      SELECT COUNT(*) as total 
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ${whereClause}
    `, countParams);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      logs: logsResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (err) {
    console.error('Get activity logs error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get activity logs'
    });
  }
});

// Get system info
router.get('/system-info', [
  authenticateToken,
  requireAdmin
], async (req, res) => {
  try {
    const systemInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    };

    res.json({ systemInfo });

  } catch (err) {
    console.error('Get system info error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get system info'
    });
  }
});

// Cleanup old activity logs
router.post('/cleanup-logs', [
  authenticateToken,
  requireAdmin,
  body('daysToKeep')
    .isInt({ min: 1, max: 365 })
    .withMessage('Days to keep must be between 1 and 365')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { daysToKeep } = req.body;

    const result = await query(`
      DELETE FROM activity_logs 
      WHERE created_at < CURRENT_DATE - INTERVAL '${daysToKeep} days'
    `);

    // Log the cleanup activity
    await query(`
      INSERT INTO activity_logs (user_id, action, details, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      req.user.id,
      'system.logs_cleanup',
      JSON.stringify({ daysToKeep, deletedCount: result.rowCount }),
      req.ip,
      req.get('User-Agent')
    ]);

    res.json({
      message: 'Activity logs cleaned up successfully',
      deletedCount: result.rowCount
    });

  } catch (err) {
    console.error('Cleanup logs error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to cleanup logs'
    });
  }
});

module.exports = router;