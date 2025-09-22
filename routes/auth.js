const express = require('express');
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  logout
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const {
  validateUserRegistration,
  validateUserLogin,
  handleValidationErrors
} = require('../middleware/validation');

const router = express.Router();

// Public routes
router.post('/register', validateUserRegistration, register);
router.post('/login', validateUserLogin, login);

// Protected routes
router.use(protect); // All routes below this require authentication

router.get('/me', getMe);
router.put('/profile', updateProfile);
router.put('/password', changePassword);
router.post('/logout', logout);

module.exports = router;
