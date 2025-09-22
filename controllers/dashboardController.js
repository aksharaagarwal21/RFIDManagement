
const Attendance = require('../models/Attendance');
const Class = require('../models/Class');
const Exam = require('../models/Exam');
const MessLog = require('../models/MessLog');
const Gamification = require('../models/Gamification');
const SecurityAlert = require('../models/SecurityAlert');
const Notification = require('../models/Notification');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc    Get student dashboard data
// @route   GET /api/dashboard/student
// @access  Private (Student)
const getStudentDashboard = asyncHandler(async (req, res) => {
  const studentId = req.user.userId;
  const today = new Date();
  const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);

  // Get overall attendance stats
  const attendanceStats = await Attendance.getAttendanceStats(studentId);
  
  // Get current location (latest RFID log)
  const currentLocation = await RfidLog.findOne({ userId: studentId })
    .sort({ timestamp: -1 })
    .limit(1);

  // Get recent activity (last 10 RFID logs)
  const recentActivity = await RfidLog.find({ userId: studentId })
    .sort({ timestamp: -1 })
    .limit(10)
    .select('action locationName timestamp');

  // Get upcoming exams
  const upcomingExams = await Exam.find({
    enrolledStudents: studentId,
    examDate: { $gte: new Date() },
    isActive: true
  })
    .sort({ examDate: 1 })
    .limit(5)
    .select('examName classCode examDate examHall examType');

  // Get mess logs for this week
  const messLogs = await MessLog.find({
    studentId: studentId,
    timestamp: { $gte: startOfWeek, $lte: endOfWeek }
  })
    .sort({ timestamp: -1 })
    .select('mealType timestamp cost messName items');

  // Get gamification data
  const gamificationData = await Gamification.findOne({ userId: studentId });

  // Get unread notifications
  const notifications = await Notification.find({
    userId: studentId,
    isRead: false
  })
    .sort({ createdAt: -1 })
    .limit(5);

  // Calculate attendance streak
  const attendanceStreak = await calculateAttendanceStreak(studentId);

  res.json({
    success: true,
    data: {
      user: {
        name: req.user.name,
        userId: req.user.userId,
        department: req.user.studentDetails?.department,
        year: req.user.studentDetails?.year,
        semester: req.user.studentDetails?.semester
      },
      stats: {
        attendancePercentage: Math.round(attendanceStats.percentage || 0),
        totalClasses: attendanceStats.total || 0,
        presentClasses: (attendanceStats.present || 0) + (attendanceStats.late || 0),
        currentStreak: attendanceStreak,
        totalPoints: gamificationData?.totalPoints || 0
      },
      currentLocation,
      recentActivity,
      upcomingExams,
      messLogs,
      badges: gamificationData?.badges || [],
      leaderboard: {
        rank: gamificationData?.rank?.overall || 0,
        level: gamificationData?.level || 1
      },
      notifications: notifications.length
    }
  });
});

// @desc    Get teacher dashboard data
// @route   GET /api/dashboard/teacher
// @access  Private (Teacher)
const getTeacherDashboard = asyncHandler(async (req, res) => {
  const teacherId = req.user.userId;
  const today = new Date().toISOString().split('T')[0];

  // Get classes taught by this teacher
  const classes = await Class.find({ teacherId: teacherId, isActive: true });
  const classIds = classes.map(c => c.classCode);

  // Get today's schedule
  const todayDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todaySchedule = [];
  
  classes.forEach(cls => {
    cls.schedule.forEach(schedule => {
      if (schedule.day === todayDay) {
        todaySchedule.push({
          time: schedule.startTime,
          subject: cls.className,
          classroom: schedule.classroom,
          enrolled: cls.enrolledStudents.length,
          classCode: cls.classCode
        });
      }
    });
  });

  // Sort by time
  todaySchedule.sort((a, b) => a.time.localeCompare(b.time));

  // Get attendance statistics for all classes
  const attendanceStats = await Promise.all(
    classIds.map(async (classId) => {
      const stats = await Attendance.aggregate([
        { $match: { classId: classId } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            present: {
              $sum: {
                $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0]
              }
            }
          }
        }
      ]);

      const classInfo = classes.find(c => c.classCode === classId);
      return {
        subject: classInfo?.className || classId,
        attendance: stats.length > 0 ? Math.round((stats[0].present / stats[0].total) * 100) : 0
      };
    })
  );

  // Get total student count
  const totalStudents = [...new Set(classes.flatMap(c => c.enrolledStudents))].length;

  // Get recent activities (attendance markings, exam creations, etc.)
  const recentActivities = await Attendance.find({
    classId: { $in: classIds },
    markedBy: 'teacher'
  })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('studentId', 'name');

  res.json({
    success: true,
    data: {
      user: {
        name: req.user.name,
        employeeId: req.user.teacherDetails?.employeeId,
        department: req.user.teacherDetails?.department
      },
      stats: {
        totalClasses: classes.length,
        todayClasses: todaySchedule.length,
        totalStudents: totalStudents,
        averageAttendance: Math.round(
          attendanceStats.reduce((acc, stat) => acc + stat.attendance, 0) / 
          (attendanceStats.length || 1)
        )
      },
      todaySchedule,
      classPerformance: attendanceStats,
      recentActivities: recentActivities.map(activity => ({
        action: 'Marked Attendance',
        subject: activity.className,
        timestamp: activity.createdAt
      }))
    }
  });
});

