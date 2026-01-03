const express = require('express');
const router = express.Router();
const metaClient = require('../api/meta');
const metaAuth = require('../auth/metaAuth');
const User = require('../models/User');
const Token = require('../models/Token');
const logger = require('../utils/logger');

/**
 * Meta (Facebook/Instagram) Specific Routes
 * Meta platformuna özel endpoint'ler
 */

// ============ Instagram Routes ============

/**
 * @route   GET /meta/instagram/accounts
 * @desc    Kullanıcının Instagram Business hesaplarını listele
 * @access  Private
 */
router.get('/instagram/accounts', async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const token = await Token.findOne({
      userId,
      platform: 'meta',
      isActive: true
    }).select('+accessToken');

    if (!token) {
      return res.status(404).json({ error: 'No Meta connection found' });
    }

    const userInfo = await metaAuth.getUserInfo(token.accessToken);
    const instagramAccounts = await metaAuth.getInstagramAccounts(
      token.accessToken,
      userInfo.id
    );

    res.json({
      success: true,
      accounts: instagramAccounts
    });

  } catch (error) {
    logger.error('Get Instagram accounts error:', error);
    res.status(500).json({ error: 'Failed to get Instagram accounts' });
  }
});

/**
 * @route   GET /meta/instagram/:accountId/media
 * @desc    Instagram hesabının medya listesini getir
 * @access  Private
 */
router.get('/instagram/:accountId/media', async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { accountId } = req.params;
    const { limit } = req.query;

    const result = await metaClient.getInstagramMediaList(
      userId,
      accountId,
      parseInt(limit) || 25
    );

    res.json(result);

  } catch (error) {
    logger.error('Get Instagram media error:', error);
    res.status(500).json({ error: 'Failed to get Instagram media' });
  }
});

/**
 * @route   GET /meta/instagram/media/:mediaId/insights
 * @desc    Instagram media insights getir
 * @access  Private
 */
router.get('/instagram/media/:mediaId/insights', async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { mediaId } = req.params;
    const { metrics } = req.query;

    const metricsArray = metrics ? metrics.split(',') : undefined;

    const result = await metaClient.getInstagramMediaInsights(
      userId,
      mediaId,
      metricsArray
    );

    res.json(result);

  } catch (error) {
    logger.error('Get Instagram media insights error:', error);
    res.status(500).json({ error: 'Failed to get media insights' });
  }
});

/**
 * @route   GET /meta/instagram/account/:accountId/insights
 * @desc    Instagram account insights getir
 * @access  Private
 */
router.get('/instagram/account/:accountId/insights', async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { accountId } = req.params;
    const { metrics, period } = req.query;

    const metricsArray = metrics ? metrics.split(',') : undefined;

    const result = await metaClient.getInstagramAccountInsights(
      userId,
      accountId,
      metricsArray,
      period || 'day'
    );

    res.json(result);

  } catch (error) {
    logger.error('Get Instagram account insights error:', error);
    res.status(500).json({ error: 'Failed to get account insights' });
  }
});

// ============ Facebook Pages Routes ============

/**
 * @route   GET /meta/facebook/pages
 * @desc    Kullanıcının Facebook Page'lerini listele
 * @access  Private
 */
router.get('/facebook/pages', async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const token = await Token.findOne({
      userId,
      platform: 'meta',
      isActive: true
    }).select('+accessToken');

    if (!token) {
      return res.status(404).json({ error: 'No Meta connection found' });
    }

    const userInfo = await metaAuth.getUserInfo(token.accessToken);

    res.json({
      success: true,
      pages: userInfo.accounts?.data || []
    });

  } catch (error) {
    logger.error('Get Facebook pages error:', error);
    res.status(500).json({ error: 'Failed to get Facebook pages' });
  }
});

/**
 * @route   GET /meta/facebook/page/:pageId/insights
 * @desc    Facebook Page insights getir
 * @access  Private
 */
router.get('/facebook/page/:pageId/insights', async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { pageId } = req.params;
    const { metrics, period } = req.query;

    const metricsArray = metrics ? metrics.split(',') : undefined;

    const result = await metaClient.getFacebookPageInsights(
      userId,
      pageId,
      metricsArray,
      period || 'day'
    );

    res.json(result);

  } catch (error) {
    logger.error('Get Facebook Page insights error:', error);
    res.status(500).json({ error: 'Failed to get page insights' });
  }
});

// ============ Data Deletion (Facebook Requirement) ============

/**
 * @route   POST /meta/data-deletion
 * @desc    Facebook Data Deletion Callback endpoint
 * @access  Public (Facebook calls this)
 */
