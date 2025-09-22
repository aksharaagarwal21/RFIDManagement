const Exam = require('../models/Exam');
const Class = require('../models/Class');
const Notification = require('../models/Notification');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc    Create new exam
// @route   POST /api/exam
// @access  Private (Teacher)
const createExam = asyncHandler(async (req, res) => {
  const {
    examName,
    classId,
    examType,
    examDate,
    duration,
    totalMarks,
    examHall,
    instructions
  } = req.body;

  // Verify teacher teaches this class
  const classObj = await Class.findOne({ classCode: classId, teacherId: req.user.userId });
  
  if (!classObj) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to create exam for this class'
    });
  }

  const exam = await Exam.create({
    examName,
    classId,
    classCode: classObj.classCode,
    teacherId: req.user.userId,
    examType,
    examDate,
    duration,
    totalMarks,
    examHall,
    instructions,
    enrolledStudents: classObj.enrolledStudents
  });

  // Send notifications to all enrolled students
  const notifications = classObj.enrolledStudents.map(studentId => ({
    userId: studentId,
    title: `New ${examType.charAt(0).toUpperCase() + examType.slice(1)} Scheduled`,
    message: `${examName} has been scheduled for ${new Date(examDate).toLocaleDateString()}`,
    type: 'info',
    category: 'exam',
    data: {
      examId: exam._id,
      examDate,
      examHall
    }
  }));

  await Notification.insertMany(notifications);

  res.status(201).json({
    success: true,
    message: 'Exam created successfully',
    data: { exam }
  });
});

// @desc    Get exams
// @route   GET /api/exam
// @access  Private
const getExams = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, classId, examType, upcoming } = req.query;
  
  let filter = {};

  // Role-based filtering
  if (req.user.role === 'student') {
    filter.enrolledStudents = req.user.userId;
  } else if (req.user.role === 'teacher') {
    filter.teacherId = req.user.userId;
  }

  // Additional filters
  if (classId) filter.classId = classId;
  if (examType) filter.examType = examType;
  if (upcoming === 'true') {
    filter.examDate = { $gte: new Date() };
  }
  filter.isActive = true;

  const exams = await Exam.find(filter)
    .sort({ examDate: upcoming === 'true' ? 1 : -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .select('-results'); // Exclude results from general listing

  const total = await Exam.countDocuments(filter);

  res.json({
    success: true,
    data: {
      exams,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    }
  });
});

// @desc    Get exam details
// @route   GET /api/exam/:id
// @access  Private
const getExamById = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id);

  if (!exam) {
    return res.status(404).json({
      success: false,
      message: 'Exam not found'
    });
  }

  // Check authorization
  if (req.user.role === 'student') {
    if (!exam.enrolledStudents.includes(req.user.userId)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this exam'
      });
    }
    
    // Students can only see their own results
    const studentResult = exam.results.find(r => r.studentId === req.user.userId);
    const examData = exam.toObject();
    examData.results = studentResult ? [studentResult] : [];
    
    return res.json({
      success: true,
      data: { exam: examData }
    });
  } else if (req.user.role === 'teacher') {
    if (exam.teacherId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this exam'
      });
    }
  }

  res.json({
    success: true,
    data: { exam }
  });
});

// @desc    Update exam
// @route   PUT /api/exam/:id
// @access  Private (Teacher)
const updateExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id);

  if (!exam) {
    return res.status(404).json({
      success: false,
      message: 'Exam not found'
    });
  }

  // Check if teacher owns this exam
  if (exam.teacherId !== req.user.userId) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this exam'
    });
  }

  // Don't allow updates if exam has already started
  if (new Date() > exam.examDate) {
    return res.status(400).json({
      success: false,
      message: 'Cannot update exam that has already started'
    });
  }

  const updatedExam = await Exam.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: 'Exam updated successfully',
    data: { exam: updatedExam }
  });
});

// @desc    Delete exam
// @route   DELETE /api/exam/:id
// @access  Private (Teacher)
const deleteExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id);

  if (!exam) {
    return res.status(404).json({
      success: false,
      message: 'Exam not found'
    });
  }

  // Check if teacher owns this exam
  if (exam.teacherId !== req.user.userId) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this exam'
    });
  }

  // Don't allow deletion if exam has results
  if (exam.results && exam.results.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete exam that has results'
    });
  }

  exam.isActive = false;
  await exam.save();

  res.json({
    success: true,
    message: 'Exam deleted successfully'
  });
});

// @desc    Add exam results
// @route   POST /api/exam/:id/results
// @access  Private (Teacher)
const addExamResults = asyncHandler(async (req, res) => {
  const { results } = req.body; // Array of { studentId, marks, remarks }
  
  const exam = await Exam.findById(req.params.id);

  if (!exam) {
    return res.status(404).json({
      success: false,
      message: 'Exam not found'
    });
  }

  // Check if teacher owns this exam
  if (exam.teacherId !== req.user.userId) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to add results to this exam'
    });
  }

  // Process each result
  for (const result of results) {
    const { studentId, marks, remarks } = result;
    
    // Calculate grade and percentage
    const percentage = (marks / exam.totalMarks) * 100;
    const grade = calculateGrade(percentage);

    // Check if result already exists for this student
    const existingResultIndex = exam.results.findIndex(r => r.studentId === studentId);
    
    const resultData = {
      studentId,
      marks,
      grade,
      percentage: Math.round(percentage * 100) / 100,
      submittedAt: new Date(),
      evaluatedBy: req.user.userId,
      evaluatedAt: new Date(),
      remarks
    };

    if (existingResultIndex > -1) {
      // Update existing result
      exam.results[existingResultIndex] = resultData;
    } else {
      // Add new result
      exam.results.push(resultData);
    }
  }

  await exam.save();

  res.json({
    success: true,
    message: 'Results added successfully',
    data: { exam }
  });
});

// @desc    Publish exam results
// @route   PUT /api/exam/:id/publish
// @access  Private (Teacher)
const publishResults = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id);

  if (!exam) {
    return res.status(404).json({
      success: false,
      message: 'Exam not found'
    });
  }

  // Check if teacher owns this exam
  if (exam.teacherId !== req.user.userId) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to publish results for this exam'
    });
  }

  if (exam.results.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot publish exam without results'
    });
  }

  exam.isPublished = true;
  await exam.save();

  // Send notifications to students about published results
  const notifications = exam.results.map(result => ({
    userId: result.studentId,
    title: 'Exam Results Published',
    message: `Results for ${exam.examName} have been published`,
    type: 'info',
    category: 'exam',
    data: {
      examId: exam._id,
      marks: result.marks,
      totalMarks: exam.totalMarks,
      grade: result.grade
    }
  }));

  await Notification.insertMany(notifications);

  res.json({
    success: true,
    message: 'Results published successfully',
    data: { exam }
  });
});

// Helper function to calculate grade
const calculateGrade = (percentage) => {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C+';
  if (percentage >= 40) return 'C';
  return 'F';
};

module.exports = {
  createExam,
  getExams,
  getExamById,
  updateExam,
  deleteExam,
  addExamResults,
  publishResults
};
