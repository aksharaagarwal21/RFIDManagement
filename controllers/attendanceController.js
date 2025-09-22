const Attendance = require('../models/Attendance');
const Class = require('../models/Class');

const { asyncHandler } = require('../middleware/errorHandler');

// @desc    Mark attendance manually
// @route   POST /api/attendance/mark
// @access  Private (Teacher)
const markAttendance = asyncHandler(async (req, res) => {
  const { studentId, classId, status, date, notes } = req.body;

  // Verify teacher teaches this class
  const classObj = await Class.findOne({ classCode: classId, teacherId: req.user.userId });
  
  if (!classObj) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to mark attendance for this class'
    });
  }

  // Check if student is enrolled in this class
  if (!classObj.enrolledStudents.includes(studentId)) {
    return res.status(400).json({
      success: false,
      message: 'Student is not enrolled in this class'
    });
  }

  // Check if attendance already marked
  const existingAttendance = await Attendance.findOne({
    studentId,
    classId,
    date
  });

  if (existingAttendance) {
    // Update existing attendance
    existingAttendance.status = status;
    existingAttendance.notes = notes || existingAttendance.notes;
    existingAttendance.markedBy = 'teacher';
    existingAttendance.updatedAt = new Date();
    
    await existingAttendance.save();

    return res.json({
      success: true,
      message: 'Attendance updated successfully',
      data: { attendance: existingAttendance }
    });
  }

  // Create new attendance record
  const attendance = await Attendance.create({
    studentId,
    classId,
    classCode: classObj.classCode,
    className: classObj.className,
    teacherId: req.user.userId,
    date,
    timeSlot: getCurrentTimeSlot(classObj),
    classroom: getCurrentClassroom(classObj),
    status,
    markedBy: 'teacher',
    notes
  });

  res.status(201).json({
    success: true,
    message: 'Attendance marked successfully',
    data: { attendance }
  });
});

// @desc    Get attendance records
// @route   GET /api/attendance
// @access  Private
const getAttendance = asyncHandler(async (req, res) => {
  const { studentId, classId, date, page = 1, limit = 20 } = req.query;
  
  // Build filter based on user role
  let filter = {};
  
  if (req.user.role === 'student') {
    filter.studentId = req.user.userId;
  } else if (req.user.role === 'teacher') {
    filter.teacherId = req.user.userId;
  }

  // Apply additional filters
  if (studentId && req.user.role !== 'student') {
    filter.studentId = studentId;
  }
  if (classId) filter.classId = classId;
  if (date) filter.date = date;

  const attendance = await Attendance.find(filter)
    .sort({ date: -1, createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate('studentId', 'name userId');

  const total = await Attendance.countDocuments(filter);

  res.json({
    success: true,
    data: {
      attendance,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    }
  });
});

// @desc    Get attendance statistics
// @route   GET /api/attendance/stats
// @access  Private
const getAttendanceStats = asyncHandler(async (req, res) => {
  const { studentId, classId } = req.query;
  
  // Authorization check
  if (req.user.role === 'student' && studentId && studentId !== req.user.userId) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view this data'
    });
  }

  const targetStudentId = studentId || (req.user.role === 'student' ? req.user.userId : null);
  
  if (!targetStudentId && !classId) {
    return res.status(400).json({
      success: false,
      message: 'Either studentId or classId is required'
    });
  }

  let stats;

  if (targetStudentId && classId) {
    // Get stats for specific student in specific class
    stats = await Attendance.getAttendanceStats(targetStudentId, classId);
  } else if (targetStudentId) {
    // Get overall stats for student across all classes
    const pipeline = [
      { $match: { studentId: targetStudentId } },
      {
        $group: {
          _id: '$classId',
          className: { $first: '$className' },
          classCode: { $first: '$classCode' },
          total: { $sum: 1 },
          present: {
            $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
          },
          late: {
            $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] }
          },
          absent: {
            $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] }
          }
        }
      },
      {
        $addFields: {
          percentage: {
            $multiply: [
              { $divide: [{ $add: ['$present', '$late'] }, '$total'] },
              100
            ]
          }
        }
      }
    ];

    stats = await Attendance.aggregate(pipeline);
  } else if (classId && req.user.role === 'teacher') {
    // Get stats for all students in teacher's class
    const pipeline = [
      { $match: { classId: classId, teacherId: req.user.userId } },
      {
        $group: {
          _id: '$studentId',
          studentName: { $first: '$studentId' }, // Will be populated later
          total: { $sum: 1 },
          present: {
            $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
          },
          late: {
            $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] }
          },
          absent: {
            $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] }
          }
        }
      },
      {
        $addFields: {
          percentage: {
            $multiply: [
              { $divide: [{ $add: ['$present', '$late'] }, '$total'] },
              100
            ]
          }
        }
      }
    ];

    const results = await Attendance.aggregate(pipeline);
    
    // Get student names
    const studentIds = results.map(r => r._id);
    const students = await User.find({ userId: { $in: studentIds } })
      .select('userId name');
    
    stats = results.map(result => ({
      ...result,
      studentName: students.find(s => s.userId === result._id)?.name || 'Unknown'
    }));
  }

  res.json({
    success: true,
    data: { stats }
  });
});

