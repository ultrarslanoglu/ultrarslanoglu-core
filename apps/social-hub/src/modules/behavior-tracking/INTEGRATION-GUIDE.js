/**
 * Example App.js - Behavior Tracking Integration
 * Shows how to integrate the behavior tracking module into your Express app
 */

// ==================================================
// BASIC SETUP
// ==================================================

const express = require('express');
const http = require('http');
const Redis = require('ioredis');
const mongoose = require('mongoose');
const { initializeBehaviorTracking, getBehaviorTrackingMiddleware } = require('./src/modules/behavior-tracking');

// Initialize Express app
const app = express();
const httpServer = http.createServer(app);

// Initialize Redis
const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Initialize MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/behavior_tracking', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// ==================================================
// MIDDLEWARE SETUP
// ==================================================

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// CORS for Socket.io
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

// Authentication middleware (optional)
const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token && process.env.NODE_ENV !== 'development') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // Verify token logic here
  next();
};

// ==================================================
// BEHAVIOR TRACKING INITIALIZATION
// ==================================================

(async () => {
  try {
    // Initialize behavior tracking module
    const behaviorServer = await initializeBehaviorTracking(
      app,
      httpServer,
      redisClient
    );

    // Add behavior tracking middleware
    app.use(getBehaviorTrackingMiddleware(process.env.BEHAVIOR_TRACKING_URL || 'http://localhost:3000'));

    // ==================================================
    // APPLICATION ROUTES
    // ==================================================

    // Health check
    app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date() });
    });

    // Dashboard page (render with tracking SDK)
    app.get('/dashboard', (req, res) => {
      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Analytics Dashboard</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <script src="https://cdn.socket.io/4.5.4/socket.io.js"></script>
            <script src="/modules/behavior-tracking/behavior-tracker-sdk.js"></script>
          </head>
          <body>
            <div id="dashboard">Loading...</div>
            
            <script>
              // Initialize behavior tracker
              BehaviorTracker.init({
                socketUrl: '${process.env.BEHAVIOR_TRACKING_URL || 'http://localhost:3000'}',
                authToken: localStorage.getItem('authToken'),
                debug: ${process.env.NODE_ENV === 'development' ? 'true' : 'false'}
              });
            </script>
          </body>
        </html>
      `);
    });

    // Serve behavior tracking SDK
    app.get('/modules/behavior-tracking/behavior-tracker-sdk.js', (req, res) => {
      const fs = require('fs');
      const sdkPath = __dirname + '/src/modules/behavior-tracking/behavior-tracker-sdk.js';
      const sdk = fs.readFileSync(sdkPath, 'utf-8');
      res.setHeader('Content-Type', 'application/javascript');
      res.send(sdk);
    });

    // ==================================================
    // ERROR HANDLING
    // ==================================================

    app.use((err, req, res, next) => {
      console.error('Unhandled error:', err);
      res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    });

    // ==================================================
    // SERVER START
    // ==================================================

    const PORT = process.env.PORT || 3000;
    httpServer.listen(PORT, () => {
      console.log(`
        =====================================
        Server is running!
        =====================================
        HTTP Server: http://localhost:${PORT}
        
        Behavior Tracking:
        - Socket.io: ws://localhost:${PORT}
        - API: http://localhost:${PORT}/api/analytics
        - Dashboard: http://localhost:${PORT}/dashboard
        
        Health Check: http://localhost:${PORT}/health
        Behavior Health: http://localhost:${PORT}/health/behavior-tracking
        =====================================
      `);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, shutting down gracefully...');
      httpServer.close(() => {
        console.log('HTTP server closed');
        redisClient.disconnect();
        mongoose.connection.close();
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();

// ==================================================
// EXPORT FOR TESTING
// ==================================================

module.exports = { app, httpServer };
