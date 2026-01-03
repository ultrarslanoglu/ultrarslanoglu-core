const jwt = require('jsonwebtoken');
const config = require('../../config');
const { User } = require('../models');
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
        const user = await User.findById(req.session.userId);
        if (user && user.isActive) {
          req.user = user.toAuthJSON();
          return next();
        }
      }
      return res.status(401).json({ 
        success: false,
        error: 'Erişim token gereklidir',
        code: 'AUTH_TOKEN_REQUIRED'
      });
    }

    jwt.verify(token, config.jwt.secret, async (err, decoded) => {
      if (err) {
        const errorCode = err.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID';
        return res.status(403).json({ 
          success: false,
          error: 'Geçersiz veya süresi dolmuş token',
          code: errorCode
        });
      }

      // Kullanıcıyı veritabanından kontrol et
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        return res.status(404).json({ 
          success: false,
          error: 'Kullanıcı bulunamadı',
          code: 'USER_NOT_FOUND'
        });
      }

      if (!user.isActive) {
        return res.status(403).json({ 
          success: false,
          error: 'Hesap devre dışı bırakılmış',
          code: 'USER_INACTIVE'
        });
      }

      if (user.isLocked) {
        return res.status(403).json({ 
          success: false,
          error: 'Hesap geçici olarak kilitlendi',
          code: 'USER_LOCKED',
          lockUntil: user.lockUntil
        });
      }

      req.user = user.toAuthJSON();
      req.userFull = user; // Full user object for advanced operations

      next();
    });

  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Kimlik doğrulama başarısız',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Opsiyonel auth - token varsa doğrula yoksa devam et
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next();
    }

    jwt.verify(token, config.jwt.secret, async (err, decoded) => {
      if (!err && decoded) {
        const user = await User.findById(decoded.userId);
        if (user && user.isActive && !user.isLocked) {
          req.user = user.toAuthJSON();
          req.userFull = user;
        }
      }
      next();
    });

  } catch (error) {
    logger.error('Optional auth error:', error);
    next();
  }
};

/**
 * Rol bazlı yetkilendirme middleware factory
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        error: 'Kimlik doğrulama gerekli',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        error: 'Bu işlem için yetkiniz yok',
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: roles,
        userRole: req.user.role
      });
    }

    next();
  };
};

/**
 * Admin rolü kontrolü
 */
const requireAdmin = requireRole('admin', 'superadmin');

/**
 * Editor veya üstü rolü kontrolü
 */
const requireEditor = requireRole('editor', 'admin', 'superadmin');

/**
 * Superadmin rolü kontrolü
 */
const requireSuperAdmin = requireRole('superadmin');

/**
 * Kullanıcının kendi verisine erişim veya admin kontrolü
 */
const requireOwnerOrAdmin = (userIdParam = 'userId') => {
  return (req, res, next) => {
    const targetUserId = req.params[userIdParam] || req.body[userIdParam];
    
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        error: 'Kimlik doğrulama gerekli',
        code: 'AUTH_REQUIRED'
      });
    }

    const isOwner = req.user.id.toString() === targetUserId.toString();
    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ 
        success: false,
        error: 'Bu kaynağa erişim yetkiniz yok',
        code: 'ACCESS_DENIED'
      });
    }

    next();
  };
};

/**
 * JWT access token oluşturma
 */
const generateToken = (userId, expiresIn = '15m') => {
  return jwt.sign(
    { 
      userId,
      type: 'access',
      iat: Math.floor(Date.now() / 1000)
    },
    config.jwt.secret,
    { expiresIn }
  );
};

/**
 * JWT refresh token oluşturma
 */
const generateRefreshToken = (userId, expiresIn = '30d') => {
  return jwt.sign(
    { 
      userId,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000)
    },
    config.jwt.refreshSecret || config.jwt.secret,
    { expiresIn }
  );
};

/**
 * Refresh token doğrulama
 */
const verifyRefreshToken = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, config.jwt.refreshSecret || config.jwt.secret, (err, decoded) => {
      if (err) {
        reject(err);
      } else if (decoded.type !== 'refresh') {
        reject(new Error('Invalid token type'));
      } else {
        resolve(decoded);
      }
    });
  });
};

/**
 * Token pair oluşturma (access + refresh)
 */
const generateTokenPair = (userId) => {
  return {
    accessToken: generateToken(userId),
    refreshToken: generateRefreshToken(userId),
    tokenType: 'Bearer',
    expiresIn: 900 // 15 minutes in seconds
  };
};

/**
 * Email doğrulama token oluşturma
 */
const generateEmailVerificationToken = () => {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Şifre sıfırlama token oluşturma
 */
const generatePasswordResetToken = () => {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Rate limit kontrolü için kullanıcı kimliği
 */
const getUserIdentifier = (req) => {
  if (req.user && req.user.id) {
    return `user:${req.user.id}`;
  }
  return `ip:${req.ip || req.connection.remoteAddress}`;
};

module.exports = {
  // Middleware'ler
  authenticateToken,
  optionalAuth,
  requireRole,
  requireAdmin,
  requireEditor,
  requireSuperAdmin,
  requireOwnerOrAdmin,
  
  // Token fonksiyonları
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateTokenPair,
  generateEmailVerificationToken,
  generatePasswordResetToken,
  
  // Yardımcı fonksiyonlar
  getUserIdentifier
};
