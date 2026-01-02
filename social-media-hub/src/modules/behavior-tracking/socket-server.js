/**
 * Socket.io Server for Real-time Behavior Tracking
 * Manages WebSocket connections and event broadcasting
 */

const io = require('socket.io');
const Redis = require('ioredis');
const { createAdapter } = require('@socket.io/redis-adapter');
const { v4: uuidv4 } = require('uuid');
const logger = require('../../shared/logger');
const { authenticate } = require('../../middleware/auth');
const eventHandlers = require('./handlers/eventHandlers');
const { UserSession, UserBehaviorEvent } = require('./models');

class BehaviorTrackingServer {
  constructor(httpServer, redisClient) {
    this.httpServer = httpServer;
    this.redisClient = redisClient;
    this.io = null;
    this.activeSessions = new Map();
    this.userConnections = new Map();
  }

  /**
   * Initialize Socket.io server
   */
  async initialize() {
    this.io = io(this.httpServer, {
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling'],
      pingInterval: 25000,
      pingTimeout: 60000,
      maxHttpBufferSize: 1e6, // 1MB
      adapter: createAdapter(this.redisClient, new Redis(process.env.REDIS_URL))
    });

    this.setupMiddleware();
    this.setupEventListeners();
    this.setupEventHandlers();

    logger.info('Behavior Tracking Socket.io Server initialized');
  }

  /**
   * Setup Socket.io middleware
   */
  setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (!token && process.env.NODE_ENV !== 'development') {
          return next(new Error('Authentication required'));
        }

        if (token) {
          const decoded = await authenticate({ headers: { authorization: `Bearer ${token}` } });
          socket.userId = decoded.userId;
        }

        socket.sessionId = uuidv4();
        socket.connectedAt = Date.now();
        socket.events = [];

