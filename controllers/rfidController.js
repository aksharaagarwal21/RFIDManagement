

const Attendance = require('../models/Attendance');
const Class = require('../models/Class');
const SecurityAlert = require('../models/SecurityAlert');
const Gamification = require('../models/Gamification');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc    Process RFID scan
// @route   POST /api/rfid/scan
// @access  Private (RFID Device)
const processRfidScan = asyncHandler(async (req, res) => {
  const { userId, rfidCardId, location, locationName, action, deviceId } = req.body;
  const io = req.app.get('io');

  // Verify user exists and RFID card matches
  const user = await User.findOne({ userId, rfidCardId, isActive: true });
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Invalid user or RFID card'
    });
  }

  // Create RFID log
  const rfidLog = await RfidLog.create({
    userId,
    rfidCardId,
    location,
    locationName,
    action,
    deviceId,
    timestamp: new Date(),
    isValid: true
  });

  // Process attendance if in classroom
  if (location === 'classroom' && action === 'entry') {
    await processClassroomEntry(user, locationName);
  }

  // Check for security alerts
  await checkSecurityAlerts(user, rfidLog);

  // Update gamification points
  if (user.role === 'student') {
    await updateGamificationPoints(userId, location, action);
  }

  // Emit real-time update via Socket.IO
  const locationUpdate = {
    userId,
    userName: user.name,
    location,
    locationName,
    action,
    timestamp: rfidLog.timestamp,
    userRole: user.role
  };

  // Emit to different dashboard rooms
  io.to('dashboard-warden').emit('location-update', locationUpdate);
  io.to('dashboard-teacher').emit('location-update', locationUpdate);
  
  if (user.role === 'student') {
    io.to(`student-${userId}`).emit('location-update', locationUpdate);
  }

  res.json({
    success: true,
    message: 'RFID scan processed successfully',
    data: {
      rfidLog,
      user: {
        name: user.name,
        role: user.role
      }
    }
  });
});

// @desc    Get RFID logs
// @route   GET /api/rfid/logs
// @access  Private
const getRfidLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, userId, location, action, date } = req.query;
  
  // Build filter
  const filter = {};
  
  if (userId) filter.userId = userId;
  if (location) filter.location = location;
  if (action) filter.action = action;
  
  if (date) {
    const startDate = new Date(date);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);
    
    filter.timestamp = {
      $gte: startDate,
      $lt: endDate
    };
  }

  // Only allow users to see their own logs unless admin/warden
  if (req.user.role === 'student') {
    filter.userId = req.user.userId;
  } else if (req.user.role === 'warden') {
    // Warden can see logs of students in their hostel
    const hostelStudents = await User.find({
      role: 'student',
      'studentDetails.hostelName': req.user.wardenDetails?.hostelName
    }).select('userId');
    
    const studentIds = hostelStudents.map(s => s.userId);
    filter.userId = { $in: studentIds };
  }

  const logs = await RfidLog.find(filter)
    .sort({ timestamp: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate('userId', 'name role');

  const total = await RfidLog.countDocuments(filter);

  res.json({
    success: true,
    data: {
      logs,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    }
  });
});

// @desc    Get user location history
// @route   GET /api/rfid/location-history/:userId
// @access  Private
const getLocationHistory = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { days = 7 } = req.query;

  // Check authorization
  if (req.user.role === 'student' && req.user.userId !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view this data'
    });
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));

  const locationHistory = await RfidLog.find({
    userId,
    timestamp: { $gte: startDate }
  })
    .sort({ timestamp: -1 })
    .select('location locationName action timestamp');

  // Group by date
  const groupedHistory = {};
  locationHistory.forEach(log => {
    const date = log.timestamp.toISOString().split('T')[0];
    if (!groupedHistory[date]) {
      groupedHistory[date] = [];
    }
    groupedHistory[date].push(log);
  });

  res.json({
    success: true,
    data: {
      userId,
      days: parseInt(days),
      history: groupedHistory
    }
  });
});

