const express = require('express');
const {
  createExam,
  getExams,
  getExamById,
  updateExam,
  deleteExam,
  addExamResults,
  publishResults
} = require('../controllers/examController');
const { protect, authorize } = require('../middleware/auth');
const { validateExam, validateObjectId, validatePagination } = require('../middleware/validation');
const { ROLES } = require('../config/constants');

const router = express.Router();

// Protect all routes
router.use(protect);

// General routes
router.get('/', validatePagination, getExams);
router.get('/:id', validateObjectId(), getExamById);

// Teacher and admin only routes
router.post('/', 
  authorize(ROLES.TEACHER, ROLES.ADMIN), 
  validateExam, 
  createExam
);

router.put('/:id', 
  authorize(ROLES.TEACHER, ROLES.ADMIN), 
  validateObjectId(), 
  updateExam
);

router.delete('/:id', 
  authorize(ROLES.TEACHER, ROLES.ADMIN), 
  validateObjectId(), 
  deleteExam
);

router.post('/:id/results', 
  authorize(ROLES.TEACHER, ROLES.ADMIN), 
  validateObjectId(), 
  addExamResults
);

router.put('/:id/publish', 
  authorize(ROLES.TEACHER, ROLES.ADMIN), 
  validateObjectId(), 
  publishResults
);

module.exports = router;
