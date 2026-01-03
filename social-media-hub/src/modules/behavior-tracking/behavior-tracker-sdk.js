/**
 * Client-side JavaScript SDK for Behavior Tracking
 * Include in frontend to send real-time user interaction events
 */

(function(window) {
  const BehaviorTracker = {
    // Configuration
    config: {
      socketUrl: window.BEHAVIOR_TRACKER_URL || window.location.origin,
      authToken: null,
      enabled: true,
      batchSize: 10,
      batchTimeout: 5000,
      debug: false
    },

    // State
    state: {
      socket: null,
      sessionId: null,
      isConnected: false,
      eventQueue: [],
      batchTimer: null,
      startTime: Date.now(),
      currentPageUrl: window.location.href,
      lastScrollY: 0,
      pageViewSent: false
    },

    /**
     * Initialize tracker
     */
    init: function(config = {}) {
      this.config = { ...this.config, ...config };
      
      if (!this.config.enabled) return;

      this.connect();
      this.setupPageViewTracking();
      this.setupClickTracking();
      this.setupScrollTracking();
      this.setupUnloadTracking();

      this.log('Behavior Tracker initialized');
    },

    /**
     * Connect to Socket.io server
     */
    connect: function() {
      try {
        const io = window.io;
        if (!io) {
          console.error('Socket.io not loaded');
          return;
        }

        this.state.socket = io(this.config.socketUrl, {
          auth: {
            token: this.config.authToken
          },
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5,
          transports: ['websocket', 'polling']
        });

        this.setupSocketListeners();
      } catch (error) {
        this.log('Socket connection error:', error);
      }
    },

    /**
     * Setup Socket.io event listeners
     */
    setupSocketListeners: function() {
      const socket = this.state.socket;

      socket.on('connect', () => {
        this.state.isConnected = true;
        this.state.sessionId = socket.id;
        this.log('Connected to behavior tracking server');
      });

      socket.on('disconnect', () => {
        this.state.isConnected = false;
        this.log('Disconnected from behavior tracking server');
      });

      socket.on('error', (error) => {
        this.log('Socket error:', error);
      });

      socket.on('behavior:acknowledged', (data) => {
        this.log('Event acknowledged:', data.eventId);
      });
    },

    /**
     * Setup page view tracking
     */
    setupPageViewTracking: function() {
      if (this.state.pageViewSent) return;

      const pageUrl = window.location.href;
      const pageTitle = document.title;
      const referer = document.referrer;

      this.trackEvent('pageView', {
        url: pageUrl,
        title: pageTitle,
        referer: referer,
        timestamp: Date.now()
      });

      this.state.pageViewSent = true;
    },

    /**
     * Setup click tracking
     */
    setupClickTracking: function() {
      document.addEventListener('click', (event) => {
        if (!this.config.enabled || !this.state.isConnected) return;

        const target = event.target;
        const rect = target.getBoundingClientRect();

        this.trackEvent('click', {
          url: window.location.href,
          elementId: target.id || '',
          elementClass: target.className || '',
          elementText: target.innerText?.substring(0, 100) || '',
          x: event.clientX || rect.left,
          y: event.clientY || rect.top,
          timestamp: Date.now()
        });
      }, true);
    },

    /**
     * Setup scroll tracking
     */
    setupScrollTracking: function() {
      let scrollTimeout;
      
      window.addEventListener('scroll', () => {
        if (!this.config.enabled || !this.state.isConnected) return;

        clearTimeout(scrollTimeout);

        scrollTimeout = setTimeout(() => {
          const scrollY = window.scrollY || document.documentElement.scrollTop;
          const pageHeight = document.documentElement.scrollHeight - window.innerHeight;
          const scrollPercentage = pageHeight > 0 ? (scrollY / pageHeight) * 100 : 0;

          this.trackEvent('scroll', {
            url: window.location.href,
            scrollX: window.scrollX || 0,
            scrollY: scrollY,
            pageHeight: document.documentElement.scrollHeight,
            viewportHeight: window.innerHeight,
            scrollPercentage: scrollPercentage,
            timestamp: Date.now()
          });
        }, 500);
      });
    },

    /**
     * Setup unload tracking
     */
    setupUnloadTracking: function() {
      window.addEventListener('beforeunload', () => {
        if (!this.config.enabled) return;

        const timeOnPage = Date.now() - this.state.startTime;
        
        this.trackEvent('pageView', {
          url: window.location.href,
          timeOnPage: timeOnPage,
          timestamp: Date.now()
        });

        this.flush();
      });
    },

    /**
     * Track form submission
     */
    trackFormSubmit: function(formId, formData = {}, timeToComplete = 0) {
      if (!this.config.enabled) return;

      this.trackEvent('formSubmit', {
        url: window.location.href,
        formId: formId,
        formData: this.sanitizeObject(formData),
        fieldsCount: Object.keys(formData).length,
        timeToComplete: timeToComplete,
        timestamp: Date.now()
      });
    },

    /**
     * Track video playback
     */
    trackVideoEvent: function(videoId, eventType, videoData = {}) {
      if (!this.config.enabled) return;

      const eventName = eventType === 'play' ? 'videoPlay' : 'videoPause';

      this.trackEvent(eventName, {
        url: window.location.href,
        videoId: videoId,
        videoTitle: videoData.title || '',
        videoUrl: videoData.url || '',
        videoDuration: videoData.duration || 0,
        currentTime: videoData.currentTime || 0,
        watchPercentage: videoData.duration 
          ? ((videoData.currentTime / videoData.duration) * 100).toFixed(2) 
          : 0,
        timestamp: Date.now()
      });
    },

    /**
     * Track search
     */
    trackSearch: function(query, resultsCount = 0, searchType = 'general', timeToSearch = 0) {
      if (!this.config.enabled) return;

      this.trackEvent('search', {
        url: window.location.href,
        searchFieldId: 'search-input',
        query: query,
        resultsCount: resultsCount,
        searchType: searchType,
        timeToSearch: timeToSearch,
        timestamp: Date.now()
      });
    },

    /**
     * Track social interaction
     */
    trackSocialInteraction: function(action, contentId, contentData = {}) {
      if (!this.config.enabled) return;

      const eventName = `social:${action}`;
      const eventMap = {
        'like': 'like',
        'unlike': 'like',
        'comment': 'comment',
        'share': 'share',
        'follow': 'follow',
        'unfollow': 'follow'
      };

      this.trackEvent(eventMap[action] || 'custom', {
        url: window.location.href,
        contentId: contentId,
        contentType: contentData.contentType || 'post',
        contentOwnerId: contentData.contentOwnerId || '',
        liked: action !== 'unlike',
        isFollow: action !== 'unfollow',
        platform: contentData.platform || 'general',
        timestamp: Date.now()
      });
    },

    /**
     * Track custom event
     */
    trackCustomEvent: function(category, metadata = {}, tags = []) {
      if (!this.config.enabled) return;

      this.trackEvent('engagement:custom', {
        url: window.location.href,
        category: category,
        metadata: this.sanitizeObject(metadata),
        tags: tags,
        timestamp: Date.now()
      });
    },

    /**
     * Core event tracking method
     */
    trackEvent: function(eventType, data) {
      if (!this.config.enabled || !this.state.socket) return;

      const event = {
        type: eventType,
        data: data,
        queuedAt: Date.now()
      };

      this.state.eventQueue.push(event);

      // Batch send
      if (this.state.eventQueue.length >= this.config.batchSize) {
        this.flush();
      } else {
        this.resetBatchTimer();
      }
    },

    /**
     * Send batched events
     */
    flush: function() {
      if (!this.state.socket || this.state.eventQueue.length === 0) return;

      clearTimeout(this.state.batchTimer);

      const events = this.state.eventQueue.splice(0, this.config.batchSize);

      events.forEach(event => {
        this.state.socket.emit(event.type, event.data, (response) => {
          if (response && response.success) {
            this.log(`Event sent: ${event.type}`);
          }
        });
      });
    },

    /**
     * Reset batch timer
     */
    resetBatchTimer: function() {
      clearTimeout(this.state.batchTimer);

      this.state.batchTimer = setTimeout(() => {
        this.flush();
      }, this.config.batchTimeout);
    },

    /**
     * Sanitize object (remove sensitive data)
     */
    sanitizeObject: function(obj) {
      const sensitiveFields = ['password', 'credit_card', 'ssn', 'cvv', 'token', 'apiKey', 'secret'];
      const sanitized = { ...obj };

      sensitiveFields.forEach(field => {
        Object.keys(sanitized).forEach(key => {
          if (key.toLowerCase().includes(field.toLowerCase())) {
            sanitized[key] = '[REDACTED]';
          }
        });
      });

      return sanitized;
    },

    /**
     * Logging utility
     */
    log: function(...args) {
      if (this.config.debug) {
        console.log('[BehaviorTracker]', ...args);
      }
    },

    /**
     * Set authentication token
     */
    setAuthToken: function(token) {
      this.config.authToken = token;
      if (this.state.socket) {
        this.state.socket.auth.token = token;
        this.state.socket.disconnect();
        this.connect();
      }
    },

    /**
     * Disable/enable tracking
     */
    setEnabled: function(enabled) {
      this.config.enabled = enabled;
    }
  };

  // Export to window
  window.BehaviorTracker = BehaviorTracker;

  // Auto-initialize if data attribute present
  if (document.currentScript && document.currentScript.dataset.autoInit === 'true') {
    document.addEventListener('DOMContentLoaded', () => {
      BehaviorTracker.init();
    });
  }

})(window);
