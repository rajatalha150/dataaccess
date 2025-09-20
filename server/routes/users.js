const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { authenticateToken, requireAdmin, requirePermission } = require('../middleware/auth');

const router = express.Router();

// Get all users (admin only)
router.get('/', [
  authenticateToken,
  requireAdmin
], async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    let whereClause = '';
    let queryParams = [limit, offset];

    if (search) {
      whereClause = `WHERE email ILIKE $3 OR first_name ILIKE $3 OR last_name ILIKE $3`;
      queryParams.push(`%${search}%`);
    }

    // Get users with pagination
    const usersResult = await query(`
      SELECT id, email, first_name, last_name, role, is_active, last_login, created_at
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `, queryParams);

    // Get total count
    const countResult = await query(`
      SELECT COUNT(*) as total FROM users ${whereClause}
    `, search ? [`%${search}%`] : []);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      users: usersResult.rows,
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
    console.error('Get users error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get users'
    });
  }
});

// Create new user (admin only)
router.post('/', [
  authenticateToken,
  requireAdmin,
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('firstName')
    .trim()
    .isLength({ min: 1 })
    .withMessage('First name is required'),
  body('lastName')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Last name is required'),
  body('role')
    .isIn(['admin', 'user', 'viewer'])
    .withMessage('Role must be admin, user, or viewer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password, firstName, lastName, role } = req.body;

    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        error: 'User already exists',
        message: 'A user with this email already exists'
      });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const userResult = await query(`
      INSERT INTO users (email, password_hash, first_name, last_name, role, is_active)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, email, first_name, last_name, role, is_active, created_at
    `, [email, passwordHash, firstName, lastName, role, true]);

    const newUser = userResult.rows[0];

    // Log activity
    await query(`
      INSERT INTO activity_logs (user_id, action, resource_type, resource_id, details, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      req.user.id,
      'user.created',
      'user',
      newUser.id,
      JSON.stringify({ email, role }),
      req.ip,
      req.get('User-Agent')
    ]);

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        role: newUser.role,
        isActive: newUser.is_active,
        createdAt: newUser.created_at
      }
    });

  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create user'
    });
  }
});

// Get user by ID
router.get('/:id', [
  authenticateToken,
  requireAdmin
], async (req, res) => {
  try {
    const userId = req.params.id;

    const userResult = await query(`
      SELECT id, email, first_name, last_name, role, is_active, last_login, created_at, updated_at
      FROM users WHERE id = $1
    `, [userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const user = userResult.rows[0];

    // Get user permissions
    const permissionsResult = await query(`
      SELECT permission, resource_type, resource_id
      FROM user_permissions
      WHERE user_id = $1
    `, [userId]);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        isActive: user.is_active,
        lastLogin: user.last_login,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        permissions: permissionsResult.rows
      }
    });

  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get user'
    });
  }
});

// Update user
router.put('/:id', [
  authenticateToken,
  requireAdmin,
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('First name cannot be empty'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Last name cannot be empty'),
  body('role')
    .optional()
    .isIn(['admin', 'user', 'viewer'])
    .withMessage('Role must be admin, user, or viewer'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const userId = req.params.id;
    const { firstName, lastName, role, isActive } = req.body;

    // Check if user exists
    const existingUser = await query(
      'SELECT id, email FROM users WHERE id = $1',
      [userId]
    );

    if (existingUser.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (firstName !== undefined) {
      updates.push(`first_name = $${paramCount}`);
      values.push(firstName);
      paramCount++;
    }

    if (lastName !== undefined) {
      updates.push(`last_name = $${paramCount}`);
      values.push(lastName);
      paramCount++;
    }

    if (role !== undefined) {
      updates.push(`role = $${paramCount}`);
      values.push(role);
      paramCount++;
    }

    if (isActive !== undefined) {
      updates.push(`is_active = $${paramCount}`);
      values.push(isActive);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'No valid fields to update'
      });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(userId);

    const updateQuery = `
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, email, first_name, last_name, role, is_active, updated_at
    `;

    const result = await query(updateQuery, values);
    const updatedUser = result.rows[0];

    // Log activity
    await query(`
      INSERT INTO activity_logs (user_id, action, resource_type, resource_id, details, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      req.user.id,
      'user.updated',
      'user',
      userId,
      JSON.stringify(req.body),
      req.ip,
      req.get('User-Agent')
    ]);

    res.json({
      message: 'User updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        role: updatedUser.role,
        isActive: updatedUser.is_active,
        updatedAt: updatedUser.updated_at
      }
    });

  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update user'
    });
  }
});

// Delete user
router.delete('/:id', [
  authenticateToken,
  requireAdmin
], async (req, res) => {
  try {
    const userId = req.params.id;

    // Prevent admin from deleting themselves
    if (userId === req.user.id) {
      return res.status(400).json({
        error: 'Cannot delete your own account'
      });
    }

    // Check if user exists
    const existingUser = await query(
      'SELECT id, email FROM users WHERE id = $1',
      [userId]
    );

    if (existingUser.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Delete user (cascade will handle related records)
    await query('DELETE FROM users WHERE id = $1', [userId]);

    // Log activity
    await query(`
      INSERT INTO activity_logs (user_id, action, resource_type, resource_id, details, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      req.user.id,
      'user.deleted',
      'user',
      userId,
      JSON.stringify({ email: existingUser.rows[0].email }),
      req.ip,
      req.get('User-Agent')
    ]);

    res.json({
      message: 'User deleted successfully'
    });

  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete user'
    });
  }
});

module.exports = router;