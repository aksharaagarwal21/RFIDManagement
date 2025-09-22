const mongoose = require('mongoose');
const { DEPARTMENTS, CLASSROOMS } = require('../config/constants');

const classSchema = new mongoose.Schema({
  classCode: {
    type: String,
    required: [true, 'Class code is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  className: {
    type: String,
    required: [true, 'Class name is required'],
    trim: true
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    enum: DEPARTMENTS
  },
  year: {
    type: Number,
    required: [true, 'Year is required'],
    min: 1,
    max: 4
  },
  semester: {
    type: Number,
    required: [true, 'Semester is required'],
    min: 1,
    max: 8
  },
  teacherId: {
    type: String,
    required: [true, 'Teacher ID is required'],
    ref: 'User'
  },
  teacherName: {
    type: String,
    required: [true, 'Teacher name is required']
  },
  credits: {
    type: Number,
    required: [true, 'Credits are required'],
    min: 1,
    max: 6
  },
  schedule: [{
    day: {
      type: String,
      required: true,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    },
    startTime: {
      type: String,
      required: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter time in HH:MM format']
    },
    endTime: {
      type: String,
      required: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter time in HH:MM format']
    },
    classroom: {
      type: String,
      required: true,
      enum: CLASSROOMS
    }
  }],
  enrolledStudents: [{
    type: String,
    ref: 'User'
  }],
  maxCapacity: {
    type: Number,
    default: 60
  },
  description: {
    type: String,
    maxlength: 1000
  },
  syllabus: [{
    topic: String,
    week: Number,
    completed: {
      type: Boolean,
      default: false
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
classSchema.index({ classCode: 1 });
classSchema.index({ teacherId: 1 });
classSchema.index({ department: 1 });
classSchema.index({ year: 1, semester: 1 });

module.exports = mongoose.model('Class', classSchema);