        next();
      } catch (error) {
        logger.error('Socket authentication failed:', error);
        next(error);
      }
    });

    // Rate limiting middleware
    this.io.use((socket, next) => {
      const userId = socket.userId || 'anonymous';
      const key = `socket:${userId}`;
      
      this.redisClient.incr(key, (err, count) => {
        if (count > 100) {
          return next(new Error('Too many connections'));
        }
        this.redisClient.expire(key, 60);
        next();
      });
    });
  }

  /**
   * Setup Socket.io event listeners
   */
  setupEventListeners() {
    this.io.on('connection', async (socket) => {
      try {
        logger.info(`User connected: ${socket.userId || 'anonymous'} - Session: ${socket.sessionId}`);

        // Create or update session
        await this.createSession(socket);

        // Track user connection
        if (socket.userId) {
          if (!this.userConnections.has(socket.userId)) {
            this.userConnections.set(socket.userId, []);
          }
          this.userConnections.get(socket.userId).push(socket.id);
        }

        // Notify about new connection
        this.io.emit('user:connected', {
          userId: socket.userId || 'anonymous',
          sessionId: socket.sessionId,
          timestamp: new Date()
        });

        // Disconnect handler
        socket.on('disconnect', async () => {
          await this.handleDisconnect(socket);
        });

        // Join room handler
        socket.on('join:room', (data) => {
          socket.join(data.room);
          logger.debug(`Socket ${socket.id} joined room ${data.room}`);
        });

        // Leave room handler
        socket.on('leave:room', (data) => {
          socket.leave(data.room);
          logger.debug(`Socket ${socket.id} left room ${data.room}`);
        });

      } catch (error) {
        logger.error('Connection handler error:', error);
        socket.disconnect(true);
      }
    });
  }

  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    const handlers = [
      { event: 'pageView', handler: eventHandlers.handlePageView },
      { event: 'click', handler: eventHandlers.handleClick },
      { event: 'scroll', handler: eventHandlers.handleScroll },
      { event: 'formSubmit', handler: eventHandlers.handleFormSubmit },
      { event: 'videoPlay', handler: eventHandlers.handleVideoPlay },
      { event: 'videoPause', handler: eventHandlers.handleVideoPause },
      { event: 'search', handler: eventHandlers.handleSearch },
      { event: 'social:like', handler: eventHandlers.handleLike },
      { event: 'social:comment', handler: eventHandlers.handleComment },
      { event: 'social:share', handler: eventHandlers.handleShare },
      { event: 'social:follow', handler: eventHandlers.handleFollow },
      { event: 'engagement:custom', handler: eventHandlers.handleCustomEvent }
    ];

    this.io.on('connection', (socket) => {
      handlers.forEach(({ event, handler }) => {
        socket.on(event, async (data, callback) => {
          try {
            const eventData = await handler(
              socket.userId || 'anonymous',
              socket.sessionId,
              data,
              socket
            );

            // Save to database
            await this.recordEvent(socket, eventData);

            // Broadcast to listeners
            this.broadcastEvent(event, eventData, socket);

            // Callback
            if (callback) callback({ success: true, eventId: eventData.eventId });
          } catch (error) {
            logger.error(`Error handling ${event}:`, error);
            if (callback) callback({ success: false, error: error.message });
          }
        });
      });
    });
  }

  /**
   * Create or update user session
   */
  async createSession(socket) {
    try {
      const sessionData = {
        sessionId: socket.sessionId,
        userId: socket.userId,
        userAgent: socket.handshake.headers['user-agent'],
        ipAddress: socket.handshake.address,
        startTime: new Date(),
        status: 'active',
        pageViews: 0,
        interactions: 0
      };

      // Save to cache
      await this.redisClient.setex(
        `session:${socket.sessionId}`,
        3600, // 1 hour
        JSON.stringify(sessionData)
      );

      // Save to database
      const session = new UserSession(sessionData);
      await session.save();

      this.activeSessions.set(socket.sessionId, sessionData);

      return session;
    } catch (error) {
      logger.error('Session creation error:', error);
    }
  }

  /**
   * Record event in database
   */
  async recordEvent(socket, eventData) {
    try {
      const event = new UserBehaviorEvent({
        ...eventData,
        userId: socket.userId,
        sessionId: socket.sessionId,
        userAgent: socket.handshake.headers['user-agent'],
        ipAddress: socket.handshake.address
      });

      await event.save();

      // Update session cache
      const sessionKey = `session:${socket.sessionId}`;
      const sessionData = await this.redisClient.get(sessionKey);
      
      if (sessionData) {
        const session = JSON.parse(sessionData);
        session.interactions = (session.interactions || 0) + 1;
        await this.redisClient.setex(sessionKey, 3600, JSON.stringify(session));
      }

      // Store in socket for analytics
      socket.events.push(eventData);

      return event;
    } catch (error) {
      logger.error('Event recording error:', error);
    }
  }

  /**
   * Broadcast event to connected clients
   */
  broadcastEvent(eventType, eventData, originSocket) {
    try {
      // Broadcast to all connected clients except origin
      this.io.to(eventData.userId).emit('behavior:event', {
        type: eventType,
        data: eventData,
        timestamp: new Date()
      });

      // Broadcast to analytics room
      this.io.to('analytics').emit('analytics:update', {
        eventType,
        eventData,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Event broadcast error:', error);
    }
  }

  /**
   * Handle user disconnect
   */
  async handleDisconnect(socket) {
    try {
      logger.info(`User disconnected: ${socket.userId || 'anonymous'} - Session: ${socket.sessionId}`);

      // Update session
      const sessionKey = `session:${socket.sessionId}`;
      const sessionData = await this.redisClient.get(sessionKey);
      
      if (sessionData) {
        const session = JSON.parse(sessionData);
        session.status = 'ended';
        session.endTime = new Date();
        session.duration = session.endTime - session.startTime;

        // Update in database
        await UserSession.findOneAndUpdate(
          { sessionId: socket.sessionId },
          session
        );
      }

      // Remove from active sessions
      this.activeSessions.delete(socket.sessionId);

      // Remove user connection
      if (socket.userId && this.userConnections.has(socket.userId)) {
        const connections = this.userConnections.get(socket.userId);
        const index = connections.indexOf(socket.id);
        if (index > -1) {
          connections.splice(index, 1);
        }
      }

      // Notify about disconnection
      this.io.emit('user:disconnected', {
        userId: socket.userId || 'anonymous',
        sessionId: socket.sessionId,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Disconnect handler error:', error);
    }
  }

  /**
   * Get active sessions count
   */
  getActiveSessionsCount() {
    return this.activeSessions.size;
  }

  /**
   * Get user connections
   */
  getUserConnections(userId) {
    return this.userConnections.get(userId) || [];
  }

  /**
   * Emit to specific user
   */
  emitToUser(userId, event, data) {
    this.io.to(userId).emit(event, data);
  }

  /**
   * Emit to room
   */
  emitToRoom(room, event, data) {
    this.io.to(room).emit(event, data);
  }

  /**
   * Close server
   */
  async close() {
    return new Promise((resolve) => {
      this.io.close(resolve);
    });
  }
}

module.exports = BehaviorTrackingServer;
