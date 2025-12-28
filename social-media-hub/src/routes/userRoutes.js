const express = require('express');
const router = express.Router();
const { User, Token } = require('../models');
const { 
  generateTokenPair, 
  verifyRefreshToken,
  authenticateToken,
  requireAdmin,
  requireOwnerOrAdmin,
  generateEmailVerificationToken,
  generatePasswordResetToken
} = require('../utils/auth');
const { authLimiter } = require('../utils/rateLimiter');
const logger = require('../utils/logger');

/**
 * User Authentication Routes
 * Kullanıcı kaydı, girişi, şifre yönetimi
 */

/**
 * @route   POST /api/user/register
 * @desc    Yeni kullanıcı kaydı
 * @access  Public
 */
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { email, password, username, fullName } = req.body;

    // Validasyon
    if (!email || !password || !username) {
      return res.status(400).json({
        success: false,
        error: 'Email, şifre ve kullanıcı adı gereklidir',
        code: 'MISSING_FIELDS'
      });
    }

    // Email format kontrolü
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Geçerli bir email adresi giriniz',
        code: 'INVALID_EMAIL'
      });
    }

    // Şifre uzunluk kontrolü
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Şifre en az 8 karakter olmalıdır',
        code: 'PASSWORD_TOO_SHORT'
      });
    }

    // Kullanıcı adı uzunluk kontrolü
    if (username.length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Kullanıcı adı en az 3 karakter olmalıdır',
        code: 'USERNAME_TOO_SHORT'
      });
    }

    // Email veya username zaten var mı?
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }]
    });

    if (existingUser) {
      const field = existingUser.email === email.toLowerCase() ? 'Email' : 'Kullanıcı adı';
      return res.status(409).json({
        success: false,
        error: `${field} zaten kullanımda`,
        code: 'USER_EXISTS',
        field: field.toLowerCase()
      });
    }

    // Yeni kullanıcı oluştur
    const user = new User({
      email: email.toLowerCase(),
      password,
      username,
      fullName,
      role: 'viewer', // Varsayılan rol
      emailVerificationToken: generateEmailVerificationToken(),
      emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000 // 24 saat
    });

    await user.save();

    // Token pair oluştur
    const tokens = generateTokenPair(user._id);

    // TODO: Email doğrulama maili gönder
    logger.info(`Yeni kullanıcı kaydedildi: ${user.email}`);

    res.status(201).json({
      success: true,
      message: 'Kullanıcı başarıyla oluşturuldu. Lütfen email adresinizi doğrulayın.',
      data: {
        user: user.toAuthJSON(),
        ...tokens
      }
    });

  } catch (error) {
    logger.error('Register error:', error);
    
    // Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: messages.join(', '),
        code: 'VALIDATION_ERROR'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Kayıt işlemi başarısız oldu',
      code: 'REGISTER_ERROR'
    });
  }
});

/**
 * @route   POST /api/user/login
 * @desc    Kullanıcı girişi
 * @access  Public
 */
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validasyon
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email ve şifre gereklidir',
        code: 'MISSING_CREDENTIALS'
      });
    }

    // Kullanıcıyı bul ve şifre doğrula
    let user;
    try {
      user = await User.findByCredentials(email.toLowerCase(), password);
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: error.message,
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Token pair oluştur
    const tokens = generateTokenPair(user._id);

    // Session'a kaydet (opsiyonel)
    if (req.session) {
      req.session.userId = user._id;
    }

    logger.info(`Kullanıcı giriş yaptı: ${user.email}`);

    res.json({
      success: true,
      message: 'Giriş başarılı',
      data: {
        user: user.toAuthJSON(),
        ...tokens
      }
    });

  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Giriş işlemi başarısız oldu',
      code: 'LOGIN_ERROR'
    });
  }
});

