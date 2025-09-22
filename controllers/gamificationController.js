const Gamification = require('../models/Gamification');
const Attendance = require('../models/Attendance');
const MessLog = require('../models/MessLog');
const { GAMIFICATION } = require('../config/constants');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc    Get user gamification data
// @route   GET /api/gamification/profile
// @access  Private (Student)
const getGamificationProfile = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  
  let gamificationData = await Gamification.findOne({ userId });
  
  if (!gamificationData) {
    // Create initial gamification profile
    gamificationData = await Gamification.create({
      userId,
      totalPoints: 50, // Welcome bonus
      level: 1,
      badges: [{
        badgeName: 'Welcome',
        description: 'Welcome to RFID University!',
        icon: '👋',
        points: 50
      }]
    });
  }

  // Calculate recent achievements
  const recentAchievements = await calculateRecentAchievements(userId);
  
  res.json({
    success: true,
    data: {
      gamificationData,
      recentAchievements,
      pointsToNextLevel: getPointsToNextLevel(gamificationData.level, gamificationData.totalPoints)
    }
  });
});

// @desc    Get leaderboard
// @route   GET /api/gamification/leaderboard
// @access  Private
const getLeaderboard = asyncHandler(async (req, res) => {
  const { type = 'overall', limit = 50 } = req.query;
  
  let filter = {};
  
  if (type === 'department' && req.user.role === 'student') {
    // Get students from same department
    const department = req.user.studentDetails?.department;
    const departmentStudents = await User.find({
      role: 'student',
      'studentDetails.department': department,
      isActive: true
    }).select('userId');
    
    filter.userId = { $in: departmentStudents.map(s => s.userId) };
  } else if (type === 'year' && req.user.role === 'student') {
    // Get students from same year
    const year = req.user.studentDetails?.year;
    const yearStudents = await User.find({
      role: 'student',
      'studentDetails.year': year,
      isActive: true
    }).select('userId');
    
    filter.userId = { $in: yearStudents.map(s => s.userId) };
  }

  const leaderboard = await Gamification.find(filter)
    .sort({ totalPoints: -1, level: -1 })
    .limit(parseInt(limit))
    .populate('userId', 'name profileImage studentDetails.department studentDetails.year');

  // Add rank to each entry
  const rankedLeaderboard = leaderboard.map((entry, index) => ({
    rank: index + 1,
    userId: entry.userId,
    userName: entry.userId?.name || 'Unknown',
    profileImage: entry.userId?.profileImage,
    department: entry.userId?.studentDetails?.department,
    year: entry.userId?.studentDetails?.year,
    totalPoints: entry.totalPoints,
    level: entry.level,
    badgeCount: entry.badges.length
  }));

  // Find current user's position
  let userRank = null;
  if (req.user.role === 'student') {
    const userGamification = await Gamification.findOne({ userId: req.user.userId });
    if (userGamification) {
      const betterUsers = await Gamification.countDocuments({
        ...filter,
        totalPoints: { $gt: userGamification.totalPoints }
      });
      userRank = betterUsers + 1;
    }
  }

  res.json({
    success: true,
    data: {
      type,
      leaderboard: rankedLeaderboard,
      userRank,
      totalUsers: await Gamification.countDocuments(filter)
    }
  });
});

// @desc    Get available badges
// @route   GET /api/gamification/badges
// @access  Private
const getAvailableBadges = asyncHandler(async (req, res) => {
  const allBadges = Object.values(GAMIFICATION.BADGES);
  
  if (req.user.role === 'student') {
    const userGamification = await Gamification.findOne({ userId: req.user.userId });
    const earnedBadges = userGamification?.badges.map(b => b.badgeName) || [];
    
    const badgesWithStatus = allBadges.map(badge => ({
      ...badge,
      earned: earnedBadges.includes(badge.name),
      progress: badge.name === 'Perfect Attendance' ? 
        calculateAttendanceProgress(req.user.userId) : null
    }));

    return res.json({
      success: true,
      data: { badges: badgesWithStatus }
    });
  }

  res.json({
    success: true,
    data: { badges: allBadges }
  });
});

