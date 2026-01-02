/**
 * Analytics REST API Endpoints
 * Provides dashboard data for user behavior analytics
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const logger = require('../../../shared/logger');
const { requireAuth } = require('../../../middleware/auth');
const { UserBehaviorEvent, UserSession, BehaviorAnalytics } = require('../models');

/**
 * GET /analytics/overview
 * Get overall analytics summary
 */
router.get('/overview', requireAuth, async (req, res) => {
  try {
    const { startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), endDate = new Date() } = req.query;

    const result = await UserBehaviorEvent.aggregate([
      {
        $match: {
          timestamp: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        }
      },
      {
        $facet: {
          totalEvents: [{ $count: 'count' }],
          uniqueUsers: [{ $group: { _id: '$userId' } }, { $count: 'count' }],
          uniqueSessions: [{ $group: { _id: '$sessionId' } }, { $count: 'count' }],
          eventsByType: [
            { $group: { _id: '$eventType', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ],
          eventsByCategory: [
            { $group: { _id: '$eventCategory', count: { $sum: 1 } } }
          ]
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalEvents: result[0].totalEvents[0]?.count || 0,
        uniqueUsers: result[0].uniqueUsers[0]?.count || 0,
        uniqueSessions: result[0].uniqueSessions[0]?.count || 0,
        eventsByType: result[0].eventsByType || [],
        eventsByCategory: result[0].eventsByCategory || []
      }
    });
  } catch (error) {
    logger.error('Analytics overview error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /analytics/events
 * Get events with filtering and pagination
 */
router.get('/events', requireAuth, async (req, res) => {
  try {
    const {
      userId,
      sessionId,
      eventType,
      startDate = new Date(Date.now() - 24 * 60 * 60 * 1000),
      endDate = new Date(),
      limit = 50,
      skip = 0
    } = req.query;

    const query = {
      timestamp: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    if (userId) query.userId = mongoose.Types.ObjectId(userId);
    if (sessionId) query.sessionId = sessionId;
    if (eventType) query.eventType = eventType;

    const [events, total] = await Promise.all([
      UserBehaviorEvent.find(query)
        .limit(parseInt(limit))
        .skip(parseInt(skip))
        .sort({ timestamp: -1 })
        .lean(),
      UserBehaviorEvent.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        events,
        pagination: {
          total,
          skip: parseInt(skip),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    logger.error('Events query error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /analytics/sessions
 * Get user sessions
 */
router.get('/sessions', requireAuth, async (req, res) => {
  try {
    const {
      userId,
      status = 'all',
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      endDate = new Date(),
      limit = 50,
      skip = 0
    } = req.query;

    const query = {
      startTime: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    if (userId) query.userId = mongoose.Types.ObjectId(userId);
    if (status !== 'all') query.status = status;

    const [sessions, total] = await Promise.all([
      UserSession.find(query)
        .limit(parseInt(limit))
        .skip(parseInt(skip))
        .sort({ startTime: -1 })
        .lean(),
      UserSession.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        sessions,
        pagination: {
          total,
          skip: parseInt(skip),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    logger.error('Sessions query error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /analytics/user/:userId
 * Get detailed user analytics
 */
router.get('/user/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), endDate = new Date() } = req.query;

    const objectId = mongoose.Types.ObjectId(userId);

    const [events, sessions, summary] = await Promise.all([
      UserBehaviorEvent.find({
        userId: objectId,
        timestamp: { $gte: new Date(startDate), $lte: new Date(endDate) }
      }).sort({ timestamp: -1 }).limit(100).lean(),

      UserSession.find({
        userId: objectId,
        startTime: { $gte: new Date(startDate), $lte: new Date(endDate) }
      }).sort({ startTime: -1 }).lean(),

      UserBehaviorEvent.aggregate([
        {
          $match: {
            userId: objectId,
            timestamp: { $gte: new Date(startDate), $lte: new Date(endDate) }
          }
        },
        {
          $facet: {
            totalEvents: [{ $count: 'count' }],
            eventsByType: [
              { $group: { _id: '$eventType', count: { $sum: 1 } } }
            ],
            totalSessions: [{ $group: { _id: '$sessionId' } }, { $count: 'count' }]
          }
        }
      ])
    ]);

    res.json({
      success: true,
      data: {
        userId,
        events,
        sessions,
        summary: {
          totalEvents: summary[0].totalEvents[0]?.count || 0,
          totalSessions: summary[0].totalSessions[0]?.count || 0,
          eventsByType: summary[0].eventsByType || []
        }
      }
    });
  } catch (error) {
    logger.error('User analytics error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /analytics/heatmap
 * Get page heatmap data (clicks, scrolls, time spent)
 */
router.get('/heatmap', requireAuth, async (req, res) => {
  try {
    const { url, startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), endDate = new Date() } = req.query;

    if (!url) {
      return res.status(400).json({ success: false, error: 'URL parameter required' });
    }

    const heatmapData = await UserBehaviorEvent.aggregate([
      {
        $match: {
          url,
          eventType: { $in: ['click', 'scroll'] },
          timestamp: { $gte: new Date(startDate), $lte: new Date(endDate) }
        }
      },
      {
        $group: {
          _id: {
            elementId: '$data.elementId',
            x: { $trunc: '$data.mouseCoordinates.x' },
            y: { $trunc: '$data.mouseCoordinates.y' }
          },
          count: { $sum: 1 },
          eventTypes: { $addToSet: '$eventType' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        url,
        heatmapPoints: heatmapData,
        totalEvents: heatmapData.reduce((sum, item) => sum + item.count, 0)
      }
    });
  } catch (error) {
    logger.error('Heatmap query error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /analytics/metrics
 * Get real-time metrics
 */
router.get('/metrics', requireAuth, async (req, res) => {
  try {
    const { interval = '1hour' } = req.query;

    let dateOffset = 1 * 60 * 60 * 1000; // 1 hour default
    if (interval === '1day') dateOffset = 24 * 60 * 60 * 1000;
    if (interval === '7days') dateOffset = 7 * 24 * 60 * 60 * 1000;
    if (interval === '30days') dateOffset = 30 * 24 * 60 * 60 * 1000;

    const startDate = new Date(Date.now() - dateOffset);

    const metrics = await UserBehaviorEvent.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d %H:00', date: '$timestamp' }
          },
          eventCount: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' },
          uniqueSessions: { $addToSet: '$sessionId' },
          avgResponseTime: { $avg: '$metrics.responseTime' }
        }
      },
      {
        $project: {
          _id: 1,
          eventCount: 1,
          uniqueUsers: { $size: '$uniqueUsers' },
          uniqueSessions: { $size: '$uniqueSessions' },
          avgResponseTime: { $round: ['$avgResponseTime', 2] }
        }
      },
      {
        $sort: { _id: -1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        interval,
        metrics
      }
    });
  } catch (error) {
    logger.error('Metrics query error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /analytics/devices
 * Get device breakdown
 */
router.get('/devices', requireAuth, async (req, res) => {
  try {
    const { startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), endDate = new Date() } = req.query;

    const deviceStats = await UserBehaviorEvent.aggregate([
      {
        $match: {
          timestamp: { $gte: new Date(startDate), $lte: new Date(endDate) }
        }
      },
      {
        $group: {
          _id: '$deviceType',
          count: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' }
        }
      },
      {
        $project: {
          _id: 1,
          count: 1,
          uniqueUsers: { $size: '$uniqueUsers' },
          percentage: {
            $multiply: [
              { $divide: ['$count', { $literal: null }] },
              100
            ]
          }
        }
      }
    ]);

    // Calculate percentages
    const total = deviceStats.reduce((sum, stat) => sum + stat.count, 0);
    const stats = deviceStats.map(stat => ({
      ...stat,
      percentage: ((stat.count / total) * 100).toFixed(2)
    }));

    res.json({
      success: true,
      data: {
        total,
        devices: stats
      }
    });
  } catch (error) {
    logger.error('Device stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /analytics/export
 * Export analytics data
 */
router.post('/export', requireAuth, async (req, res) => {
  try {
    const { startDate, endDate, format = 'json', eventType, userId } = req.body;

    const query = {
      timestamp: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    if (eventType) query.eventType = eventType;
    if (userId) query.userId = mongoose.Types.ObjectId(userId);

    const events = await UserBehaviorEvent.find(query).lean();

    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertToCSV(events);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="analytics.csv"');
      res.send(csv);
    } else {
      // JSON format
      res.json({
        success: true,
        data: {
          total: events.length,
          exportedAt: new Date(),
          events
        }
      });
    }
  } catch (error) {
    logger.error('Export error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /analytics/top-pages
 * Get top viewed pages
 */
router.get('/top-pages', requireAuth, async (req, res) => {
  try {
    const { limit = 10, startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), endDate = new Date() } = req.query;

    const topPages = await UserBehaviorEvent.aggregate([
      {
        $match: {
          eventType: 'page_view',
          timestamp: { $gte: new Date(startDate), $lte: new Date(endDate) }
        }
      },
      {
        $group: {
          _id: '$url',
          pageTitle: { $first: '$pageTitle' },
          viewCount: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' },
          avgTimeOnPage: { $avg: '$data.timeOnPage' }
        }
      },
      {
        $project: {
          _id: 1,
          pageTitle: 1,
          viewCount: 1,
          uniqueUsers: { $size: '$uniqueUsers' },
          avgTimeOnPage: { $round: ['$avgTimeOnPage', 2] }
        }
      },
      {
        $sort: { viewCount: -1 }
      },
      {
        $limit: parseInt(limit)
      }
    ]);

    res.json({
      success: true,
      data: topPages
    });
  } catch (error) {
    logger.error('Top pages error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Utility function: Convert events to CSV
 */
function convertToCSV(events) {
  if (events.length === 0) return '';

  const headers = ['eventId', 'userId', 'eventType', 'eventCategory', 'url', 'timestamp', 'status'];
  const rows = events.map(event => [
    event.eventId,
    event.userId,
    event.eventType,
    event.eventCategory,
    event.url,
    new Date(event.timestamp).toISOString(),
    event.status
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell || ''}"`).join(','))
  ].join('\n');

  return csv;
}

module.exports = router;
