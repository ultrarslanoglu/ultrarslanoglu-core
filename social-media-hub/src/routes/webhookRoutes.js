const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const webhookService = require('../services/webhookService');

/**
 * Meta (Facebook/Instagram) Webhook Routes
 * Callback URL: https://ultrarslanoglu.com/meta/webhook
 * Verify Token: ultrarslanoglu_webhook_token_2025
 */

// ============================================
// WEBHOOK VERIFICATION (GET)
// ============================================

/**
 * @route   GET /meta/webhook
 * @desc    Meta webhook verification
 * @access  Public
 * 
 * Meta will send a GET request to verify the webhook endpoint.
 * Must respond with the hub.challenge parameter if token is valid.
 * 
 * Query Parameters:
 * - hub.mode: 'subscribe'
 * - hub.verify_token: Your verification token
 * - hub.challenge: Random string to echo back
 */
router.get('/webhook', (req, res) => {
  try {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || 'ultrarslanoglu_webhook_token_2025';

    console.log('🔍 Webhook Verification Request:');
    console.log('  Mode:', mode);
    console.log('  Token Match:', token === VERIFY_TOKEN);
    console.log('  Challenge:', challenge);

    // Verify token match
    if (mode && token) {
      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('✅ Webhook verification successful!');
        res.status(200).send(challenge);
        
        logger.info('✅ Meta webhook verified successfully', {
          mode: mode,
          ip: req.ip,
          timestamp: new Date()
        });
      } else {
        console.error('❌ Token verification failed');
        res.sendStatus(403);
        
        logger.warn('❌ Webhook verification failed - Invalid token', {
          provided: token,
          expected: VERIFY_TOKEN,
          ip: req.ip
        });
      }
    } else {
      console.error('❌ Missing required parameters');
      res.sendStatus(400);
      
      logger.warn('❌ Webhook verification failed - Missing parameters', {
        mode: mode,
        token: token ? 'provided' : 'missing',
        challenge: challenge ? 'provided' : 'missing'
      });
    }
  } catch (error) {
    logger.error('Webhook verification error:', error);
    res.sendStatus(500);
  }
});

// ============================================
// WEBHOOK EVENTS (POST)
// ============================================

/**
 * @route   POST /meta/webhook
 * @desc    Handle incoming Meta webhook events
 * @access  Public
 * 
 * Meta sends events about:
 * - Messages (incoming, outgoing)
 * - Message status (delivered, read)
 * - Messaging optins
 * - Account changes
 * - Story mentions
 * - Feed posts
 * - etc.
 */
router.post('/webhook', async (req, res) => {
  try {
    const body = req.body;

    console.log('📨 Incoming Webhook Event:');
    console.log('  Object:', body.object);
    console.log('  Entry Count:', body.entry?.length || 0);

    // Check if this is an event from Meta
    if (body.object === 'instagram' || body.object === 'page') {
      // Iterate over each entry
      if (body.entry && Array.isArray(body.entry)) {
        for (const entry of body.entry) {
          console.log('\n📩 Processing Entry:');
          console.log('  ID:', entry.id);
          console.log('  Time:', entry.time);

          // Handle messaging events
          if (entry.messaging && Array.isArray(entry.messaging)) {
            for (const event of entry.messaging) {
              console.log('\n  Event Type:', {
                hasMessage: !!event.message,
                hasDelivery: !!event.delivery,
                hasRead: !!event.read,
                hasPostback: !!event.postback,
                hasOptIn: !!event.optin,
                sender: event.sender?.id,
                recipient: event.recipient?.id
              });

              // Process each event type
              await webhookService.processMessagingEvent(event, entry.id);
            }
          }

          // Handle Instagram events
          if (entry.changes && Array.isArray(entry.changes)) {
            for (const change of entry.changes) {
              console.log('\n  Change Field:', change.field);
              await webhookService.processInstagramEvent(change, entry.id);
            }
          }
        }
      }

      // Always respond with 200 OK to confirm receipt
      res.status(200).json({ status: 'received' });

      logger.info('✅ Webhook events processed successfully', {
        object: body.object,
        entryCount: body.entry?.length || 0,
        timestamp: new Date()
      });
    } else {
      console.warn('⚠️ Unexpected object type:', body.object);
      res.status(400).json({ error: 'Invalid object type' });
      
      logger.warn('⚠️ Webhook event with invalid object type', {
        object: body.object,
        ip: req.ip
      });
    }
  } catch (error) {
    logger.error('Webhook event processing error:', error);
    console.error('❌ Error processing webhook:', error.message);
    
    // Still return 200 to prevent webhook retries
    res.status(200).json({ 
      status: 'error',
      message: error.message
    });
  }
});

// ============================================
// WEBHOOK STATUS
// ============================================

/**
 * @route   GET /meta/webhook/status
 * @desc    Get webhook status and statistics
 * @access  Private
 */
router.get('/webhook/status', (req, res) => {
  try {
    const webhookStats = {
      status: 'active',
      endpoint: 'https://ultrarslanoglu.com/meta/webhook',
      verifyToken: 'ultrarslanoglu_webhook_token_2025',
      supportedEvents: [
        'messages',
        'message_status',
        'read_receipts',
        'messaging_optins',
        'instagram_story_insights',
        'feed_posts'
      ],
      lastUpdate: new Date(),
      uptime: process.uptime(),
      memory: process.memoryUsage()
    };

    res.json({
      success: true,
      webhook: webhookStats
    });

    logger.info('Webhook status requested', {
      ip: req.ip,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Webhook status error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;
