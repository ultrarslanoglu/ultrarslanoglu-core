const jwt = require('jsonwebtoken');
const config = require('../../config');
const User = require('../models/User');
const logger = require('./logger');

/**
 * JWT token doğrulama middleware
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      // Session kontrolü
      if (req.session && req.session.userId) {
        req.user = { id: req.session.userId };
        return next();
      }
      return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, config.jwt.secret, async (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid or expired token' });
      }

      // Kullanıcıyı veritabanından kontrol et
      const user = await User.findById(decoded.userId);
      
      if (!user || !user.isActive) {
        return res.status(403).json({ error: 'User not found or inactive' });
      }

      req.user = {
        id: user._id,
        email: user.email,
        role: user.role
      };

      next();
    });

  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

/**
 * Admin rolü kontrolü
 */
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

/**
 * JWT token oluşturma
 */
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
};

/**
 * Refresh token oluşturma
 */
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: 'refresh' },
    config.jwt.secret,
    { expiresIn: '30d' }
  );
};

module.exports = {
  authenticateToken,
  requireAdmin,
  generateToken,
  generateRefreshToken
};
