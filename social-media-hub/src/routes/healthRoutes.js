const express = require('express');
const router = express.Router();
const ConnectionTester = require('../utils/connectionTester');
const logger = require('../utils/logger');

/**
 * @route   GET /api/health/connections
 * @desc    Tüm sosyal medya platformlarının bağlantı durumunu test et
 * @access  Private (admin)
 */
router.get('/connections', async (req, res) => {
  try {
    logger.info('Connection test requested');

    const tester = new ConnectionTester();
    await tester.testAll();
    const results = tester.getResults();

    res.json({
      success: true,
      data: results
    });

  } catch (error) {
    logger.error('Connection test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/health/connections/:platform
 * @desc    Belirli bir platformun bağlantı durumunu test et
 * @access  Private (admin)
 */
router.get('/connections/:platform', async (req, res) => {
  try {
    const { platform } = req.params;
    const validPlatforms = ['tiktok', 'meta', 'youtube', 'x'];

    if (!validPlatforms.includes(platform)) {
      return res.status(400).json({
        success: false,
        error: `Geçersiz platform. Geçerli platformlar: ${validPlatforms.join(', ')}`
      });
    }

    logger.info(`Connection test requested for platform: ${platform}`);

    const tester = new ConnectionTester();
    
    // Sadece belirli platform için test yap
    switch (platform) {
      case 'tiktok':
        await tester.testTikTok();
        break;
      case 'meta':
        await tester.testMeta();
        break;
      case 'youtube':
        await tester.testYouTube();
        break;
      case 'x':
        await tester.testX();
        break;
    }

    res.json({
      success: true,
      data: {
        platform: platform,
        result: tester.results[platform],
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error(`Connection test failed for platform ${req.params.platform}:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/health
 * @desc    Genel sistem sağlık durumu
 * @access  Public
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Social Media Hub',
    version: '1.0.0'
  });
});

module.exports = router;
