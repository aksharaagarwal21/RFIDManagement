const express = require('express');
const {
  getStudentDashboard,
  getTeacherDashboard,
  getWardenDashboard
} = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();

// Protect all dashboard routes
router.use(protect);

// Role-specific dashboard routes
router.get('/student', authorize(ROLES.STUDENT), getStudentDashboard);
router.get('/teacher', authorize(ROLES.TEACHER), getTeacherDashboard);
router.get('/warden', authorize(ROLES.WARDEN), getWardenDashboard);

module.exports = router;
