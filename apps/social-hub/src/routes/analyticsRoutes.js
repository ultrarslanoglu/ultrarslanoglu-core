const express = require('express');
const router = express.Router();
const analyticsService = require('../services/analytics');
const decisionEngine = require('../ai/decisionEngine');
const { authenticateToken } = require('../utils/auth');
const logger = require('../utils/logger');
const config = require('../../config');

/**
 * Analytics Routes
 * Performans verileri ve analiz endpoint'leri
 */

/**
 * @route   GET /analytics/all
 * @desc    Tüm platformların analytics'ini getir
 * @access  Private
 */
router.get('/all', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const stats = await analyticsService.getAllStats(userId);

    res.json(stats);

  } catch (error) {
    logger.error('Get all analytics error:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

/**
 * @route   GET /analytics/tiktok
 * @desc    TikTok analytics
 */
router.get('/tiktok', async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const videoIds = req.query.videoIds ? req.query.videoIds.split(',') : null;
    const stats = await analyticsService.getTikTokStats(userId, videoIds);

    res.json({
      success: true,
      ...stats
    });

  } catch (error) {
    logger.error('Get TikTok analytics error:', error);
    res.status(500).json({ error: 'Failed to get TikTok analytics' });
  }
});

/**
 * @route   GET /analytics/instagram
 * @desc    Instagram analytics
 */
router.get('/instagram', async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const igAccountId = req.query.accountId;
    const stats = await analyticsService.getInstagramStats(userId, igAccountId);

    res.json({
      success: true,
      ...stats
    });

  } catch (error) {
    logger.error('Get Instagram analytics error:', error);
    res.status(500).json({ error: 'Failed to get Instagram analytics' });
  }
});

/**
 * @route   GET /analytics/youtube
 * @desc    YouTube analytics
 */
router.get('/youtube', async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const videoIds = req.query.videoIds ? req.query.videoIds.split(',') : null;
    const stats = await analyticsService.getYouTubeStats(userId, videoIds);

    res.json({
      success: true,
      ...stats
    });

  } catch (error) {
    logger.error('Get YouTube analytics error:', error);
    res.status(500).json({ error: 'Failed to get YouTube analytics' });
  }
});

/**
 * @route   GET /analytics/x
 * @desc    X (Twitter) analytics
 */
router.get('/x', async (req, res) => {
  try {
    if (!config.features.xEnabled) {
      return res.status(503).json({ error: 'X integration disabled (paid access required)' });
    }

    const userId = req.user?.id || req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const tweetIds = req.query.tweetIds ? req.query.tweetIds.split(',') : null;
    const stats = await analyticsService.getXStats(userId, tweetIds);

    res.json({
      success: true,
      ...stats
    });

  } catch (error) {
    logger.error('Get X analytics error:', error);
    res.status(500).json({ error: 'Failed to get X analytics' });
  }
});

/**
 * @route   POST /analytics/sync/:uploadId
 * @desc    Belirli bir upload'ın analytics'ini senkronize et
 */
router.post('/sync/:uploadId', async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const result = await analyticsService.syncUploadAnalytics(req.params.uploadId);

    res.json(result);

  } catch (error) {
    logger.error('Sync analytics error:', error);
    res.status(500).json({ error: 'Failed to sync analytics' });
  }
});

/**
 * @route   GET /analytics/trends/:platform
 * @desc    Platform trend analizi
 */
router.get('/trends/:platform', async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { platform } = req.params;
    const days = parseInt(req.query.days) || 30;

    const trends = await decisionEngine.analyzeTrends(userId, platform, days);

    res.json({
      success: true,
      platform,
      days,
      ...trends
    });

  } catch (error) {
    logger.error('Get trends error:', error);
    res.status(500).json({ error: 'Failed to get trends' });
  }
});

/**
 * @route   GET /analytics/comparison
 * @desc    Platformlar arası karşılaştırma
 */
router.get('/comparison', async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const stats = await analyticsService.getAllStats(userId);

    // Karşılaştırma verisi oluştur
    const comparison = {
      platforms: {},
      rankings: []
    };

    for (const [platform, data] of Object.entries(stats.stats)) {
      if (data.error) continue;

      comparison.platforms[platform] = {
        totalContent: data.summary?.totalVideos || data.summary?.totalTweets || 0,
        totalEngagement: 
          (data.summary?.totalLikes || 0) +
          (data.summary?.totalComments || 0) +
          (data.summary?.totalShares || 0),
        averageEngagement: data.summary?.averageEngagement || 0,
        totalReach: data.summary?.totalViews || data.summary?.totalImpressions || 0
      };
    }

    // Ranking oluştur (engagement'a göre)
    comparison.rankings = Object.entries(comparison.platforms)
      .map(([platform, data]) => ({
        platform,
        score: data.averageEngagement,
        totalEngagement: data.totalEngagement,
        totalContent: data.totalContent
      }))
      .sort((a, b) => b.score - a.score);

    res.json({
      success: true,
      comparison,
      timestamp: new Date()
    });

  } catch (error) {
    logger.error('Get comparison error:', error);
    res.status(500).json({ error: 'Failed to get comparison' });
  }
});

/**
 * @route   GET /analytics/export
 * @desc    Analytics verilerini CSV olarak export et
 */
router.get('/export', async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const format = req.query.format || 'json';
    const stats = await analyticsService.getAllStats(userId);

    if (format === 'csv') {
      // CSV formatına çevir (basit implementasyon)
      const csv = this.convertToCSV(stats);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=analytics.csv');
      res.send(csv);
    } else {
      res.json(stats);
    }

  } catch (error) {
    logger.error('Export analytics error:', error);
    res.status(500).json({ error: 'Failed to export analytics' });
  }
});

module.exports = router;
