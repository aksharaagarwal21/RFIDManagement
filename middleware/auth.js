const jwt = require('jsonwebtoken');
const { ROLES } = require('../config/constants');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from token
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User not found or inactive'
        });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
};

// Role-based access control
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }

    next();
  };
};

// Optional auth - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const user = await User.findById(decoded.id).select('-password');
          
          if (user && user.isActive) {
            req.user = user;
          }
        } catch (error) {
          // Token invalid, but continue without user
          console.log('Invalid token in optional auth:', error.message);
        }
      }
    }

    next();
  } catch (error) {
    next();
  }
};

// RFID device authentication
const rfidAuth = async (req, res, next) => {
  try {
    const deviceSecret = req.headers['x-device-secret'];
    
    if (!deviceSecret || deviceSecret !== process.env.RFID_DEVICE_SECRET) {
      return res.status(401).json({
        success: false,
        message: 'Invalid device authentication'
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error in device authentication'
    });
  }
};

module.exports = {
  protect,
  authorize,
  optionalAuth,
  rfidAuth
};

