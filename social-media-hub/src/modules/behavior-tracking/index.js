/**
 * Integration module for behavior tracking
 * Setup and register with Express app
 */

const BehaviorTrackingServer = require('./socket-server');
const analyticsRouter = require('./routes/analytics');
const logger = require('../../shared/logger');

/**
 * Initialize behavior tracking module
 * @param {Object} app - Express app instance
 * @param {Object} httpServer - HTTP server instance
 * @param {Object} redisClient - Redis client instance
 * @returns {Promise<Object>} - BehaviorTrackingServer instance
 */
async function initializeBehaviorTracking(app, httpServer, redisClient) {
  try {
    // Create behavior tracking server
    const behaviorServer = new BehaviorTrackingServer(httpServer, redisClient);
    await behaviorServer.initialize();

    // Register API routes
    app.use('/api/analytics', analyticsRouter);

    // Health check endpoint
    app.get('/health/behavior-tracking', (req, res) => {
      res.json({
        status: 'healthy',
        activeSessions: behaviorServer.getActiveSessionsCount(),
        timestamp: new Date()
      });
    });

    logger.info('Behavior Tracking Module initialized successfully');

    return behaviorServer;
  } catch (error) {
    logger.error('Failed to initialize behavior tracking:', error);
    throw error;
  }
}

/**
 * Get middleware to inject SDK
 */
function getBehaviorTrackingMiddleware(socketUrl) {
  return (req, res, next) => {
    res.locals.behaviorTrackingUrl = socketUrl;
    next();
  };
}

module.exports = {
  initializeBehaviorTracking,
  getBehaviorTrackingMiddleware
};