// @desc    Check and award badges
// @route   POST /api/gamification/check-badges
// @access  Private (Student)
const checkAndAwardBadges = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  
  const gamification = await Gamification.findOne({ userId });
  if (!gamification) {
    return res.status(404).json({
      success: false,
      message: 'Gamification profile not found'
    });
  }

  const newBadges = [];

  // Check for Perfect Attendance badge
  const attendanceStats = await checkPerfectAttendance(userId);
  if (attendanceStats.isPerfect && !gamification.badges.some(b => b.badgeName === 'Perfect Attendance')) {
    const badge = {
      ...GAMIFICATION.BADGES.PERFECT_ATTENDANCE,
      badgeName: GAMIFICATION.BADGES.PERFECT_ATTENDANCE.name,
      earnedAt: new Date()
    };
    gamification.badges.push(badge);
    gamification.totalPoints += badge.points;
    newBadges.push(badge);
  }

  // Check for Early Bird badge
  const earlyBirdStats = await checkEarlyBird(userId);
  if (earlyBirdStats.count >= 5 && !gamification.badges.some(b => b.badgeName === 'Early Bird')) {
    const badge = {
      ...GAMIFICATION.BADGES.EARLY_BIRD,
      badgeName: GAMIFICATION.BADGES.EARLY_BIRD.name,
      earnedAt: new Date()
    };
    gamification.badges.push(badge);
    gamification.totalPoints += badge.points;
    newBadges.push(badge);
  }

  // Check for Library Champion badge
  const libraryStats = await checkLibraryChampion(userId);
  if (libraryStats.hoursThisWeek >= 20 && !gamification.badges.some(b => b.badgeName === 'Library Champion')) {
    const badge = {
      ...GAMIFICATION.BADGES.LIBRARY_CHAMPION,
      badgeName: GAMIFICATION.BADGES.LIBRARY_CHAMPION.name,
      earnedAt: new Date()
    };
    gamification.badges.push(badge);
    gamification.totalPoints += badge.points;
    newBadges.push(badge);
  }

  // Check for Mess Regular badge
  const messStats = await checkMessRegular(userId);
  if (messStats.regularThisWeek && !gamification.badges.some(b => b.badgeName === 'Mess Regular')) {
    const badge = {
      ...GAMIFICATION.BADGES.MESS_REGULAR,
      badgeName: GAMIFICATION.BADGES.MESS_REGULAR.name,
      earnedAt: new Date()
    };
    gamification.badges.push(badge);
    gamification.totalPoints += badge.points;
    newBadges.push(badge);
  }

  // Update level based on new points
  await gamification.updateLevel();

  res.json({
    success: true,
    message: newBadges.length > 0 ? `Congratulations! You earned ${newBadges.length} new badge(s)!` : 'No new badges at this time',
    data: {
      newBadges,
      updatedProfile: gamification
    }
  });
});

// @desc    Get points history
// @route   GET /api/gamification/points-history
// @access  Private (Student)
const getPointsHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const userId = req.user.userId;

  const gamification = await Gamification.findOne({ userId });
  
  if (!gamification) {
    return res.status(404).json({
      success: false,
      message: 'Gamification profile not found'
    });
  }

  const history = gamification.pointsHistory
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice((page - 1) * limit, page * limit);

  const total = gamification.pointsHistory.length;

  res.json({
    success: true,
    data: {
      history,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    }
  });
});

// Helper functions
const calculateRecentAchievements = async (userId) => {
  const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  // Get recent attendance
  const recentAttendance = await Attendance.find({
    studentId: userId,
    createdAt: { $gte: last7Days }
  });

  // Get recent RFID logs
  const recentLogs = await RfidLog.find({
    userId,
    timestamp: { $gte: last7Days }
  });

  return {
    classesAttended: recentAttendance.filter(a => a.status === 'present').length,
    locationsVisited: [...new Set(recentLogs.map(log => log.location))].length,
    totalActivities: recentLogs.length
  };
};

const getPointsToNextLevel = (currentLevel, currentPoints) => {
  const pointsRequired = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500];
  
  if (currentLevel >= pointsRequired.length) {
    return 0; // Max level reached
  }
  
  return pointsRequired[currentLevel] - currentPoints;
};

const checkPerfectAttendance = async (userId) => {
  const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  const attendance = await Attendance.find({
    studentId: userId,
    createdAt: { $gte: last7Days }
  });

  const totalClasses = attendance.length;
  const presentClasses = attendance.filter(a => a.status === 'present' || a.status === 'late').length;

  return {
    isPerfect: totalClasses > 0 && totalClasses === presentClasses,
    attendance: presentClasses,
    total: totalClasses
  };
};

const checkEarlyBird = async (userId) => {
  const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  // Count classroom entries that were early (before class start time)
  const classroomLogs = await RfidLog.find({
    userId,
    location: 'classroom',
    action: 'entry',
    timestamp: { $gte: last7Days }
  });

  // This would need more complex logic to determine if entry was "early"
  // For now, we'll count all classroom entries
  return {
    count: classroomLogs.length
  };
};

const checkLibraryChampion = async (userId) => {
  const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  const libraryLogs = await RfidLog.find({
    userId,
    location: 'library',
    timestamp: { $gte: last7Days }
  }).sort({ timestamp: 1 });

  // Calculate time spent (simple estimation)
  let totalMinutes = 0;
  for (let i = 0; i < libraryLogs.length - 1; i += 2) {
    if (libraryLogs[i].action === 'entry' && libraryLogs[i + 1]?.action === 'exit') {
      const diff = new Date(libraryLogs[i + 1].timestamp) - new Date(libraryLogs[i].timestamp);
      totalMinutes += Math.floor(diff / 60000);
    }
  }

  return {
    hoursThisWeek: Math.floor(totalMinutes / 60)
  };
};

const checkMessRegular = async (userId) => {
  const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  const messLogs = await MessLog.find({
    studentId: userId,
    timestamp: { $gte: last7Days }
  });

  // Check if student had meals on most days of the week
  const daysWithMeals = [...new Set(messLogs.map(log => 
    log.timestamp.toISOString().split('T')[0]
  ))].length;

  return {
    regularThisWeek: daysWithMeals >= 5,
    daysWithMeals
  };
};

module.exports = {
  getGamificationProfile,
  getLeaderboard,
  getAvailableBadges,
  checkAndAwardBadges,
  getPointsHistory
};
