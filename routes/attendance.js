const express = require('express');
const {
  markAttendance,
  getAttendance,
  getAttendanceStats,
  getAttendanceReport
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');
const { validateAttendance, validatePagination } = require('../middleware/validation');
const { ROLES } = require('../config/constants');

const router = express.Router();

// Protect all routes
router.use(protect);

// Teacher and admin routes
router.post('/mark', 
  authorize(ROLES.TEACHER, ROLES.ADMIN), 
  validateAttendance, 
  markAttendance
);

router.get('/report', 
  authorize(ROLES.TEACHER, ROLES.ADMIN), 
  getAttendanceReport
);

// General routes (accessible by students, teachers, admins)
router.get('/', validatePagination, getAttendance);
router.get('/stats', getAttendanceStats);

module.exports = router;
