const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

// Verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'No token provided'
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists and is active
    const userResult = await query(
      'SELECT id, email, role, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'User not found'
      });
    }
    
    const user = userResult.rows[0];
    
    if (!user.is_active) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'User account is disabled'
      });
    }
    
    // Add user info to request
    req.user = user;
    next();
    
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Invalid token'
      });
    }
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Token expired'
      });
    }
    
    console.error('Auth middleware error:', err);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Authentication failed'
    });
  }
};

// Check if user has admin role
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Access denied',
      message: 'Admin privileges required'
    });
  }
  next();
};

// Check specific permission
const requirePermission = (permission, resourceType = null) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      
      // Admin users have all permissions
      if (req.user.role === 'admin') {
        return next();
      }
      
      // Check user permissions
      let permissionQuery = `
        SELECT 1 FROM user_permissions 
        WHERE user_id = $1 AND permission = $2
      `;
      let queryParams = [userId, permission];
      
      if (resourceType) {
        permissionQuery += ' AND (resource_type = $3 OR resource_type IS NULL)';
        queryParams.push(resourceType);
      }
      
      const result = await query(permissionQuery, queryParams);
      
      if (result.rows.length === 0) {
        return res.status(403).json({
          error: 'Access denied',
          message: `Permission '${permission}' required`
        });
      }
      
      next();
      
    } catch (err) {
      console.error('Permission check error:', err);
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Permission check failed'
      });
    }
  };
};

// Check resource ownership or admin
const requireOwnershipOrAdmin = (resourceIdParam = 'id', ownerField = 'owner_id', tableName) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const resourceId = req.params[resourceIdParam];
      
      // Admin users can access everything
      if (req.user.role === 'admin') {
        return next();
      }
      
      // Check if user owns the resource
      const result = await query(
        `SELECT ${ownerField} FROM ${tableName} WHERE id = $1`,
        [resourceId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Not found',
          message: 'Resource not found'
        });
      }
      
      const resource = result.rows[0];
      
      if (resource[ownerField] !== userId) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You can only access your own resources'
        });
      }
      
      next();
      
    } catch (err) {
      console.error('Ownership check error:', err);
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Ownership check failed'
      });
    }
  };
};

// Optional authentication (for public resources)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      req.user = null;
      return next();
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const userResult = await query(
      'SELECT id, email, role, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );
    
    if (userResult.rows.length > 0 && userResult.rows[0].is_active) {
      req.user = userResult.rows[0];
    } else {
      req.user = null;
    }
    
    next();
    
  } catch (err) {
    // If token is invalid, just continue without user
    req.user = null;
    next();
  }
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requirePermission,
  requireOwnershipOrAdmin,
  optionalAuth
};