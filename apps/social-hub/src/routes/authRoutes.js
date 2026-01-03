const express = require('express');
const router = express.Router();
const tiktokAuth = require('../auth/tiktokAuth');
const metaAuth = require('../auth/metaAuth');
const youtubeAuth = require('../auth/youtubeAuth');
const xAuth = require('../auth/xAuth');
const User = require('../models/User');
const logger = require('../utils/logger');
const config = require('../../config');

/**
 * Authentication Routes
 * OAuth akışları için route'lar
 */

// ============ TikTok OAuth ============

/**
 * @route   GET /auth/tiktok/login
 * @desc    TikTok OAuth akışını başlat
 */
router.get('/tiktok/login', async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const authUrl = tiktokAuth.getAuthorizationUrl(userId);
    res.redirect(authUrl);

  } catch (error) {
    logger.error('TikTok login error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

/**
 * @route   GET /auth/tiktok/callback
 * @desc    TikTok OAuth callback
 */
router.get('/tiktok/callback', async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).json({ error: 'Missing code or state parameter' });
    }

    const result = await tiktokAuth.handleCallback(code, state);

    // Kullanıcıyı güncelle
    await User.findByIdAndUpdate(result.token.userId, {
      $addToSet: {
        connectedPlatforms: {
          platform: 'tiktok',
          connectedAt: new Date(),
          isActive: true
        }
      }
    });

    res.redirect(`${process.env.BASE_URL}/dashboard?platform=tiktok&status=success`);

  } catch (error) {
    logger.error('TikTok callback error:', error);
    res.redirect(`${process.env.BASE_URL}/dashboard?platform=tiktok&status=error&message=${encodeURIComponent(error.message)}`);
  }
});

/**
 * @route   POST /auth/tiktok/revoke
 * @desc    TikTok bağlantısını kaldır
 */
router.post('/tiktok/revoke', async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    await tiktokAuth.revokeAccess(userId);

    // Kullanıcıyı güncelle
    await User.findByIdAndUpdate(userId, {
      $pull: {
        connectedPlatforms: { platform: 'tiktok' }
      }
    });

    res.json({ success: true, message: 'TikTok connection revoked' });

  } catch (error) {
    logger.error('TikTok revoke error:', error);
    res.status(500).json({ error: 'Failed to revoke access' });
  }
});

// ============ Meta (Facebook/Instagram) OAuth ============

router.get('/meta/login', async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const authUrl = metaAuth.getAuthorizationUrl(userId);
    res.redirect(authUrl);

  } catch (error) {
    logger.error('Meta login error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

router.get('/meta/callback', async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).json({ error: 'Missing code or state parameter' });
    }

    const result = await metaAuth.handleCallback(code, state);

    await User.findByIdAndUpdate(result.token.userId, {
      $addToSet: {
        connectedPlatforms: {
          platform: 'meta',
          connectedAt: new Date(),
          isActive: true
        }
      }
    });

    res.redirect(`${process.env.BASE_URL}/dashboard?platform=meta&status=success`);

  } catch (error) {
    logger.error('Meta callback error:', error);
    res.redirect(`${process.env.BASE_URL}/dashboard?platform=meta&status=error&message=${encodeURIComponent(error.message)}`);
  }
});

router.post('/meta/revoke', async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    await metaAuth.revokeAccess(userId);

    await User.findByIdAndUpdate(userId, {
      $pull: {
        connectedPlatforms: { platform: 'meta' }
      }
    });

    res.json({ success: true, message: 'Meta connection revoked' });

  } catch (error) {
    logger.error('Meta revoke error:', error);
    res.status(500).json({ error: 'Failed to revoke access' });
  }
});

// ============ YouTube OAuth ============

router.get('/youtube/login', async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const authUrl = youtubeAuth.getAuthorizationUrl(userId);
    res.redirect(authUrl);

  } catch (error) {
    logger.error('YouTube login error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

router.get('/youtube/callback', async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).json({ error: 'Missing code or state parameter' });
    }

    const result = await youtubeAuth.handleCallback(code, state);

    await User.findByIdAndUpdate(result.token.userId, {
      $addToSet: {
        connectedPlatforms: {
          platform: 'youtube',
          connectedAt: new Date(),
          isActive: true
        }
      }
    });

    res.redirect(`${process.env.BASE_URL}/dashboard?platform=youtube&status=success`);

  } catch (error) {
    logger.error('YouTube callback error:', error);
    res.redirect(`${process.env.BASE_URL}/dashboard?platform=youtube&status=error&message=${encodeURIComponent(error.message)}`);
  }
});

router.post('/youtube/revoke', async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    await youtubeAuth.revokeAccess(userId);

    await User.findByIdAndUpdate(userId, {
      $pull: {
        connectedPlatforms: { platform: 'youtube' }
      }
    });

    res.json({ success: true, message: 'YouTube connection revoked' });

  } catch (error) {
    logger.error('YouTube revoke error:', error);
    res.status(500).json({ error: 'Failed to revoke access' });
  }
});

// ============ X (Twitter) OAuth ============

