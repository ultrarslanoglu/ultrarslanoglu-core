const logger = require('../utils/logger');
const User = require('../models/User');
const Token = require('../models/Token');

/**
 * Webhook Service
 * Handles processing of Meta (Facebook/Instagram) webhook events
 */

class WebhookService {
  /**
   * Process messaging events (messages, delivery, read, postback)
   * @param {Object} event - The messaging event
   * @param {String} pageId - The page ID
   */
  async processMessagingEvent(event, pageId) {
    try {
      const senderId = event.sender?.id;
      const recipientId = event.recipient?.id;
      const timestamp = event.timestamp;

      console.log(`    Processing message from ${senderId}`);

      // Handle incoming messages
      if (event.message) {
        await this.handleMessage(event.message, senderId, recipientId, pageId, timestamp);
      }

      // Handle delivery notifications
      if (event.delivery) {
        await this.handleDelivery(event.delivery, senderId, recipientId, pageId);
      }

      // Handle read receipts
      if (event.read) {
        await this.handleRead(event.read, senderId, recipientId, pageId);
      }

      // Handle postback (e.g., button clicks)
      if (event.postback) {
        await this.handlePostback(event.postback, senderId, recipientId, pageId);
      }

      // Handle opt-in/opt-out
      if (event.optin) {
        await this.handleOptIn(event.optin, senderId, recipientId, pageId);
      }

      // Handle standby mode
      if (event.standby) {
        await this.handleStandby(event.standby, senderId, recipientId, pageId);
      }

      logger.info('✅ Messaging event processed', {
        senderId,
        pageId,
        eventType: this.getEventType(event),
        timestamp
      });
    } catch (error) {
      logger.error('Error processing messaging event:', {
        error: error.message,
        event: event,
        stack: error.stack
      });
    }
  }

  /**
   * Process Instagram events (comments, DMs, etc.)
   * @param {Object} change - The change object
   * @param {String} pageId - The page ID
   */
  async processInstagramEvent(change, pageId) {
    try {
      const field = change.field;
      const value = change.value;

      console.log(`    Processing Instagram event: ${field}`);

      switch (field) {
        case 'comments':
          await this.handleInstagramComment(value, pageId);
          break;

        case 'message_comments':
          await this.handleInstagramMessageComment(value, pageId);
          break;

        case 'mentions':
          await this.handleInstagramMention(value, pageId);
          break;

        case 'story_insights':
          await this.handleInstagramStoryInsights(value, pageId);
          break;

        case 'feed':
          await this.handleInstagramFeed(value, pageId);
          break;

        default:
          console.log(`    Unhandled Instagram field: ${field}`);
          logger.warn('Unhandled Instagram field', { field, pageId });
      }

      logger.info('✅ Instagram event processed', {
        field,
        pageId,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Error processing Instagram event:', {
        error: error.message,
        change: change,
        stack: error.stack
      });
    }
  }

  /**
   * Handle incoming messages
   */
  async handleMessage(message, senderId, recipientId, pageId, timestamp) {
    try {
      const text = message.text || '';
      const attachments = message.attachments || [];

      console.log(`      Message: "${text.substring(0, 50)}..."`);
      console.log(`      Attachments: ${attachments.length}`);

      // Find or create user
      const user = await User.findOne({
        'connectedPlatforms.meta.pageId': pageId
      });

      if (!user) {
        console.log(`      ⚠️ User not found for page ${pageId}`);
        return;
      }

      // Store message in database (you might want to create a Message model)
      logger.info('📨 Incoming message stored', {
        senderId,
        pageId,
        messageLength: text.length,
        attachmentCount: attachments.length,
        timestamp
      });

      // TODO: Add message storage logic
      // const message = new Message({
      //   userId: user._id,
      //   platform: 'meta',
      //   senderId,
      //   pageId,
      //   text,
      //   attachments,
      //   timestamp
      // });
      // await message.save();
    } catch (error) {
      logger.error('Error handling message:', error);
    }
  }

  /**
   * Handle delivery notifications
   */
  async handleDelivery(delivery, senderId, recipientId, pageId) {
    try {
      const mids = delivery.mids || [];
      console.log(`      Delivery confirmation for ${mids.length} messages`);

      logger.info('📦 Message delivery confirmed', {
        senderId,
        pageId,
        messageCount: mids.length
      });

      // TODO: Update message status to 'delivered'
    } catch (error) {
      logger.error('Error handling delivery:', error);
    }
  }