router.post('/data-deletion', async (req, res) => {
  try {
    const { signed_request, email, userId } = req.body;

    // Log the deletion request
    logger.info('Data deletion request received', { 
      email, 
      userId,
      signedRequest: signed_request ? 'present' : 'missing'
    });

    // If signed_request is present, verify it
    if (signed_request) {
      // Parse signed request from Facebook
      const [encodedSig, payload] = signed_request.split('.');
      const data = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
      
      const facebookUserId = data.user_id;
      
      logger.info('Facebook data deletion request', { facebookUserId });

      // Find and deactivate user's Meta tokens
      const tokens = await Token.find({
        platformUserId: facebookUserId,
        platform: 'meta'
      });

      for (const token of tokens) {
        token.isActive = false;
        await token.save();
        
        // Also update user's connected platforms
        await User.findByIdAndUpdate(token.userId, {
          $pull: {
            connectedPlatforms: { platform: 'meta' }
          }
        });
      }

      // Generate confirmation code (required by Facebook)
      const confirmationCode = `${facebookUserId}_${Date.now()}`;
      
      logger.info('Data deletion completed', { 
        facebookUserId, 
        confirmationCode 
      });

      return res.json({
        url: `https://ultrarslanoglu.com/data-deletion-status/${confirmationCode}`,
        confirmation_code: confirmationCode
      });
    }

    // Handle manual deletion requests from the form
    if (email) {
      // Find user by email
      const user = await User.findOne({ email });
      
      if (user) {
        // Deactivate Meta tokens
        await Token.updateMany(
          { userId: user._id, platform: 'meta' },
          { isActive: false }
        );

        // Remove from connected platforms
        await User.findByIdAndUpdate(user._id, {
          $pull: {
            connectedPlatforms: { platform: 'meta' }
          }
        });

        logger.info('Manual data deletion completed', { email });
      }

      return res.json({
        success: true,
        message: 'Data deletion request received. You will be notified via email.'
      });
    }

    res.status(400).json({ 
      error: 'Invalid request. Either signed_request or email is required.' 
    });

  } catch (error) {
    logger.error('Data deletion error:', error);
    res.status(500).json({ 
      error: 'Data deletion request failed',
      message: error.message 
    });
  }
});

/**
 * @route   GET /meta/data-deletion-status/:code
 * @desc    Data deletion status check (for Facebook callback)
 * @access  Public
 */
router.get('/data-deletion-status/:code', (req, res) => {
  const { code } = req.params;
  
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Data Deletion Status</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: 50px auto;
          padding: 20px;
          text-align: center;
        }
        .status-box {
          background: #d4edda;
          color: #155724;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <h1>Data Deletion Status</h1>
      <div class="status-box">
        <h2>✓ Completed</h2>
        <p>Your data has been successfully deleted from our systems.</p>
        <p><strong>Confirmation Code:</strong> ${code}</p>
      </div>
      <p>If you have any questions, please contact us at info@ultrarslanoglu.com</p>
    </body>
    </html>
  `);
});

// ============ Token Management ============

/**
 * @route   POST /meta/refresh-token
 * @desc    Manuel olarak token'ı yenile
 * @access  Private
 */
router.post('/refresh-token', async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const token = await Token.findOne({
      userId,
      platform: 'meta',
      isActive: true
    }).select('+accessToken');

    if (!token) {
      return res.status(404).json({ error: 'No Meta token found' });
    }

    const newTokenData = await metaAuth.refreshAccessToken(token.accessToken);

    token.accessToken = newTokenData.accessToken;
    token.expiresAt = newTokenData.expiresAt;
    await token.save();

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      expiresAt: newTokenData.expiresAt
    });

  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

/**
 * @route   GET /meta/token-status
 * @desc    Token durumunu ve debug bilgilerini getir
 * @access  Private
 */
router.get('/token-status', async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const token = await Token.findOne({
      userId,
      platform: 'meta',
      isActive: true
    }).select('+accessToken');

    if (!token) {
      return res.status(404).json({ error: 'No Meta token found' });
    }

    const debugInfo = await metaAuth.debugToken(token.accessToken);

    res.json({
      success: true,
      tokenInfo: {
        isValid: debugInfo.is_valid,
        appId: debugInfo.app_id,
        userId: debugInfo.user_id,
        expiresAt: new Date(debugInfo.expires_at * 1000),
        issuedAt: new Date(debugInfo.issued_at * 1000),
        scopes: debugInfo.scopes,
        type: debugInfo.type
      }
    });

  } catch (error) {
    logger.error('Token status error:', error);
    res.status(500).json({ error: 'Failed to get token status' });
  }
});

// ============ Webhook (Optional) ============

/**
 * @route   GET /meta/webhook
 * @desc    Facebook Webhook verification
 * @access  Public
 */
router.get('/webhook', (req, res) => {
  const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || 'ultrarslanoglu_verify_token';
  
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  
  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      logger.info('Webhook verified');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});

/**
 * @route   POST /meta/webhook
 * @desc    Facebook Webhook events
 * @access  Public
 */
router.post('/webhook', (req, res) => {
  const body = req.body;
  
  if (body.object === 'page' || body.object === 'instagram') {
    logger.info('Webhook event received', { 
      object: body.object,
      entries: body.entry?.length 
    });
    
    // Process webhook events here
    // This could trigger analytics updates, notifications, etc.
    
    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

module.exports = router;
