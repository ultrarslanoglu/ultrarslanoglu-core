require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const config = require('../config');
const logger = require('./utils/logger');
const { apiLimiter } = require('./utils/rateLimiter');
const { initPostgres } = require('./lib/postgres');
const pointsService = require('./services/points');

// Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const tiktokRoutes = require('./routes/tiktokRoutes');
const metaRoutes = require('./routes/metaRoutes');
const youtubeRoutes = require('./routes/youtubeRoutes');
const healthRoutes = require('./routes/healthRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const pointsRoutes = require('./routes/pointsRoutes');

// Initialize Express app
const app = express();

// ============ Middleware ============

// Security headers
app.use(helmet());

// CORS
app.use(cors(config.cors));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP request logger
if (config.env === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Session
app.use(session(config.session));

// Rate limiting
app.use('/api/', apiLimiter);

// Static files
app.use('/public', express.static(path.join(__dirname, '../public')));
app.use('/.well-known', express.static(path.join(__dirname, '../public/.well-known')));

// ============ Database Connection ============

console.log('[APP] Starting database connections...');
console.log('[APP] MongoDB URI:', config.mongodb.uri);

mongoose.connect(config.mongodb.uri, config.mongodb.options)
  .then(() => {
    console.log('[APP] MongoDB connected successfully');
    logger.info('MongoDB connected successfully');
  })
  .catch((error) => {
    console.error('[APP] MongoDB connection error:', error.message);
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  });

// PostgreSQL (optional - points/rewards system)
if (config.postgres?.connectionString || config.postgres?.host) {
  initPostgres()
    .then(pointsService.ensureSchema)
    .then(() => {
      console.log('[APP] PostgreSQL schema ready (points module)');
      logger.info('PostgreSQL schema ready (points module)');
    })
    .catch((error) => {
      console.warn('[APP] PostgreSQL connection failed (optional feature):', error.message);
      logger.warn('PostgreSQL connection failed (optional feature):', error);
      // Don't exit - points system is optional
    });
} else {
  console.log('[APP] PostgreSQL not configured (points system disabled)');
  logger.info('PostgreSQL not configured (points system disabled)');
}

// ============ Routes ============

// Homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Health check & connection testing
app.use('/api/health', healthRoutes);

// Legacy health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    uptime: process.uptime(),
    environment: config.env
  });
});

// API routes
app.use('/auth', authRoutes); // OAuth social media routes
app.use('/api/user', userRoutes); // User management & authentication
app.use('/api/upload', uploadRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/tiktok', tiktokRoutes);
app.use('/api/meta', metaRoutes);
app.use('/api/youtube', youtubeRoutes);
app.use('/api/points', pointsRoutes);

// Webhook routes (Meta - Facebook/Instagram)
app.use('/meta', webhookRoutes);

// Privacy Policy & Terms of Service (static pages)
app.get('/privacy-policy', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/privacy-policy.html'));
});

app.get('/terms-of-service', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/terms-of-service.html'));
});

app.get('/data-deletion', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/data-deletion.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path
  });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Global error handler:', err);

  // Multer error handling
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: 'File too large',
      maxSize: '500MB'
    });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(config.env === 'development' && { stack: err.stack })
  });
});

// ============ Scheduled Jobs ============

// Zamanlanmış upload'ları kontrol et (her dakika)
const uploaderService = require('./services/uploader');
setInterval(() => {
  uploaderService.processScheduledUploads()
    .catch(error => logger.error('Scheduled upload processing error:', error));
}, 60 * 1000); // 1 dakika

// ============ Server Start ============

const PORT = config.port;

const server = app.listen(PORT, () => {
  console.log(`[APP] 🚀 Server running on port ${PORT}`);
  console.log(`[APP] 📡 Environment: ${config.env}`);
  console.log(`[APP] 🌐 Base URL: ${config.baseUrl}`);
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📡 Environment: ${config.env}`);
  logger.info(`🌐 Base URL: ${config.baseUrl}`);
});

// Graceful shutdown
const gracefulShutdown = () => {
  logger.info('Received shutdown signal, closing server gracefully...');
  
  server.close(() => {
    logger.info('HTTP server closed');
    
    mongoose.connection.close(false, () => {
      logger.info('MongoDB connection closed');
      process.exit(0);
    });
  });

  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

module.exports = app;
