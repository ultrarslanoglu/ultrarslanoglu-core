const express = require('express');
const router = express.Router();
const { authenticateToken, optionalAuth } = require('../utils/auth');
const pointsService = require('../services/points');
const logger = require('../utils/logger');

// Earn points for the authenticated user
router.post('/earn', authenticateToken, async (req, res) => {
  try {
    const { points, metadata } = req.body;
    const result = await pointsService.earnPoints({
      userId: req.user.id,
      email: req.user.email,
      username: req.user.username,
      points,
      metadata
    });

    res.status(201).json({
      success: true,
      data: {
        balance: result.balance,
        transaction: result.transaction
      }
    });
  } catch (error) {
    if (error instanceof pointsService.PointsError) {
      return res.status(error.status).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }

    logger.error('Points earn error:', error);
    res.status(500).json({
      success: false,
      error: 'Points could not be added',
      code: 'POINTS_EARN_FAILED'
    });
  }
});

// Redeem points (with balance check)
router.post('/redeem', authenticateToken, async (req, res) => {
  try {
    const { points, metadata } = req.body;
    const result = await pointsService.redeemPoints({
      userId: req.user.id,
      email: req.user.email,
      username: req.user.username,
      points,
      metadata
    });

    res.json({
      success: true,
      data: {
        balance: result.balance,
        transaction: result.transaction
      }
    });
  } catch (error) {
    if (error instanceof pointsService.PointsError) {
      return res.status(error.status).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }

    logger.error('Points redeem error:', error);
    res.status(500).json({
      success: false,
      error: 'Points could not be redeemed',
      code: 'POINTS_REDEEM_FAILED'
    });
  }
});

// Leaderboard: top users by balance (optionally public)
router.get('/leaderboard', optionalAuth, async (req, res) => {
  try {
    const { limit, offset } = req.query;
    const leaderboard = await pointsService.getLeaderboard({ limit, offset });

    res.json({
      success: true,
      data: {
        leaderboard
      }
    });
  } catch (error) {
    logger.error('Points leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Leaderboard could not be loaded',
      code: 'LEADERBOARD_FAILED'
    });
  }
});

module.exports = router;
