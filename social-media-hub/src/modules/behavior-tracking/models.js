/**
 * User Behavior Tracking Module
 * Real-time user interaction monitoring with Socket.io
 * 
 * Features:
 * - Live event streaming via Socket.io
 * - MongoDB persistence
 * - Real-time dashboard support
 * - Analytics and reporting
 */

const mongoose = require('mongoose');
const { EventEmitter } = require('events');

// ============================================
// USER BEHAVIOR EVENT SCHEMA
// ============================================

const userBehaviorEventSchema = new mongoose.Schema({
  // Event Identification
  eventId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  
  // Event Details
  eventType: {
    type: String,
    enum: [
      'page_view',
      'click',
      'scroll',
      'form_submit',
      'video_play',
      'video_pause',
      'search',
      'like',
      'comment',
      'share',
      'follow',
      'unfollow',
      'download',
      'upload',
      'api_call',
      'error',
      'custom'
    ],
    required: true,
    index: true
  },
  eventCategory: {
    type: String,
    enum: [
      'engagement',
      'navigation',
      'content',
      'social',
      'system',
      'error'
    ],
    index: true
  },
  
  // User Context
  userAgent: String,
  ipAddress: String,
  country: String,
  region: String,
  deviceType: {
    type: String,
    enum: ['mobile', 'tablet', 'desktop']
  },
  browser: String,
  osVersion: String,
  
  // Event Metadata
  url: String,
  referer: String,
  pageTitle: String,
  
  // Interaction Data
  data: {
    elementId: String,
    elementClass: String,
    elementText: String,
    scrollPosition: {
      x: Number,
      y: Number
    },
    mouseCoordinates: {
      x: Number,
      y: Number
    },
    timeOnPage: Number, // milliseconds
    keyPressed: String,
    formData: mongoose.Schema.Types.Mixed,
    customMetadata: mongoose.Schema.Types.Mixed
  },
  
  // Performance Metrics
  metrics: {
    responseTime: Number,
    loadTime: Number,
    renderTime: Number,
    memoryUsage: Number,
    cpuUsage: Number
  },
  
  // Timestamps
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  clientTime: Date,
  duration: Number, // Duration of event in milliseconds
  
  // Status
  status: {
    type: String,
    enum: ['success', 'warning', 'error'],
    default: 'success'
  },
  errorMessage: String,
  
  // Analytics Tags
  tags: [String],
  source: {
    type: String,
    enum: ['web', 'mobile_app', 'api']
  },
  
  // Retention
  archived: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true,
  collection: 'user_behavior_events'
});

// ============================================
// INDEXES FOR PERFORMANCE
// ============================================

userBehaviorEventSchema.index({ userId: 1, timestamp: -1 });
userBehaviorEventSchema.index({ sessionId: 1, timestamp: -1 });
userBehaviorEventSchema.index({ eventType: 1, timestamp: -1 });
userBehaviorEventSchema.index({ eventCategory: 1, timestamp: -1 });
userBehaviorEventSchema.index({ 'data.elementId': 1 });
userBehaviorEventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 }); // 90 days TTL

// ============================================
// USER SESSION SCHEMA
// ============================================

const userSessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Session Details
  startTime: {
    type: Date,
    default: Date.now,
    index: true
  },
  endTime: Date,
  duration: Number, // milliseconds
  
  // Device & Location
  userAgent: String,
  ipAddress: String,
  country: String,
  deviceType: String,
  browser: String,
  
  // Engagement Metrics
  pageViews: {
    type: Number,
    default: 0
  },
  interactions: {
    type: Number,
    default: 0
  },
  clicks: {
    type: Number,
    default: 0
  },
  searches: {
    type: Number,
    default: 0
  },
  
  // Session Status
  status: {
    type: String,
    enum: ['active', 'idle', 'ended'],
    default: 'active'
  },
  isBot: {
    type: Boolean,
    default: false
  },
  
  // Pages Visited
  pages: [{
    url: String,
    title: String,
    enteredAt: Date,
    exitedAt: Date,
    timeSpent: Number
  }],
  
  // Events Summary
  eventSummary: {
    totalEvents: Number,
    byType: mongoose.Schema.Types.Mixed,
    byCategory: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true,
  collection: 'user_sessions'
});

userSessionSchema.index({ sessionId: 1 });
userSessionSchema.index({ userId: 1, startTime: -1 });
userSessionSchema.index({ startTime: 1 }, { expireAfterSeconds: 15552000 }); // 180 days

// ============================================
// BEHAVIOR ANALYTICS SCHEMA
// ============================================

const behaviorAnalyticsSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    index: true
  },
  
  // User Metrics
  totalUsers: Number,
  newUsers: Number,
  returningUsers: Number,
  activeSessions: Number,
  
  // Event Metrics
  totalEvents: Number,
  eventsByType: mongoose.Schema.Types.Mixed,
  eventsByCategory: mongoose.Schema.Types.Mixed,
  
  // Engagement Metrics
  avgSessionDuration: Number,
  avgPageViewsPerSession: Number,
  avgInteractionsPerSession: Number,
  bounceRate: Number,
  
  // Device Metrics
  deviceBreakdown: mongoose.Schema.Types.Mixed,
  browserBreakdown: mongoose.Schema.Types.Mixed,
  osBreakdown: mongoose.Schema.Types.Mixed,
  
  // Geographic Metrics
  topCountries: [{
    country: String,
    count: Number
  }],
  topRegions: [{
    region: String,
    count: Number
  }],
  
  // Performance Metrics
  avgLoadTime: Number,
  avgRenderTime: Number,
  errorRate: Number,
  
  // Peak Times
  peakHour: Number,
  peakDayOfWeek: Number
}, {
  timestamps: true,
  collection: 'behavior_analytics'
});

behaviorAnalyticsSchema.index({ date: -1 });
behaviorAnalyticsSchema.index({ date: 1 }, { expireAfterSeconds: 31536000 }); // 1 year

// ============================================
// MODELS EXPORT
// ============================================

const UserBehaviorEvent = mongoose.model('UserBehaviorEvent', userBehaviorEventSchema);
const UserSession = mongoose.model('UserSession', userSessionSchema);
const BehaviorAnalytics = mongoose.model('BehaviorAnalytics', behaviorAnalyticsSchema);

module.exports = {
  UserBehaviorEvent,
  UserSession,
  BehaviorAnalytics,
  schemas: {
    userBehaviorEventSchema,
    userSessionSchema,
    behaviorAnalyticsSchema
  }
};
