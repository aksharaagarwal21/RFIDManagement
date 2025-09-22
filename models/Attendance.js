const mongoose = require('mongoose');
const { ATTENDANCE_STATUS } = require('../config/constants');

const attendanceSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: [true, 'Student ID is required'],
    ref: 'User'
  },
  classId: {
    type: String,
    required: [true, 'Class ID is required'],
    ref: 'Class'
  },
  classCode: {
    type: String,
    required: [true, 'Class code is required']
  },
  className: {
    type: String,
    required: [true, 'Class name is required']
  },
  teacherId: {
    type: String,
    required: [true, 'Teacher ID is required'],
    ref: 'User'
  },
  date: {
    type: String,
    required: [true, 'Date is required'],
    match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format']
  },
  timeSlot: {
    type: String,
    required: [true, 'Time slot is required']
  },
  classroom: {
    type: String,
    required: [true, 'Classroom is required']
  },
  status: {
    type: String,
    required: [true, 'Attendance status is required'],
    enum: Object.values(ATTENDANCE_STATUS),
    default: ATTENDANCE_STATUS.ABSENT
  },
  rfidTimestamp: {
    type: Date
  },
  markedBy: {
    type: String,
    required: [true, 'Marked by is required'],
    enum: ['rfid', 'manual', 'teacher'],
    default: 'rfid'
  },
  lateMinutes: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Compound indexes
attendanceSchema.index({ studentId: 1, date: -1 });
attendanceSchema.index({ classId: 1, date: -1 });
attendanceSchema.index({ studentId: 1, classId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ status: 1 });

// Calculate attendance percentage
attendanceSchema.statics.getAttendanceStats = async function(studentId, classId) {
  const stats = await this.aggregate([
    {
      $match: { 
        studentId: studentId,
        ...(classId && { classId: classId })
      }
    },
    {
      $group: {
        _id: classId ? '$classId' : null,
        total: { $sum: 1 },
        present: {
          $sum: {
            $cond: [{ $eq: ['$status', 'present'] }, 1, 0]
          }
        },
        late: {
          $sum: {
            $cond: [{ $eq: ['$status', 'late'] }, 1, 0]
          }
        },
        absent: {
          $sum: {
            $cond: [{ $eq: ['$status', 'absent'] }, 1, 0]
          }
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
  ]);

  return stats[0] || { total: 0, present: 0, late: 0, absent: 0, percentage: 0 };
};

module.exports = mongoose.model('Attendance', attendanceSchema);