// @desc    Get attendance report
// @route   GET /api/attendance/report
// @access  Private (Teacher, Admin)
const getAttendanceReport = asyncHandler(async (req, res) => {
  const { classId, startDate, endDate, format = 'json' } = req.query;

  // Verify teacher teaches this class
  if (req.user.role === 'teacher') {
    const classObj = await Class.findOne({ classCode: classId, teacherId: req.user.userId });
    if (!classObj) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to generate report for this class'
      });
    }
  }

  const dateFilter = {};
  if (startDate) dateFilter.$gte = startDate;
  if (endDate) dateFilter.$lte = endDate;

  const pipeline = [
    {
      $match: {
        classId: classId,
        ...(Object.keys(dateFilter).length && { date: dateFilter })
      }
    },
    {
      $group: {
        _id: {
          date: '$date',
          studentId: '$studentId'
        },
        status: { $first: '$status' },
        className: { $first: '$className' },
        timeSlot: { $first: '$timeSlot' }
      }
    },
    {
      $group: {
        _id: '$_id.date',
        className: { $first: '$className' },
        timeSlot: { $first: '$timeSlot' },
        attendance: {
          $push: {
            studentId: '$_id.studentId',
            status: '$status'
          }
        }
      }
    },
    { $sort: { _id: -1 } }
  ];

  const report = await Attendance.aggregate(pipeline);

  // Get all unique students
  const allStudentIds = [...new Set(report.flatMap(r => r.attendance.map(a => a.studentId)))];
  const students = await User.find({ userId: { $in: allStudentIds } })
    .select('userId name');

  // Format report
  const formattedReport = report.map(day => ({
    date: day._id,
    className: day.className,
    timeSlot: day.timeSlot,
    attendance: day.attendance.map(att => ({
      studentId: att.studentId,
      studentName: students.find(s => s.userId === att.studentId)?.name || 'Unknown',
      status: att.status
    }))
  }));

  res.json({
    success: true,
    data: {
      classId,
      reportPeriod: { startDate, endDate },
      totalDays: report.length,
      report: formattedReport
    }
  });
});

// Helper functions
const getCurrentTimeSlot = (classObj) => {
  const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const schedule = classObj.schedule.find(s => s.day === currentDay);
  return schedule ? `${schedule.startTime}-${schedule.endTime}` : 'Unknown';
};

const getCurrentClassroom = (classObj) => {
  const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const schedule = classObj.schedule.find(s => s.day === currentDay);
  return schedule ? schedule.classroom : 'Unknown';
};

module.exports = {
  markAttendance,
  getAttendance,
  getAttendanceStats,
  getAttendanceReport
};
