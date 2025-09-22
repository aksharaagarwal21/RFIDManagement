const mongoose = require('mongoose');
const { EXAM_TYPES } = require('../config/constants');

const examSchema = new mongoose.Schema({
  examName: {
    type: String,
    required: [true, 'Exam name is required'],
    trim: true
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
  teacherId: {
    type: String,
    required: [true, 'Teacher ID is required'],
    ref: 'User'
  },
  examType: {
    type: String,
    required: [true, 'Exam type is required'],
    enum: Object.values(EXAM_TYPES)
  },
  examDate: {
    type: Date,
    required: [true, 'Exam date is required']
  },
  duration: {
    type: Number,
    required: [true, 'Exam duration is required'],
    min: 15,
    max: 300
  },
  totalMarks: {
    type: Number,
    required: [true, 'Total marks is required'],
    min: 1,
    max: 200
  },
  examHall: {
    type: String,
    required: [true, 'Exam hall is required']
  },
  instructions: {
    type: String,
    maxlength: 2000
  },
  enrolledStudents: [{
    type: String,
    ref: 'User'
  }],
  results: [{
    studentId: {
      type: String,
      ref: 'User'
    },
    marks: {
      type: Number,
      min: 0
    },
    grade: String,
    percentage: Number,
    submittedAt: Date,
    evaluatedBy: {
      type: String,
      ref: 'User'
    },
    evaluatedAt: Date,
    remarks: String
  }],
  isPublished: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
examSchema.index({ classId: 1 });
examSchema.index({ examDate: -1 });
examSchema.index({ examType: 1 });
examSchema.index({ teacherId: 1 });

module.exports = mongoose.model('Exam', examSchema);