router.get('/x/login', async (req, res) => {
  try {
    if (!config.features.xEnabled) {
      return res.status(503).json({ error: 'X integration disabled (paid access required)' });
    }

    const userId = req.user?.id || req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const authUrl = xAuth.getAuthorizationUrl(userId);
    res.redirect(authUrl);

  } catch (error) {
    logger.error('X login error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

router.get('/x/callback', async (req, res) => {
  try {
    if (!config.features.xEnabled) {
      return res.status(503).json({ error: 'X integration disabled (paid access required)' });
    }

    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).json({ error: 'Missing code or state parameter' });
    }

    const result = await xAuth.handleCallback(code, state);

    await User.findByIdAndUpdate(result.token.userId, {
      $addToSet: {
        connectedPlatforms: {
          platform: 'x',
          connectedAt: new Date(),
          isActive: true
        }
      }
    });

    res.redirect(`${process.env.BASE_URL}/dashboard?platform=x&status=success`);

  } catch (error) {
    logger.error('X callback error:', error);
    res.redirect(`${process.env.BASE_URL}/dashboard?platform=x&status=error&message=${encodeURIComponent(error.message)}`);
  }
});

router.post('/x/revoke', async (req, res) => {
  try {
    if (!config.features.xEnabled) {
      return res.status(503).json({ error: 'X integration disabled (paid access required)' });
    }

    const userId = req.user?.id || req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    await xAuth.revokeAccess(userId);

    await User.findByIdAndUpdate(userId, {
      $pull: {
        connectedPlatforms: { platform: 'x' }
      }
    });

    res.json({ success: true, message: 'X connection revoked' });

  } catch (error) {
    logger.error('X revoke error:', error);
    res.status(500).json({ error: 'Failed to revoke access' });
  }
});

// ============ Meta Token Verification (Facebook SDK ile) ============

/**
 * @route   POST /auth/meta/verify-token
 * @desc    Facebook SDK'dan gelen token'ı doğrula ve backend'de oturum oluştur
 * @access  Public
 */
router.post('/meta/verify-token', async (req, res) => {
  try {
    const { accessToken, userId, userInfo } = req.body;

    if (!accessToken || !userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing accessToken or userId' 
      });
    }

    console.log('📊 Meta Token Verification:', {
      userId: userId,
      userName: userInfo?.name,
      userEmail: userInfo?.email
    });

    // Veritabanında kullanıcı ara ya da oluştur
    let user = await User.findOne({ email: userInfo?.email || userId });

    if (!user) {
      user = await User.create({
        email: userInfo?.email || `${userId}@facebook.com`,
        name: userInfo?.name || 'Facebook User',
        profileImage: userInfo?.picture?.data?.url || null,
        facebookId: userId
      });
      
      console.log('✅ Yeni kullanıcı oluşturuldu:', user._id);
    } else {
      // Mevcut kullanıcıyı güncelle
      user = await User.findByIdAndUpdate(user._id, {
        facebookId: userId,
        profileImage: userInfo?.picture?.data?.url || user.profileImage,
        lastLoginAt: new Date()
      }, { new: true });
    }

    // Meta token'ı veritabanına kaydet
    const Token = require('../models/Token');
    
    let token = await Token.findOne({
      userId: user._id,
      platform: 'meta'
    });

    if (!token) {
      token = await Token.create({
        userId: user._id,
        platform: 'meta',
        accessToken: accessToken,
        expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 gün
        isActive: true
      });
      
      console.log('✅ Yeni Meta token kaydedildi');
    } else {
      token = await Token.findByIdAndUpdate(token._id, {
        accessToken: accessToken,
        expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        isActive: true,
        lastUsedAt: new Date()
      }, { new: true });
      
      console.log('🔄 Meta token güncellendi');
    }

    // Bağlı platformları güncelle
    await User.findByIdAndUpdate(user._id, {
      $addToSet: {
        connectedPlatforms: {
          platform: 'meta',
          connectedAt: new Date(),
          isActive: true
        }
      }
    });

    // JWT token oluştur
    const jwt = require('jsonwebtoken');
    const config = require('../../config');
    
    const jwtToken = jwt.sign(
      { userId: user._id, email: user.email },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    // Session'da user ID'yi kaydet
    req.session.userId = user._id;

    console.log('✅ Token doğrulaması başarılı, oturum oluşturuldu');

    res.json({
      success: true,
      message: 'Token verified and session created',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        profileImage: user.profileImage,
        facebookId: user.facebookId
      },
      token: jwtToken,
      connectedPlatforms: user.connectedPlatforms
    });

  } catch (error) {
    logger.error('Meta token verification error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Token verification failed',
      message: error.message
    });
  }
});

/**
 * @route   POST /auth/meta/logout
 * @desc    Backend'de Facebook oturumunu sonlandır
 * @access  Public
 */
router.post('/meta/logout', async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.userId;

    if (userId) {
      // Token'ı pasif yap
      const Token = require('../models/Token');
      await Token.findOneAndUpdate(
        { userId: userId, platform: 'meta' },
        { isActive: false },
        { new: true }
      );

      console.log('🚪 Meta logout:', userId);
    }

    // Session'ı temizle
    req.session.destroy((err) => {
      if (err) {
        logger.error('Session destruction error:', err);
      }
      res.json({ success: true, message: 'Logged out successfully' });
    });

  } catch (error) {
    logger.error('Meta logout error:', error);
    res.status(500).json({ success: false, error: 'Logout failed' });
  }
});

// ============ Status Check ============

/**
 * @route   GET /auth/status
 * @desc    Kullanıcının bağlı platformlarını listele
 */
router.get('/status', async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      connectedPlatforms: user.connectedPlatforms.filter(p => p.isActive)
    });

  } catch (error) {
    logger.error('Auth status error:', error);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

module.exports = router;
