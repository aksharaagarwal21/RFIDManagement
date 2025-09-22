const MessLog = require('../models/MessLog');
const Gamification = require('../models/Gamification');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc    Record mess entry
// @route   POST /api/mess/entry
// @access  Private (RFID Device)
const recordMessEntry = asyncHandler(async (req, res) => {
  const {
    studentId,
    messName,
    mealType,
    cost,
    paymentMethod,
    rfidCardId,
    items,
    discount
  } = req.body;

  // Verify student exists
  const student = await User.findOne({ userId: studentId, role: 'student', isActive: true });
  
  if (!student) {
    return res.status(404).json({
      success: false,
      message: 'Student not found'
    });
  }

  // Verify RFID card matches
  if (student.rfidCardId !== rfidCardId) {
    return res.status(400).json({
      success: false,
      message: 'RFID card mismatch'
    });
  }

  // Create mess log
  const messLog = await MessLog.create({
    studentId,
    messName,
    mealType,
    cost,
    paymentMethod,
    rfidCardId,
    items: items || [],
    discount: discount || 0,
    transactionId: generateTransactionId()
  });

  // Update gamification points
  const gamification = await Gamification.findOne({ userId: studentId });
  if (gamification) {
    await gamification.addPoints(2, 'Mess visit', 'mess');
  }

  // Emit real-time update via Socket.IO (check if io exists)
  const io = req.app.get('io');
  if (io) {
    io.to('dashboard-warden').emit('mess-entry', {
      studentId,
      studentName: student.name,
      messName,
      mealType,
      cost: messLog.finalAmount,
      timestamp: messLog.timestamp
    });
  }

  res.status(201).json({
    success: true,
    message: 'Mess entry recorded successfully',
    data: {
      messLog,
      student: {
        name: student.name,
        userId: student.userId
      }
    }
  });
});

// @desc    Get mess logs
// @route   GET /api/mess/logs
// @access  Private
const getMessLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, studentId, messName, mealType, startDate, endDate } = req.query;
  
  // Build filter
  let filter = {};

  // Role-based access control
  if (req.user.role === 'student') {
    filter.studentId = req.user.userId;
  } else if (req.user.role === 'warden') {
    // Warden can see logs of students in their hostel
    const hostelStudents = await User.find({
      role: 'student',
      'studentDetails.hostelName': req.user.wardenDetails?.hostelName,
      isActive: true
    }).select('userId');
    
    const studentIds = hostelStudents.map(s => s.userId);
    filter.studentId = { $in: studentIds };
  }

  // Additional filters
  if (studentId && req.user.role !== 'student') {
    filter.studentId = studentId;
  }
  if (messName) filter.messName = messName;
  if (mealType) filter.mealType = mealType;

  // Date range filter
  if (startDate || endDate) {
    filter.timestamp = {};
    if (startDate) filter.timestamp.$gte = new Date(startDate);
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      filter.timestamp.$lte = endDateTime;
    }
  }

  const messLogs = await MessLog.find(filter)
    .sort({ timestamp: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
    // Note: Removed .populate() since studentId is a string, not ObjectId

  const total = await MessLog.countDocuments(filter);

  res.json({
    success: true,
    data: {
      messLogs,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    }
  });
});