// @desc    Get warden dashboard data
// @route   GET /api/dashboard/warden
// @access  Private (Warden)
const getWardenDashboard = asyncHandler(async (req, res) => {
  const wardenDetails = req.user.wardenDetails;
  const today = new Date().toISOString().split('T')[0];

  // Get students in warden's hostel
  const hostelStudents = await User.find({
    role: 'student',
    'studentDetails.hostelName': wardenDetails?.hostelName,
    isActive: true
  }).select('userId name studentDetails.roomNumber');

  const studentIds = hostelStudents.map(s => s.userId);

  // Get students currently on campus (latest entry without exit)
  const onCampusLogs = await RfidLog.aggregate([
    {
      $match: {
        userId: { $in: studentIds },
        location: 'main_gate'
      }
    },
    {
      $sort: { userId: 1, timestamp: -1 }
    },
    {
      $group: {
        _id: '$userId',
        lastAction: { $first: '$action' },
        lastTimestamp: { $first: '$timestamp' }
      }
    }
  ]);

  const studentsOnCampus = onCampusLogs.filter(log => log.lastAction === 'entry').length;
  const studentsOutside = studentIds.length - studentsOnCampus;

  // Get today's entries count
  const todayEntries = await RfidLog.countDocuments({
    userId: { $in: studentIds },
    location: 'main_gate',
    action: 'entry',
    timestamp: {
      $gte: new Date(today),
      $lt: new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000)
    }
  });

  // Get active security alerts
  const activeAlerts = await SecurityAlert.find({
    userId: { $in: studentIds },
    status: 'pending'
  }).sort({ timestamp: -1 });

  // Get recent location updates
  const recentLocationUpdates = await RfidLog.find({
    userId: { $in: studentIds }
  })
    .sort({ timestamp: -1 })
    .limit(20)
    .populate('userId', 'name');

  res.json({
    success: true,
    data: {
      user: {
        name: req.user.name,
        employeeId: wardenDetails?.employeeId,
        hostelName: wardenDetails?.hostelName
      },
      stats: {
        studentsOnCampus,
        studentsOutside,
        totalEntriesToday: todayEntries,
        activeAlerts: activeAlerts.length
      },
      alerts: activeAlerts.slice(0, 5),
      recentLocationUpdates: recentLocationUpdates.map(log => ({
        userId: log.userId,
        userName: hostelStudents.find(s => s.userId === log.userId)?.name || 'Unknown',
        location: log.location,
        locationName: log.locationName,
        action: log.action,
        timestamp: log.timestamp
      }))
    }
  });
});

// Helper function to calculate attendance streak
const calculateAttendanceStreak = async (studentId) => {
  const attendanceRecords = await Attendance.find({ studentId })
    .sort({ date: -1 })
    .limit(30)
    .select('status date');

  let streak = 0;
  for (const record of attendanceRecords) {
    if (record.status === 'present' || record.status === 'late') {
      streak++;
    } else {
      break;
    }
  }

  return streak;
};

module.exports = {
  getStudentDashboard,
  getTeacherDashboard,
  getWardenDashboard
};

