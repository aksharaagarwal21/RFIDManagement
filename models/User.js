const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ROLES, DEPARTMENTS, HOSTELS } = require('../config/constants');

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    unique: true,
    trim: true,
    minlength: 5,
    maxlength: 20
  },
  rfidCardId: {
    type: String,
    required: [true, 'RFID Card ID is required'],
    unique: true,
    trim: true,
    minlength: 12,
    maxlength: 12
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[0-9+\-\s()]+$/, 'Please enter a valid phone number']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    required: [true, 'Role is required'],
    enum: Object.values(ROLES),
    default: ROLES.STUDENT
  },
  profileImage: {
    type: String,
    default: function() {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(this.name)}&background=3b82f6&color=fff`;
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  
  // Student-specific details
  studentDetails: {
    srmId: {
      type: String,
      required: function() { return this.role === ROLES.STUDENT; }
    },
    department: {
      type: String,
      required: function() { return this.role === ROLES.STUDENT; },
      enum: DEPARTMENTS
    },
    year: {
      type: Number,
      required: function() { return this.role === ROLES.STUDENT; },
      min: 1,
      max: 4
    },
    semester: {
      type: Number,
      required: function() { return this.role === ROLES.STUDENT; },
      min: 1,
      max: 8
    },
    hostelName: {
      type: String,
      required: function() { return this.role === ROLES.STUDENT; },
      enum: HOSTELS
    },
    roomNumber: {
      type: String,
      required: function() { return this.role === ROLES.STUDENT; }
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },

  // Teacher-specific details
  teacherDetails: {
    employeeId: {
      type: String,
      required: function() { return this.role === ROLES.TEACHER; }
    },
    department: {
      type: String,
      required: function() { return this.role === ROLES.TEACHER; },
      enum: DEPARTMENTS
    },
    designation: {
      type: String,
      required: function() { return this.role === ROLES.TEACHER; }
    },
    subjects: [{
      type: String
    }],
    experience: {
      type: Number,
      min: 0
    }
  },

  // Warden-specific details
  wardenDetails: {
    employeeId: {
      type: String,
      required: function() { return this.role === ROLES.WARDEN; }
    },
    hostelName: {
      type: String,
      required: function() { return this.role === ROLES.WARDEN; },
      enum: HOSTELS
    },
    contactNumber: {
      type: String,
      required: function() { return this.role === ROLES.WARDEN; }
    }
  },

  // Parent-specific details
  parentDetails: {
    occupation: String,
    childrenIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  }
}, {
  timestamps: true
});

// Indexes for better performance
userSchema.index({ email: 1 });
userSchema.index({ userId: 1 });
userSchema.index({ rfidCardId: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'studentDetails.department': 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(enteredPassword) {
  try {
    return await bcrypt.compare(enteredPassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Generate JWT token
userSchema.methods.generateToken = function() {
  return jwt.sign(
    { 
      id: this._id, 
      userId: this.userId,
      role: this.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

// Virtual for full name
userSchema.virtual('displayName').get(function() {
  return this.name;
});

// Virtual for role-specific details
userSchema.virtual('roleDetails').get(function() {
  switch(this.role) {
    case ROLES.STUDENT:
      return this.studentDetails;
    case ROLES.TEACHER:
      return this.teacherDetails;
    case ROLES.WARDEN:
      return this.wardenDetails;
    case ROLES.PARENT:
      return this.parentDetails;
    default:
      return null;
  }
});

// Transform output - remove password and add virtual fields
userSchema.methods.toJSON = function() {
  const user = this.toObject({ virtuals: true });
  delete user.password;
  delete user.__v;
  return user;
};

// Static method to find user by credentials
userSchema.statics.findByCredentials = async function(email, password) {
  const user = await this.findOne({ email, isActive: true }).select('+password');
  
  if (!user) {
    throw new Error('Invalid login credentials');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new Error('Invalid login credentials');
  }

  return user;
};

// Instance method to check if user has role
userSchema.methods.hasRole = function(role) {
  return this.role === role;
};

// Instance method to get user's primary department
userSchema.methods.getDepartment = function() {
  if (this.role === ROLES.STUDENT) {
    return this.studentDetails?.department;
  } else if (this.role === ROLES.TEACHER) {
    return this.teacherDetails?.department;
  }
  return null;
};

// Pre-validate hook for role-specific validations
userSchema.pre('validate', function(next) {
  // Ensure role-specific details are provided
  if (this.role === ROLES.STUDENT && !this.studentDetails) {
    return next(new Error('Student details are required for student role'));
  }
  
  if (this.role === ROLES.TEACHER && !this.teacherDetails) {
    return next(new Error('Teacher details are required for teacher role'));
  }
  
  if (this.role === ROLES.WARDEN && !this.wardenDetails) {
    return next(new Error('Warden details are required for warden role'));
  }
  
  next();
});

module.exports = mongoose.model('User', userSchema);