// @desc    Get mess statistics
// @route   GET /api/mess/stats
// @access  Private
const getMessStats = asyncHandler(async (req, res) => {
  const { studentId, period = 'week' } = req.query;

  // Authorization check
  if (req.user.role === 'student' && studentId && studentId !== req.user.userId) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view this data'
    });
  }

  const targetStudentId = studentId || (req.user.role === 'student' ? req.user.userId : null);
  
  // Calculate date range based on period
  let startDate;
  const now = new Date();
  
  switch (period) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  const matchFilter = {
    timestamp: { $gte: startDate }
  };

  if (targetStudentId) {
    matchFilter.studentId = targetStudentId;
  } else if (req.user.role === 'warden') {
    // Warden can see stats for their hostel students
    const hostelStudents = await User.find({
      role: 'student',
      'studentDetails.hostelName': req.user.wardenDetails?.hostelName,
      isActive: true
    }).select('userId');
    
    matchFilter.studentId = { $in: hostelStudents.map(s => s.userId) };
  }

  // Aggregate statistics
  const stats = await MessLog.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: null,
        totalEntries: { $sum: 1 },
        totalSpent: { $sum: '$finalAmount' },
        averageSpent: { $avg: '$finalAmount' }
      }
    }
  ]);

  // Meal type distribution
  const mealTypeStats = await MessLog.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: '$mealType',
        count: { $sum: 1 },
        totalCost: { $sum: '$finalAmount' }
      }
    }
  ]);

  // Daily spending pattern
  const dailyStats = await MessLog.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$timestamp'
          }
        },
        entries: { $sum: 1 },
        spent: { $sum: '$finalAmount' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const result = {
    period,
    summary: stats[0] || {
      totalEntries: 0,
      totalSpent: 0,
      averageSpent: 0
    },
    mealTypeDistribution: mealTypeStats,
    dailyPattern: dailyStats
  };

  res.json({
    success: true,
    data: result
  });
});

// @desc    Get meal recommendations
// @route   GET /api/mess/recommendations
// @access  Private (Student)
const getMealRecommendations = asyncHandler(async (req, res) => {
  const studentId = req.user.userId;
  const currentHour = new Date().getHours();
  
  // Get student's meal history for pattern analysis (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentLogs = await MessLog.find({
    studentId,
    timestamp: { $gte: sevenDaysAgo }
  }).sort({ timestamp: -1 });

  // Analyze meal patterns
  const mealPatterns = {
    breakfast: recentLogs.filter(log => log.mealType === 'breakfast').length,
    lunch: recentLogs.filter(log => log.mealType === 'lunch').length,
    dinner: recentLogs.filter(log => log.mealType === 'dinner').length,
    snacks: recentLogs.filter(log => log.mealType === 'snacks').length
  };

  // Generate recommendations based on time and patterns
  let recommendations = [];

  if (currentHour >= 7 && currentHour <= 10) {
    // Breakfast time
    if (mealPatterns.breakfast < 5) {
      recommendations.push({
        mealType: 'breakfast',
        reason: 'You have missed breakfast several times this week',
        priority: 'high'
      });
    }
  } else if (currentHour >= 12 && currentHour <= 15) {
    // Lunch time
    if (mealPatterns.lunch < 5) {
      recommendations.push({
        mealType: 'lunch',
        reason: 'Regular lunch helps maintain energy levels',
        priority: 'high'
      });
    }
  } else if (currentHour >= 19 && currentHour <= 22) {
    // Dinner time
    recommendations.push({
      mealType: 'dinner',
      reason: 'Time for dinner!',
      priority: 'medium'
    });
  }

  // Budget recommendations
  const totalSpentThisWeek = recentLogs.reduce((sum, log) => sum + (log.finalAmount || log.cost), 0);
  const averageDailySpending = totalSpentThisWeek / 7;

  if (averageDailySpending > 100) {
    recommendations.push({
      type: 'budget',
      message: 'Consider choosing more economical meal options',
      priority: 'low'
    });
  }

  res.json({
    success: true,
    data: {
      currentTime: currentHour,
      weeklyPattern: mealPatterns,
      totalSpentThisWeek: Math.round(totalSpentThisWeek),
      averageDailySpending: Math.round(averageDailySpending),
      recommendations
    }
  });
});

// Helper function to generate transaction ID
const generateTransactionId = () => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substr(2, 5);
  return `MESS_${timestamp}_${randomStr}`.toUpperCase();
};

module.exports = {
  recordMessEntry,
  getMessLogs,
  getMessStats,
  getMealRecommendations
};
