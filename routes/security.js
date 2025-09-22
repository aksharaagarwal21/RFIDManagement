const express = require('express');
const SecurityAlert = require('../models/SecurityAlert');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { validateObjectId, validatePagination } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const { ROLES, ALERT_SEVERITY, ALERT_STATUS } = require('../config/constants');

const router = express.Router();

// Protect all routes
router.use(protect);

// @desc    Get security alerts
// @route   GET /api/security/alerts
// @access  Private (Warden, Admin)
const getSecurityAlerts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, severity, status, userId } = req.query;
  
  // Build filter based on user role
  let filter = {};
  
  if (req.user.role === ROLES.WARDEN) {
    // Warden can only see alerts for students in their hostel
    const hostelStudents = await User.find({
      role: 'student',
      'studentDetails.hostelName': req.user.wardenDetails?.hostelName,
      isActive: true
    }).select('userId');
    
    const studentIds = hostelStudents.map(s => s.userId);
    filter.userId = { $in: studentIds };
  }

  // Additional filters
  if (severity) filter.severity = severity;
  if (status) filter.status = status;
  if (userId) filter.userId = userId;

  const alerts = await SecurityAlert.find(filter)
    .sort({ timestamp: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate('userId', 'name profileImage')
    .populate('reviewedBy', 'name');

  const total = await SecurityAlert.countDocuments(filter);

  // Get alert statistics
  const stats = await SecurityAlert.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalAlerts: { $sum: 1 },
        pending: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        high: {
          $sum: { $cond: [{ $eq: ['$severity', 'high'] }, 1, 0] }
        },
        critical: {
          $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] }
        }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      alerts,
      stats: stats[0] || { totalAlerts: 0, pending: 0, high: 0, critical: 0 },
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    }
  });
});

// @desc    Get security alert by ID
// @route   GET /api/security/alerts/:id
// @access  Private (Warden, Admin)
const getSecurityAlertById = asyncHandler(async (req, res) => {
  const alert = await SecurityAlert.findById(req.params.id)
    .populate('userId', 'name profileImage studentDetails')
    .populate('reviewedBy', 'name');

  if (!alert) {
    return res.status(404).json({
      success: false,
      message: 'Security alert not found'
    });
  }

  // Check authorization for wardens
  if (req.user.role === ROLES.WARDEN) {
    const student = await User.findOne({ userId: alert.userId });
    if (student?.studentDetails?.hostelName !== req.user.wardenDetails?.hostelName) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this alert'
      });
    }
  }

  res.json({
    success: true,
    data: { alert }
  });
});

// @desc    Update security alert status
// @route   PUT /api/security/alerts/:id/status
// @access  Private (Warden, Admin)
const updateAlertStatus = asyncHandler(async (req, res) => {
  const { status, resolutionNotes } = req.body;

  if (!Object.values(ALERT_STATUS).includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status value'
    });
  }

  const alert = await SecurityAlert.findById(req.params.id);

  if (!alert) {
    return res.status(404).json({
      success: false,
      message: 'Security alert not found'
    });
  }

  // Check authorization for wardens
  if (req.user.role === ROLES.WARDEN) {
    const student = await User.findOne({ userId: alert.userId });
    if (student?.studentDetails?.hostelName !== req.user.wardenDetails?.hostelName) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this alert'
      });
    }
  }

  alert.status = status;
  alert.reviewedBy = req.user.userId;
  alert.reviewedAt = new Date();
  if (resolutionNotes) {
    alert.resolutionNotes = resolutionNotes;
  }

  await alert.save();

  res.json({
    success: true,
    message: 'Alert status updated successfully',
    data: { alert }
  });
});

// @desc    Create manual security alert
// @route   POST /api/security/alerts
// @access  Private (Warden, Admin)
const createSecurityAlert = asyncHandler(async (req, res) => {
  const {
    userId,
    alertType,
    severity,
    message,
    location,
    details
  } = req.body;

  // Verify user exists
  const user = await User.findOne({ userId, isActive: true });
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Check authorization for wardens
  if (req.user.role === ROLES.WARDEN) {
    if (user.role !== 'student' || 
        user.studentDetails?.hostelName !== req.user.wardenDetails?.hostelName) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create alert for this user'
      });
    }
  }

  const alert = await SecurityAlert.create({
    userId,
    userName: user.name,
    alertType,
    severity,
    message,
    location,
    details,
    timestamp: new Date(),
    status: 'pending'
  });

  res.status(201).json({
    success: true,
    message: 'Security alert created successfully',
    data: { alert }
  });
});

// @desc    Get security dashboard
// @route   GET /api/security/dashboard
// @access  Private (Warden, Admin)
const getSecurityDashboard = asyncHandler(async (req, res) => {
  let filter = {};
  
  if (req.user.role === ROLES.WARDEN) {
    const hostelStudents = await User.find({
      role: 'student',
      'studentDetails.hostelName': req.user.wardenDetails?.hostelName,
      isActive: true
    }).select('userId');
    
    filter.userId = { $in: hostelStudents.map(s => s.userId) };
  }

  // Get recent alerts (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentFilter = { ...filter, timestamp: { $gte: thirtyDaysAgo } };

  // Alert statistics
  const alertStats = await SecurityAlert.aggregate([
    { $match: recentFilter },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        pending: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        resolved: {
          $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
        },
        high: {
          $sum: { $cond: [{ $eq: ['$severity', 'high'] }, 1, 0] }
        },
        critical: {
          $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] }
        }
      }
    }
  ]);

  // Alert trends by type
  const alertTrends = await SecurityAlert.aggregate([
    { $match: recentFilter },
    {
      $group: {
        _id: '$alertType',
        count: { $sum: 1 }
      }
    }
  ]);

  // Recent critical alerts
  const criticalAlerts = await SecurityAlert.find({
    ...filter,
    severity: { $in: ['high', 'critical'] },
    status: 'pending'
  })
    .sort({ timestamp: -1 })
    .limit(10)
    .populate('userId', 'name');

  res.json({
    success: true,
    data: {
      period: '30 days',
      stats: alertStats[0] || { total: 0, pending: 0, resolved: 0, high: 0, critical: 0 },
      trends: alertTrends,
      criticalAlerts
    }
  });
});

// Validation middleware
const validateAlertCreation = [
  require('express-validator').body('userId').notEmpty().withMessage('User ID is required'),
  require('express-validator').body('alertType').notEmpty().withMessage('Alert type is required'),
  require('express-validator').body('severity').isIn(Object.values(ALERT_SEVERITY)).withMessage('Invalid severity'),
  require('express-validator').body('message').notEmpty().withMessage('Message is required'),
  require('express-validator').body('location').notEmpty().withMessage('Location is required'),
  require('../middleware/validation').handleValidationErrors
];

// Routes
router.get('/alerts', 
  authorize(ROLES.WARDEN, ROLES.ADMIN), 
  validatePagination, 
  getSecurityAlerts
);

router.get('/alerts/:id', 
  authorize(ROLES.WARDEN, ROLES.ADMIN), 
  validateObjectId(), 
  getSecurityAlertById
);

router.put('/alerts/:id/status', 
  authorize(ROLES.WARDEN, ROLES.ADMIN), 
  validateObjectId(), 
  updateAlertStatus
);

router.post('/alerts', 
  authorize(ROLES.WARDEN, ROLES.ADMIN), 
  validateAlertCreation, 
  createSecurityAlert
);

router.get('/dashboard', 
  authorize(ROLES.WARDEN, ROLES.ADMIN), 
  getSecurityDashboard
);

module.exports = router;