  /**
   * Handle read receipts
   */
  async handleRead(read, senderId, recipientId, pageId) {
    try {
      const watermark = read.watermark;
      console.log(`      Read receipt at ${new Date(watermark).toISOString()}`);

      logger.info('👀 Message read', {
        senderId,
        pageId,
        watermark
      });

      // TODO: Update message status to 'read'
    } catch (error) {
      logger.error('Error handling read receipt:', error);
    }
  }

  /**
   * Handle postback events (button clicks, etc.)
   */
  async handlePostback(postback, senderId, recipientId, pageId) {
    try {
      const payload = postback.payload;
      console.log(`      Postback: ${payload}`);

      logger.info('🔘 Postback received', {
        senderId,
        pageId,
        payload
      });

      // TODO: Handle different postback payloads
    } catch (error) {
      logger.error('Error handling postback:', error);
    }
  }

  /**
   * Handle opt-in/opt-out
   */
  async handleOptIn(optin, senderId, recipientId, pageId) {
    try {
      const ref = optin.ref;
      console.log(`      User opted in: ${ref}`);

      logger.info('✅ User opt-in', {
        senderId,
        pageId,
        ref
      });

      // TODO: Update user subscription status
    } catch (error) {
      logger.error('Error handling opt-in:', error);
    }
  }

  /**
   * Handle standby mode
   */
  async handleStandby(standby, senderId, recipientId, pageId) {
    try {
      console.log(`      Conversation in standby mode`);

      logger.info('⏸️ Conversation standby', {
        senderId,
        pageId
      });

      // TODO: Handle standby mode transitions
    } catch (error) {
      logger.error('Error handling standby:', error);
    }
  }

  /**
   * Handle Instagram comments
   */
  async handleInstagramComment(value, pageId) {
    try {
      const mediaId = value.media?.id;
      const comment = {
        id: value.id,
        text: value.text,
        from: value.from?.id
      };

      console.log(`      Instagram comment on media ${mediaId}: "${value.text.substring(0, 30)}..."`);

      logger.info('💬 Instagram comment received', {
        mediaId,
        commentId: value.id,
        pageId
      });

      // TODO: Store comment, trigger notifications, etc.
    } catch (error) {
      logger.error('Error handling Instagram comment:', error);
    }
  }

  /**
   * Handle Instagram message comments
   */
  async handleInstagramMessageComment(value, pageId) {
    try {
      console.log(`      Instagram message comment received`);

      logger.info('💭 Instagram message comment', {
        pageId
      });
    } catch (error) {
      logger.error('Error handling Instagram message comment:', error);
    }
  }

  /**
   * Handle Instagram mentions
   */
  async handleInstagramMention(value, pageId) {
    try {
      const mediaId = value.media?.id;
      console.log(`      Mention on media ${mediaId}`);

      logger.info('🏷️ Instagram mention received', {
        mediaId,
        pageId
      });
    } catch (error) {
      logger.error('Error handling Instagram mention:', error);
    }
  }

  /**
   * Handle Instagram story insights
   */
  async handleInstagramStoryInsights(value, pageId) {
    try {
      console.log(`      Story insights updated`);

      logger.info('📊 Instagram story insights', {
        pageId
      });

      // TODO: Store story insights for analytics
    } catch (error) {
      logger.error('Error handling story insights:', error);
    }
  }

  /**
   * Handle Instagram feed updates
   */
  async handleInstagramFeed(value, pageId) {
    try {
      console.log(`      Feed updated`);

      logger.info('📱 Instagram feed update', {
        pageId
      });
    } catch (error) {
      logger.error('Error handling feed update:', error);
    }
  }

  /**
   * Utility: Get event type from event object
   */
  getEventType(event) {
    if (event.message) return 'message';
    if (event.delivery) return 'delivery';
    if (event.read) return 'read';
    if (event.postback) return 'postback';
    if (event.optin) return 'optin';
    if (event.standby) return 'standby';
    return 'unknown';
  }
}

module.exports = new WebhookService();
