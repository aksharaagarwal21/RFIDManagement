const mongoose = require('mongoose');
const { NOTIFICATION_TYPES, NOTIFICATION_CATEGORIES } = require('../config/constants');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    ref: 'User'
  },
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    maxlength: 100
  },
  message: {
    type: String,
    required: [true, 'Notification message is required'],
    maxlength: 500
  },
  type: {
    type: String,
    required: [true, 'Notification type is required'],
    enum: Object.values(NOTIFICATION_TYPES),
    default: NOTIFICATION_TYPES.INFO
  },
  category: {
    type: String,
    required: [true, 'Notification category is required'],
    enum: Object.values(NOTIFICATION_CATEGORIES),
    default: NOTIFICATION_CATEGORIES.GENERAL
  },
  isRead: {
    type: Boolean,
    default: false
  },
  data: {
    type: mongoose.Schema.Types.Mixed
  },
  readAt: {
    type: Date
  },
  expiresAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ category: 1 });
notificationSchema.index({ isRead: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Mark as read
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Notification', notificationSchema);