/**
 * @route   POST /api/user/refresh
 * @desc    Access token yenileme
 * @access  Public (refresh token gerekli)
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token gereklidir',
        code: 'MISSING_REFRESH_TOKEN'
      });
    }

    // Refresh token doğrula
    let decoded;
    try {
      decoded = await verifyRefreshToken(refreshToken);
    } catch (error) {
      return res.status(403).json({
        success: false,
        error: 'Geçersiz veya süresi dolmuş refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    // Kullanıcıyı kontrol et
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Kullanıcı bulunamadı veya aktif değil',
        code: 'USER_NOT_FOUND'
      });
    }

    // Yeni token pair oluştur
    const tokens = generateTokenPair(user._id);

    res.json({
      success: true,
      message: 'Token yenilendi',
      data: tokens
    });

  } catch (error) {
    logger.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      error: 'Token yenileme başarısız oldu',
      code: 'REFRESH_ERROR'
    });
  }
});

/**
 * @route   POST /api/user/logout
 * @desc    Kullanıcı çıkışı
 * @access  Private
 */
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Session temizle
    if (req.session) {
      req.session.destroy();
    }

    // TODO: Token'ı blacklist'e ekle (Redis kullanılabilir)
    
    logger.info(`Kullanıcı çıkış yaptı: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Çıkış başarılı'
    });

  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Çıkış işlemi başarısız oldu',
      code: 'LOGOUT_ERROR'
    });
  }
});

/**
 * @route   GET /api/user/me
 * @desc    Mevcut kullanıcı bilgilerini getir
 * @access  Private
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Kullanıcı bulunamadı',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: {
        user: user.toAuthJSON()
      }
    });

  } catch (error) {
    logger.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      error: 'Kullanıcı bilgileri alınamadı',
      code: 'GET_USER_ERROR'
    });
  }
});

/**
 * @route   PUT /api/user/me
 * @desc    Kullanıcı bilgilerini güncelle
 * @access  Private
 */
router.put('/me', authenticateToken, async (req, res) => {
  try {
    const { fullName, bio, website, avatar, preferences } = req.body;
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Kullanıcı bulunamadı',
        code: 'USER_NOT_FOUND'
      });
    }

    // Güncellenebilir alanlar
    if (fullName !== undefined) user.fullName = fullName;
    if (bio !== undefined) user.bio = bio;
    if (website !== undefined) user.website = website;
    if (avatar !== undefined) user.avatar = avatar;
    if (preferences !== undefined) {
      user.preferences = { ...user.preferences, ...preferences };
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profil güncellendi',
      data: {
        user: user.toAuthJSON()
      }
    });

  } catch (error) {
    logger.error('Update user error:', error);
    res.status(500).json({
      success: false,
      error: 'Profil güncellenemedi',
      code: 'UPDATE_USER_ERROR'
    });
  }
});

/**
 * @route   POST /api/user/change-password
 * @desc    Şifre değiştirme
 * @access  Private
 */
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Mevcut şifre ve yeni şifre gereklidir',
        code: 'MISSING_FIELDS'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Yeni şifre en az 8 karakter olmalıdır',
        code: 'PASSWORD_TOO_SHORT'
      });
    }

    const user = await User.findById(req.user.id).select('+password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Kullanıcı bulunamadı',
        code: 'USER_NOT_FOUND'
      });
    }

    // Mevcut şifre doğru mu?
    const isMatch = await user.comparePassword(currentPassword);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Mevcut şifre yanlış',
        code: 'INVALID_PASSWORD'
      });
    }

    // Yeni şifreyi kaydet
    user.password = newPassword;
    await user.save();

    logger.info(`Kullanıcı şifresini değiştirdi: ${user.email}`);

    res.json({
      success: true,
      message: 'Şifre başarıyla değiştirildi'
    });

  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Şifre değiştirilemedi',
      code: 'CHANGE_PASSWORD_ERROR'
    });
  }
});

/**
 * @route   POST /api/user/forgot-password
 * @desc    Şifre sıfırlama isteği
 * @access  Public
 */
router.post('/forgot-password', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email gereklidir',
        code: 'MISSING_EMAIL'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    
    // Güvenlik: Kullanıcı yoksa bile başarılı mesajı döndür
    if (!user) {
      return res.json({
        success: true,
        message: 'Eğer bu email kayıtlıysa, şifre sıfırlama linki gönderildi'
      });
    }

    // Şifre sıfırlama token oluştur
    const resetToken = generatePasswordResetToken();
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 saat
    await user.save();

    // TODO: Email gönder
    const resetUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
    logger.info(`Şifre sıfırlama isteği: ${user.email} - ${resetUrl}`);

    res.json({
      success: true,
      message: 'Şifre sıfırlama linki email adresinize gönderildi'
    });

  } catch (error) {
    logger.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      error: 'Şifre sıfırlama isteği gönderilemedi',
      code: 'FORGOT_PASSWORD_ERROR'
    });
  }
});

/**
 * @route   POST /api/user/reset-password/:token
 * @desc    Şifre sıfırlama
 * @access  Public
 */
router.post('/reset-password/:token', authLimiter, async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Yeni şifre gereklidir',
        code: 'MISSING_PASSWORD'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Şifre en az 8 karakter olmalıdır',
        code: 'PASSWORD_TOO_SHORT'
      });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Geçersiz veya süresi dolmuş token',
        code: 'INVALID_TOKEN'
      });
    }

    // Şifreyi güncelle
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    logger.info(`Şifre sıfırlandı: ${user.email}`);

    res.json({
      success: true,
      message: 'Şifre başarıyla sıfırlandı'
    });

  } catch (error) {
    logger.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      error: 'Şifre sıfırlanamadı',
      code: 'RESET_PASSWORD_ERROR'
    });
  }
});

/**
 * @route   POST /api/user/verify-email/:token
 * @desc    Email doğrulama
 * @access  Public
 */
router.post('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Geçersiz veya süresi dolmuş token',
        code: 'INVALID_TOKEN'
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    logger.info(`Email doğrulandı: ${user.email}`);

    res.json({
      success: true,
      message: 'Email başarıyla doğrulandı'
    });

  } catch (error) {
    logger.error('Verify email error:', error);
    res.status(500).json({
      success: false,
      error: 'Email doğrulanamadı',
      code: 'VERIFY_EMAIL_ERROR'
    });
  }
});

/**
 * @route   GET /api/user/list
 * @desc    Tüm kullanıcıları listele (Admin)
 * @access  Private/Admin
 */
router.get('/list', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, role, isActive } = req.query;

    const query = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    logger.error('List users error:', error);
    res.status(500).json({
      success: false,
      error: 'Kullanıcılar listelenemedi',
      code: 'LIST_USERS_ERROR'
    });
  }
});

/**
 * @route   GET /api/user/:userId
 * @desc    Kullanıcı detayı (kendi veya admin)
 * @access  Private
 */
router.get('/:userId', authenticateToken, requireOwnerOrAdmin('userId'), async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Kullanıcı bulunamadı',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: {
        user: user.toAuthJSON()
      }
    });

  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Kullanıcı bilgileri alınamadı',
      code: 'GET_USER_ERROR'
    });
  }
});

/**
 * @route   PUT /api/user/:userId/role
 * @desc    Kullanıcı rolünü değiştir (Admin)
 * @access  Private/Admin
 */
router.put('/:userId/role', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;

    if (!['viewer', 'editor', 'admin', 'superadmin'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Geçersiz rol',
        code: 'INVALID_ROLE'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { role },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Kullanıcı bulunamadı',
        code: 'USER_NOT_FOUND'
      });
    }

    logger.info(`Kullanıcı rolü değiştirildi: ${user.email} -> ${role}`);

    res.json({
      success: true,
      message: 'Rol güncellendi',
      data: {
        user: user.toAuthJSON()
      }
    });

  } catch (error) {
    logger.error('Update role error:', error);
    res.status(500).json({
      success: false,
      error: 'Rol güncellenemedi',
      code: 'UPDATE_ROLE_ERROR'
    });
  }
});

/**
 * @route   DELETE /api/user/:userId
 * @desc    Kullanıcıyı devre dışı bırak (Admin)
 * @access  Private/Admin
 */
router.delete('/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { isActive: false },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Kullanıcı bulunamadı',
        code: 'USER_NOT_FOUND'
      });
    }

    // Kullanıcının tüm token'larını iptal et
    await Token.revokeAllUserTokens(user._id, 'User deactivated');

    logger.info(`Kullanıcı devre dışı bırakıldı: ${user.email}`);

    res.json({
      success: true,
      message: 'Kullanıcı devre dışı bırakıldı'
    });

  } catch (error) {
    logger.error('Deactivate user error:', error);
    res.status(500).json({
      success: false,
      error: 'Kullanıcı devre dışı bırakılamadı',
      code: 'DEACTIVATE_USER_ERROR'
    });
  }
});

module.exports = router;
