const bcrypt = require('bcryptjs');
const Gamification = require('../models/Gamification');
const { asyncHandler } = require('../middleware/errorHandler');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const {
    userId,
    rfidCardId,
    name,
    email,
    phone,
    password,
    role,
    studentDetails,
    teacherDetails,
    wardenDetails,
    parentDetails
  } = req.body;

  // Check if user exists
  const existingUser = await User.findOne({
    $or: [
      { email },
      { userId },
      { rfidCardId }
    ]
  });

  if (existingUser) {
    const field = existingUser.email === email ? 'email' : 
                  existingUser.userId === userId ? 'userId' : 'rfidCardId';
    return res.status(400).json({
      success: false,
      message: `User with this ${field} already exists`
    });
  }

  // Create user data
  const userData = {
    userId,
    rfidCardId,
    name,
    email,
    phone,
    password,
    role
  };

  // Add role-specific details
  if (role === 'student' && studentDetails) {
    userData.studentDetails = studentDetails;
  } else if (role === 'teacher' && teacherDetails) {
    userData.teacherDetails = teacherDetails;
  } else if (role === 'warden' && wardenDetails) {
    userData.wardenDetails = wardenDetails;
  } else if (role === 'parent' && parentDetails) {
    userData.parentDetails = parentDetails;
  }

  // Create user
  const user = await User.create(userData);

  // Create gamification record for students
  if (role === 'student') {
    await Gamification.create({
      userId: user.userId,
      totalPoints: 50, // Welcome bonus
      level: 1,
      badges: [{
        badgeName: 'Welcome',
        description: 'Welcome to RFID University!',
        icon: '👋',
        points: 50
      }]
    });
  }

  // Generate token
  const token = user.generateToken();

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: user._id,
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage
      },
      token
    }
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check for user
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Check if user is active
  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      message: 'Account is deactivated'
    });
  }

  // Check password
  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate token
  const token = user.generateToken();

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user._id,
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        studentDetails: user.studentDetails,
        teacherDetails: user.teacherDetails,
        wardenDetails: user.wardenDetails,
        parentDetails: user.parentDetails
      },
      token
    }
  });
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  res.json({
    success: true,
    data: {
      user
    }
  });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const fieldsToUpdate = {
    name: req.body.name,
    phone: req.body.phone,
    profileImage: req.body.profileImage
  };

  // Remove undefined fields
  Object.keys(fieldsToUpdate).forEach(key => 
    fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
  );

  const user = await User.findByIdAndUpdate(
    req.user.id,
    fieldsToUpdate,
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user
    }
  });
});

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id).select('+password');

  // Check current password
  const isMatch = await user.comparePassword(currentPassword);

  if (!isMatch) {
    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  user.password = newPassword;
  await user.save();

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  logout
};
