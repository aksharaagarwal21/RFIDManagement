const express = require('express');
const {
  recordMessEntry,
  getMessLogs,
  getMessStats,
  getMealRecommendations
} = require('../controllers/messController');
const { protect, authorize, rfidAuth } = require('../middleware/auth');
const { validatePagination } = require('../middleware/validation');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');
const { ROLES, MEAL_TYPES, PAYMENT_METHODS } = require('../config/constants');

const router = express.Router();

// Mess entry validation
const validateMessEntry = [
  body('studentId').notEmpty().withMessage('Student ID is required'),
  body('messName').notEmpty().withMessage('Mess name is required'),
  body('mealType').isIn(Object.values(MEAL_TYPES)).withMessage('Invalid meal type'),
  body('cost').isFloat({ min: 0 }).withMessage('Cost must be a positive number'),
  body('paymentMethod').isIn(Object.values(PAYMENT_METHODS)).withMessage('Invalid payment method'),
  body('rfidCardId').notEmpty().withMessage('RFID Card ID is required'),
  handleValidationErrors
];

// RFID device routes
router.post('/entry', rfidAuth, validateMessEntry, recordMessEntry);

// Protected user routes
router.use(protect);

router.get('/logs', validatePagination, getMessLogs);
router.get('/stats', getMessStats);
router.get('/recommendations', authorize(ROLES.STUDENT), getMealRecommendations);

module.exports = router;
