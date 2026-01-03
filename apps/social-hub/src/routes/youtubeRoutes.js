const express = require('express');
const jwt = require('jsonwebtoken');
const config = require('../../config');
const GoogleAuthService = require('../auth/googleAuth');
const YouTubeAPI = require('../api/youtube');
const User = require('../models/User');
const Token = require('../models/Token');

const router = express.Router();

/**
 * JWT Token doğrulama middleware
 */
const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, config.jwt.secret);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// ============================================
// OAuth 2.0 Endpoints
// ============================================

/**
 * YouTube OAuth Login
 * GET /auth/youtube/login
 */
router.get('/auth/youtube/login', (req, res) => {
  try {
    const { url, state } = GoogleAuthService.getAuthorizationUrl();
    
    // State'i session'a kaydet (CSRF protection)
    req.session.youtubeOAuthState = state;
    
    res.redirect(url);
  } catch (error) {
    console.error('YouTube OAuth login error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * YouTube OAuth Callback
 * GET /auth/youtube/callback
 */
router.get('/auth/youtube/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;

    // Error kontrolü
    if (error) {
      return res.status(400).json({
        success: false,
        message: `OAuth error: ${error}`
      });
    }

    // State doğrulama (CSRF protection)
    if (state !== req.session.youtubeOAuthState) {
      return res.status(400).json({
        success: false,
        message: 'Invalid state parameter'
      });
    }

    // Authorization code'u token'a dönüştür
    const result = await GoogleAuthService.handleCallback(code, state);

    // JWT token oluştur
    const jwtToken = jwt.sign(
      {
        userId: result.user.id,
        email: result.user.email
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    // Session'dan state'i sil
    delete req.session.youtubeOAuthState;

    // Success response
    res.json({
      success: true,
      message: 'YouTube authentication successful',
      user: result.user,
      token: jwtToken,
      googleToken: result.token
    });
  } catch (error) {
    console.error('YouTube OAuth callback error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// YouTube Channels
// ============================================

/**
 * Get YouTube Channels
 * GET /api/youtube/channels
 */
router.get('/channels', verifyToken, async (req, res) => {
  try {
    const token = await GoogleAuthService.ensureValidToken(req.userId);
    const channels = await YouTubeAPI.getChannels(token.accessToken);

    res.json({
      success: true,
      channels: channels
    });
  } catch (error) {
    console.error('Error getting channels:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// Video Upload
// ============================================

/**
 * Upload Video
 * POST /api/youtube/upload
 */
router.post('/upload', verifyToken, async (req, res) => {
  try {
    const { videoPath, metadata } = req.body;

    if (!videoPath) {
      return res.status(400).json({
        success: false,
        message: 'videoPath is required'
      });
    }

    // Video yükle
    const result = await YouTubeAPI.uploadVideo(req.userId, videoPath, metadata || {});

    res.json({
      success: true,
      message: 'Video upload initiated',
      ...result
    });
  } catch (error) {
    console.error('Error uploading video:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// Video Management
// ============================================

/**
 * Get Video Info
 * GET /api/youtube/video/:videoId
 */
router.get('/video/:videoId', verifyToken, async (req, res) => {
  try {
    const token = await GoogleAuthService.ensureValidToken(req.userId);
    const videoInfo = await YouTubeAPI.getVideoInfo(token.accessToken, req.params.videoId);

    res.json({
      success: true,
      video: videoInfo
    });
  } catch (error) {
    console.error('Error getting video info:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Get Video List
 * GET /api/youtube/videos
 */
router.get('/videos', verifyToken, async (req, res) => {
  try {
    const token = await GoogleAuthService.ensureValidToken(req.userId);
    const options = {
      maxResults: req.query.maxResults || 25,
      pageToken: req.query.pageToken || null,
      searchQuery: req.query.search || null,
      order: req.query.order || 'date'
    };

    const result = await YouTubeAPI.getVideoList(token.accessToken, options);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error getting video list:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Update Video
 * PUT /api/youtube/video/:videoId
 */
router.put('/video/:videoId', verifyToken, async (req, res) => {
  try {
    const token = await GoogleAuthService.ensureValidToken(req.userId);
    const result = await YouTubeAPI.updateVideo(token.accessToken, req.params.videoId, req.body);

    res.json({
      success: true,
      message: 'Video updated successfully',
      ...result
    });
  } catch (error) {
    console.error('Error updating video:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Delete Video
 * DELETE /api/youtube/video/:videoId
 */
router.delete('/video/:videoId', verifyToken, async (req, res) => {
  try {
    const token = await GoogleAuthService.ensureValidToken(req.userId);
    const result = await YouTubeAPI.deleteVideo(token.accessToken, req.params.videoId);

    res.json({
      success: true,
      message: 'Video deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting video:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// Analytics
// ============================================

/**
 * Get Video Analytics
 * GET /api/youtube/analytics/video/:videoId
 */
router.get('/analytics/video/:videoId', verifyToken, async (req, res) => {
  try {
    const token = await GoogleAuthService.ensureValidToken(req.userId);
    const options = {
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const analytics = await YouTubeAPI.getVideoAnalytics(
      token.accessToken,
      req.params.videoId,
      options
    );

    res.json({
      success: true,
      analytics: analytics
    });
  } catch (error) {
    console.error('Error getting video analytics:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Get Channel Analytics
 * GET /api/youtube/analytics/channel
 */
router.get('/analytics/channel', verifyToken, async (req, res) => {
  try {
    const token = await GoogleAuthService.ensureValidToken(req.userId);
    const options = {
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const analytics = await YouTubeAPI.getChannelAnalytics(token.accessToken, options);

    res.json({
      success: true,
      analytics: analytics
    });
  } catch (error) {
    console.error('Error getting channel analytics:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Get Traffic Sources
 * GET /api/youtube/analytics/traffic
 */
router.get('/analytics/traffic', verifyToken, async (req, res) => {
  try {
    const token = await GoogleAuthService.ensureValidToken(req.userId);
    const options = {
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const trafficData = await YouTubeAPI.getTrafficSources(
      token.accessToken,
      req.query.videoId || null,
      options
    );

    res.json({
      success: true,
      trafficData: trafficData
    });
  } catch (error) {
    console.error('Error getting traffic sources:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// Token Management
// ============================================

/**
 * Refresh Token
 * POST /api/youtube/refresh-token
 */
router.post('/refresh-token', verifyToken, async (req, res) => {
  try {
    const result = await GoogleAuthService.refreshAccessToken(req.userId);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      ...result
    });
  } catch (error) {
    console.error('Error refreshing token:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Get Token Status
 * GET /api/youtube/token-status
 */
router.get('/token-status', verifyToken, async (req, res) => {
  try {
    const tokenRecord = await Token.findOne({
      userId: req.userId,
      provider: 'google'
    });

    if (!tokenRecord) {
      return res.status(404).json({
        success: false,
        message: 'No token found'
      });
    }

    const tokenInfo = await GoogleAuthService.debugToken(tokenRecord.accessToken);

    res.json({
      success: true,
      tokenInfo: {
        isValid: tokenInfo.isValid,
        expiresAt: tokenRecord.expiryDate,
        scopes: tokenRecord.scope?.split(' ') || [],
        ...tokenInfo
      }
    });
  } catch (error) {
    console.error('Error getting token status:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
