const { body, param, query, validationResult } = require('express-validator');
const { ROLES, DEPARTMENTS, HOSTELS, VALIDATION_RULES } = require('../config/constants');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages
    });
  }
  
  next();
};

// User registration validation
const validateUserRegistration = [
  body('userId')
    .isLength({ min: VALIDATION_RULES.USER_ID_MIN_LENGTH, max: VALIDATION_RULES.USER_ID_MAX_LENGTH })
    .withMessage(`User ID must be between ${VALIDATION_RULES.USER_ID_MIN_LENGTH} and ${VALIDATION_RULES.USER_ID_MAX_LENGTH} characters`)
    .matches(/^[A-Z0-9]+$/)
    .withMessage('User ID must contain only uppercase letters and numbers'),
  
  body('rfidCardId')
    .isLength({ min: VALIDATION_RULES.RFID_CARD_ID_LENGTH, max: VALIDATION_RULES.RFID_CARD_ID_LENGTH })
    .withMessage(`RFID Card ID must be exactly ${VALIDATION_RULES.RFID_CARD_ID_LENGTH} characters`)
    .matches(/^[A-Z0-9]+$/)
    .withMessage('RFID Card ID must contain only uppercase letters and numbers'),
  
  body('name')
    .isLength({ min: VALIDATION_RULES.NAME_MIN_LENGTH, max: VALIDATION_RULES.NAME_MAX_LENGTH })
    .withMessage(`Name must be between ${VALIDATION_RULES.NAME_MIN_LENGTH} and ${VALIDATION_RULES.NAME_MAX_LENGTH} characters`)
    .matches(/^[a-zA-Z\s.]+$/)
    .withMessage('Name must contain only letters, spaces, and periods'),
  
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  
  body('phone')
    .matches(/^[\+]?[0-9\s\-\(\)]+$/)
    .withMessage('Please enter a valid phone number'),
  
  body('password')
    .isLength({ min: VALIDATION_RULES.PASSWORD_MIN_LENGTH, max: VALIDATION_RULES.PASSWORD_MAX_LENGTH })
    .withMessage(`Password must be between ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} and ${VALIDATION_RULES.PASSWORD_MAX_LENGTH} characters`)
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('role')
    .isIn(Object.values(ROLES))
    .withMessage('Invalid role selected'),

  handleValidationErrors
];

// User login validation
const validateUserLogin = [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),

  handleValidationErrors
];

// RFID scan validation
const validateRfidScan = [
  body('userId')
    .notEmpty()
    .withMessage('User ID is required'),
  
  body('rfidCardId')
    .notEmpty()
    .withMessage('RFID Card ID is required'),
  
  body('location')
    .notEmpty()
    .withMessage('Location is required'),
  
  body('action')
    .isIn(['entry', 'exit'])
    .withMessage('Action must be either entry or exit'),
  
  body('deviceId')
    .notEmpty()
    .withMessage('Device ID is required'),

  handleValidationErrors
];

// Class creation validation
const validateClass = [
  body('classCode')
    .matches(/^[A-Z]{2,4}[0-9]{3}$/)
    .withMessage('Class code must be in format like CSE301'),
  
  body('className')
    .isLength({ min: 3, max: 100 })
    .withMessage('Class name must be between 3 and 100 characters'),
  
  body('department')
    .isIn(DEPARTMENTS)
    .withMessage('Invalid department selected'),
  
  body('year')
    .isInt({ min: 1, max: 4 })
    .withMessage('Year must be between 1 and 4'),
  
  body('semester')
    .isInt({ min: 1, max: 8 })
    .withMessage('Semester must be between 1 and 8'),
  
  body('credits')
    .isInt({ min: 1, max: 6 })
    .withMessage('Credits must be between 1 and 6'),

  handleValidationErrors
];

// Attendance marking validation
const validateAttendance = [
  body('studentId')
    .notEmpty()
    .withMessage('Student ID is required'),
  
  body('classId')
    .notEmpty()
    .withMessage('Class ID is required'),
  
  body('status')
    .isIn(['present', 'absent', 'late'])
    .withMessage('Status must be present, absent, or late'),
  
  body('date')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Date must be in YYYY-MM-DD format'),

  handleValidationErrors
];

// Exam validation
const validateExam = [
  body('examName')
    .isLength({ min: 3, max: 100 })
    .withMessage('Exam name must be between 3 and 100 characters'),
  
  body('classId')
    .notEmpty()
    .withMessage('Class ID is required'),
  
  body('examType')
    .isIn(['quiz', 'midterm', 'final', 'assignment'])
    .withMessage('Invalid exam type'),
  
  body('examDate')
    .isISO8601()
    .withMessage('Invalid exam date format'),
  
  body('duration')
    .isInt({ min: 15, max: 300 })
    .withMessage('Duration must be between 15 and 300 minutes'),
  
  body('totalMarks')
    .isInt({ min: 1, max: 200 })
    .withMessage('Total marks must be between 1 and 200'),

  handleValidationErrors
];

// ID parameter validation
const validateObjectId = (paramName = 'id') => [
  param(paramName)
    .matches(/^[0-9a-fA-F]{24}$/)
    .withMessage('Invalid ID format'),
  
  handleValidationErrors
];

// Query validation for pagination
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('sort')
    .optional()
    .matches(/^(-?[a-zA-Z_]+)$/)
    .withMessage('Invalid sort format'),

  handleValidationErrors
];

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateRfidScan,
  validateClass,
  validateAttendance,
  validateExam,
  validateObjectId,
  validatePagination,
  handleValidationErrors
};
