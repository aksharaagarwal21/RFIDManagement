const Notification = require('../models/Notification');
const { sendEmail } = require('./emailService');

// Create notification
const createNotification = async (notificationData) => {
  try {
    const notification = await Notification.create(notificationData);
    
    // Emit real-time notification via Socket.IO if available
    const io = global.io;
    if (io) {
      io.to(`user-${notificationData.userId}`).emit('new-notification', notification);
    }
    
    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    throw error;
  }
};

// Create bulk notifications
const createBulkNotifications = async (notifications) => {
  try {
    const createdNotifications = await Notification.insertMany(notifications);
    
    // Emit real-time notifications
    const io = global.io;
    if (io) {
      createdNotifications.forEach(notification => {
        io.to(`user-${notification.userId}`).emit('new-notification', notification);
      });
    }
    
    return createdNotifications;
  } catch (error) {
    console.error('Failed to create bulk notifications:', error);
    throw error;
  }
};

// Send attendance warning notifications
const sendAttendanceWarnings = async () => {
  try {
    const Attendance = require('../models/Attendance');
    const User = require('../models/User');
    
    // Find students with low attendance
    const lowAttendanceStudents = await Attendance.aggregate([
      {
        $group: {
          _id: '$studentId',
          total: { $sum: 1 },
          present: {
            $sum: {
              $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0]
            }
          }
        }
      },
      {
        $addFields: {
          percentage: {
            $multiply: [
              { $divide: ['$present', '$total'] },
              100
            ]
          }
        }
      },
      {
        $match: {
          total: { $gte: 10 }, // At least 10 classes
          percentage: { $lt: 75 } // Less than 75%
        }
      }
    ]);

    const notifications = [];
    
    for (const student of lowAttendanceStudents) {
      const user = await User.findOne({ userId: student._id });
      if (user) {
        notifications.push({
          userId: student._id,
          title: 'Low Attendance Warning',
          message: `Your overall attendance is ${Math.round(student.percentage)}%. Please attend classes regularly to maintain the minimum required 75% attendance.`,
          type: 'warning',
          category: 'attendance',
          data: {
            attendancePercentage: Math.round(student.percentage),
            totalClasses: student.total,
            presentClasses: student.present
          }
        });
      }
    }

    if (notifications.length > 0) {
      await createBulkNotifications(notifications);
      console.log(`Sent ${notifications.length} attendance warning notifications`);
    }

    return notifications.length;
  } catch (error) {
    console.error('Failed to send attendance warnings:', error);
    throw error;
  }
};

// Send exam reminders
const sendExamReminders = async () => {
  try {
    const Exam = require('../models/Exam');
    const User = require('../models/User');
    
    // Find exams in next 24 hours
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const upcomingExams = await Exam.find({
      examDate: {
        $gte: new Date(),
        $lte: tomorrow
      },
      isActive: true
    });

    const notifications = [];
    
    for (const exam of upcomingExams) {
      for (const studentId of exam.enrolledStudents) {
        notifications.push({
          userId: studentId,
          title: 'Exam Reminder',
          message: `${exam.examName} is scheduled for tomorrow at ${exam.examDate.toLocaleTimeString()}`,
          type: 'info',
          category: 'exam',
          data: {
            examId: exam._id,
            examName: exam.examName,
            examDate: exam.examDate,
            examHall: exam.examHall
          }
        });
      }
    }

    if (notifications.length > 0) {
      await createBulkNotifications(notifications);
      console.log(`Sent ${notifications.length} exam reminder notifications`);
    }

    return notifications.length;
  } catch (error) {
    console.error('Failed to send exam reminders:', error);
    throw error;
  }
};

// Clean up old notifications
const cleanupOldNotifications = async (daysOld = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await Notification.deleteMany({
      createdAt: { $lt: cutoffDate },
      isRead: true
    });

    console.log(`Cleaned up ${result.deletedCount} old notifications`);
    return result.deletedCount;
  } catch (error) {
    console.error('Failed to cleanup old notifications:', error);
    throw error;
  }
};

module.exports = {
  createNotification,
  createBulkNotifications,
  sendAttendanceWarnings,
  sendExamReminders,
  cleanupOldNotifications
};
