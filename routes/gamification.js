const express = require('express');
const {
  getGamificationProfile,
  getLeaderboard,
  getAvailableBadges,
  checkAndAwardBadges,
  getPointsHistory
} = require('../controllers/gamificationController');
const { protect, authorize } = require('../middleware/auth');
const { validatePagination } = require('../middleware/validation');
const { ROLES } = require('../config/constants');

const router = express.Router();

// Protect all routes
router.use(protect);

// Student-only routes
router.get('/profile', authorize(ROLES.STUDENT), getGamificationProfile);
router.post('/check-badges', authorize(ROLES.STUDENT), checkAndAwardBadges);
router.get('/points-history', authorize(ROLES.STUDENT), validatePagination, getPointsHistory);

// General routes (accessible by all authenticated users)
router.get('/leaderboard', getLeaderboard);
router.get('/badges', getAvailableBadges);

module.exports = router;
