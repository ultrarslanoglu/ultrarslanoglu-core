const express = require('express');
const router = express.Router();
const tiktokClient = require('../api/tiktok');
const logger = require('../utils/logger');

/**
 * TikTok Specific Routes
 * TikTok platformuna özel endpoint'ler
 */

/**
 * @route   GET /tiktok/share
 * @desc    TikTok Share Kit URL'i oluştur
 * @access  Public (veya Private - ihtiyaca göre)
 */
router.get('/share', (req, res) => {
  try {
    const { url, title, hashtags } = req.query;

    const shareUrl = tiktokClient.generateShareUrl({
      url,
      title,
      hashtags: hashtags ? hashtags.split(',') : undefined
    });

    res.json({
      success: true,
      shareUrl,
      message: 'Share URL generated. Redirect user to this URL to initiate TikTok sharing.'
    });

  } catch (error) {
    logger.error('TikTok share URL generation error:', error);
    res.status(500).json({ error: 'Failed to generate share URL' });
  }
});

/**
 * @route   POST /tiktok/share/redirect
 * @desc    Kullanıcıyı TikTok Share Kit'e yönlendir
 * @access  Private
 */
router.post('/share/redirect', (req, res) => {
  try {
    const { url, title, hashtags } = req.body;

    const shareUrl = tiktokClient.generateShareUrl({
      url,
      title,
      hashtags
    });

    // Kullanıcıyı Share URL'e yönlendir
    res.redirect(shareUrl);

  } catch (error) {
    logger.error('TikTok share redirect error:', error);
    res.status(500).json({ error: 'Failed to redirect to TikTok share' });
  }
});

/**
 * @route   GET /tiktok/videos
 * @desc    Kullanıcının TikTok videolarını listele
 * @access  Private
 */
router.get('/videos', async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { cursor, maxCount } = req.query;

    const result = await tiktokClient.getVideoList(
      userId,
      cursor || '',
      parseInt(maxCount) || 20
    );

    res.json(result);

  } catch (error) {
    logger.error('TikTok get videos error:', error);
    res.status(500).json({ error: 'Failed to get videos' });
  }
});

/**
 * @route   GET /tiktok/video/:videoId/analytics
 * @desc    Belirli bir videonun analytics'ini getir
 * @access  Private
 */
router.get('/video/:videoId/analytics', async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { videoId } = req.params;

    const result = await tiktokClient.getVideoAnalytics(userId, [videoId]);

    if (result.success && result.analytics.length > 0) {
      res.json({
        success: true,
        analytics: result.analytics[0]
      });
    } else {
      res.status(404).json({ error: 'Video not found' });
    }

  } catch (error) {
    logger.error('TikTok get video analytics error:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

/**
 * @route   GET /tiktok/creator/analytics
 * @desc    Creator profile analytics'ini getir
 * @access  Private
 */
router.get('/creator/analytics', async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const result = await tiktokClient.getCreatorAnalytics(userId);

    res.json(result);

  } catch (error) {
    logger.error('TikTok get creator analytics error:', error);
    res.status(500).json({ error: 'Failed to get creator analytics' });
  }
});

/**
 * @route   GET /tiktok/publish/status/:publishId
 * @desc    Publish durumunu kontrol et
 * @access  Private
 */
router.get('/publish/status/:publishId', async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { publishId } = req.params;

    const result = await tiktokClient.checkPublishStatus(userId, publishId);

    res.json(result);

  } catch (error) {
    logger.error('TikTok check publish status error:', error);
    res.status(500).json({ error: 'Failed to check publish status' });
  }
});

/**
 * @route   GET /tiktok/video/:videoId/comments
 * @desc    Video yorumlarını listele
 * @access  Private
 */
router.get('/video/:videoId/comments', async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { videoId } = req.params;
    const { cursor, count } = req.query;

    const result = await tiktokClient.getVideoComments(
      userId,
      videoId,
      cursor || '',
      parseInt(count) || 50
    );

    res.json(result);

  } catch (error) {
    logger.error('TikTok get video comments error:', error);
    res.status(500).json({ error: 'Failed to get comments' });
  }
});

/**
 * @route   PUT /tiktok/video/:videoId/privacy
 * @desc    Video privacy ayarlarını güncelle
 * @access  Private
 */
router.put('/video/:videoId/privacy', async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { videoId } = req.params;
    const { privacyLevel } = req.body;

    if (!privacyLevel) {
      return res.status(400).json({ 
        error: 'Privacy level required',
        validLevels: ['PUBLIC_TO_EVERYONE', 'MUTUAL_FOLLOW_FRIENDS', 'SELF_ONLY']
      });
    }

    const result = await tiktokClient.updateVideoPrivacy(userId, videoId, privacyLevel);

    res.json(result);

  } catch (error) {
    logger.error('TikTok update video privacy error:', error);
    res.status(500).json({ error: error.message || 'Failed to update privacy' });
  }
});

/**
 * @route   DELETE /tiktok/video/:videoId
 * @desc    Video'yu sil
 * @access  Private
 */
router.delete('/video/:videoId', async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { videoId } = req.params;

    const result = await tiktokClient.deleteVideo(userId, videoId);

    res.json(result);

  } catch (error) {
    logger.error('TikTok delete video error:', error);
    res.status(500).json({ error: 'Failed to delete video' });
  }
});

module.exports = router;