// Helper function to process classroom entry for attendance
const processClassroomEntry = async (user, locationName) => {
  if (user.role !== 'student') return;

  const currentTime = new Date();
  const currentDay = currentTime.toLocaleDateString('en-US', { weekday: 'long' });
  const currentTimeStr = currentTime.toTimeString().substring(0, 5);
  const today = currentTime.toISOString().split('T')[0];

  // Find classes happening now in this location
  const currentClasses = await Class.find({
    'schedule.classroom': locationName,
    'schedule.day': currentDay,
    enrolledStudents: user.userId,
    isActive: true
  });

  for (const classObj of currentClasses) {
    const todaySchedule = classObj.schedule.find(s => 
      s.day === currentDay && s.classroom === locationName
    );

    if (todaySchedule) {
      const classStartTime = todaySchedule.startTime;
      const classEndTime = todaySchedule.endTime;

      // Check if current time is within class duration (with some buffer)
      if (currentTimeStr >= classStartTime && currentTimeStr <= classEndTime) {
        // Check if attendance already marked
        const existingAttendance = await Attendance.findOne({
          studentId: user.userId,
          classId: classObj.classCode,
          date: today
        });

        if (!existingAttendance) {
          // Calculate if late
          const lateMinutes = calculateLateMinutes(currentTimeStr, classStartTime);
          const status = lateMinutes > 10 ? 'late' : 'present';

          await Attendance.create({
            studentId: user.userId,
            classId: classObj.classCode,
            classCode: classObj.classCode,
            className: classObj.className,
            teacherId: classObj.teacherId,
            date: today,
            timeSlot: `${classStartTime}-${classEndTime}`,
            classroom: locationName,
            status,
            rfidTimestamp: currentTime,
            markedBy: 'rfid',
            lateMinutes,
            notes: lateMinutes > 0 ? `${lateMinutes} minutes late` : 'On time'
          });
        }
      }
    }
  }
};

// Helper function to check security alerts
const checkSecurityAlerts = async (user, rfidLog) => {
  if (user.role !== 'student') return;

  const { location, action, timestamp } = rfidLog;
  const currentHour = new Date(timestamp).getHours();

  // Check for unusual timing (late night exit from campus)
  if (location === 'main_gate' && action === 'exit' && currentHour >= 22) {
    await SecurityAlert.create({
      userId: user.userId,
      userName: user.name,
      alertType: 'unusual_timing',
      severity: 'medium',
      message: `Student left campus late at night (${currentHour}:${new Date(timestamp).getMinutes().toString().padStart(2, '0')})`,
      location,
      timestamp,
      details: {
        action,
        hour: currentHour,
        previousLogs: await RfidLog.find({ userId: user.userId })
          .sort({ timestamp: -1 })
          .limit(3)
      },
      status: 'pending'
    });
  }

  // Check for multiple failed attempts (if implementing access control)
  // This would be expanded based on your specific security requirements
};

// Helper function to update gamification points
const updateGamificationPoints = async (userId, location, action) => {
  const gamification = await Gamification.findOne({ userId });
  
  if (!gamification) return;

  let points = 0;
  let reason = '';

  // Award points based on location and action
  switch (location) {
    case 'classroom':
      if (action === 'entry') {
        points = 5;
        reason = 'Class attendance';
      }
      break;
    case 'library':
      if (action === 'entry') {
        points = 3;
        reason = 'Library visit';
      }
      break;
    case 'mess':
      if (action === 'entry') {
        points = 2;
        reason = 'Mess visit';
      }
      break;
  }

  if (points > 0) {
    await gamification.addPoints(points, reason, location);
  }
};

// Helper function to calculate late minutes
const calculateLateMinutes = (currentTime, classStartTime) => {
  const current = new Date(`2000-01-01 ${currentTime}`);
  const start = new Date(`2000-01-01 ${classStartTime}`);
  
  const diffMs = current - start;
  const diffMinutes = Math.floor(diffMs / 60000);
  
  return diffMinutes > 0 ? diffMinutes : 0;
};

module.exports = {
  processRfidScan,
  getRfidLogs,
  getLocationHistory
};
