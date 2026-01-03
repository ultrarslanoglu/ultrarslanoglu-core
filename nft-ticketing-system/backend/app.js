/**
 * NFT Ticketing System - Express App
 * Main backend server for ticket operations
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const logger = require('../../shared/logger');
const Web3Service = require('./src/services/Web3Service');
const TicketService = require('./src/services/TicketService');
const initializeTicketRoutes = require('./src/routes/tickets');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// ============================================
// MIDDLEWARE
// ============================================

// CORS
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// ============================================
// INITIALIZATION
// ============================================

// Global service instances
let web3Service = null;
let ticketService = null;

/**
 * Initialize services
 */
async function initializeServices() {
  try {
    // Initialize Web3 service
    web3Service = new Web3Service();
    await web3Service.initialize();

    // Initialize Ticket service
    ticketService = new TicketService(web3Service);

    logger.info('All services initialized successfully');

    return true;
  } catch (error) {
    logger.error('Service initialization failed:', error);
    throw error;
  }
}

// ============================================
// ROUTES
// ============================================

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    services: {
      web3: web3Service ? 'connected' : 'disconnected',
      blockchain: web3Service?.getNetwork() || 'unknown'
    }
  });
});

/**
 * Contract info
 */
app.get('/contract/info', async (req, res) => {
  try {
    if (!web3Service) {
      return res.status(503).json({
        success: false,
        error: 'Services not initialized'
      });
    }

    res.json({
      success: true,
      data: {
        network: web3Service.getNetwork(),
        contractAddress: web3Service.getContractAddress(),
        signerAddress: await web3Service.getSignerAddress(),
        rpcUrl: process.env[`${web3Service.getNetwork().toUpperCase()}_RPC_URL`] ? 'configured' : 'not configured'
      }
    });
  } catch (error) {
    logger.error('Get contract info error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Gas price info
 */
app.get('/contract/gas-price', async (req, res) => {
  try {
    if (!web3Service) {
      return res.status(503).json({
        success: false,
        error: 'Services not initialized'
      });
    }

    const gasInfo = await web3Service.getGasPrice();

    res.json({
      success: true,
      data: gasInfo
    });
  } catch (error) {
    logger.error('Get gas price error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Estimate transaction cost
 */
app.post('/contract/estimate-cost', async (req, res) => {
  try {
    if (!web3Service) {
      return res.status(503).json({
        success: false,
        error: 'Services not initialized'
      });
    }

    const { functionName, args = [] } = req.body;

    if (!functionName) {
      return res.status(400).json({
        success: false,
        error: 'Missing functionName parameter'
      });
    }

    const estimatedGas = await web3Service.estimateGas(functionName, args);
    const gasPrice = await web3Service.getGasPrice();

    res.json({
      success: true,
      data: {
        function: functionName,
        estimatedGas,
        gasPrice: gasPrice.gasPrice,
        estimatedCost: web3Service.formatEther(
          BigInt(estimatedGas) * BigInt(gasPrice.gasPrice)
        )
      }
    });
  } catch (error) {
    logger.error('Estimate cost error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Ticket routes
 */
if (ticketService) {
  const ticketRoutes = initializeTicketRoutes(ticketService);
  app.use('/api/tickets', ticketRoutes);
}

// ============================================
// ERROR HANDLING
// ============================================

/**
 * 404 handler
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

/**
 * Error handler
 */
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);

  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================
// SERVER START
// ============================================

async function startServer() {
  try {
    // Initialize services
    await initializeServices();

    const PORT = process.env.PORT || 3001;

    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════╗
║   NFT Ticketing System - Backend Server    ║
╠════════════════════════════════════════════╣
║ Server: http://localhost:${PORT}          
║ Health: http://localhost:${PORT}/health
║ API: http://localhost:${PORT}/api/tickets
║
║ Network: ${web3Service.getNetwork()}
║ Contract: ${web3Service.getContractAddress()}
╚════════════════════════════════════════════╝
      `);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, shutting down gracefully...');
      process.exit(0);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start server if this is main module
if (require.main === module) {
  startServer();
}

module.exports = { app, initializeServices };
