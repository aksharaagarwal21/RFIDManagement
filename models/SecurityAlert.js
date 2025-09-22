const mongoose = require('mongoose');
const { ALERT_TYPES, ALERT_SEVERITY, ALERT_STATUS } = require('../config/constants');

const securityAlertSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    ref: 'User'
  },
  userName: {
    type: String,
    required: [true, 'User name is required']
  },
  alertType: {
    type: String,
    required: [true, 'Alert type is required'],
    enum: Object.values(ALERT_TYPES)
  },
  severity: {
    type: String,
    required: [true, 'Alert severity is required'],
    enum: Object.values(ALERT_SEVERITY),
    default: ALERT_SEVERITY.LOW
  },
  message: {
    type: String,
    required: [true, 'Alert message is required'],
    maxlength: 500
  },
  location: {
    type: String,
    required: [true, 'Location is required']
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  },
  status: {
    type: String,
    enum: Object.values(ALERT_STATUS),
    default: ALERT_STATUS.PENDING
  },
  reviewedBy: {
    type: String,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  resolutionNotes: {
    type: String,
    maxlength: 1000
  },
  notificationsSent: [{
    recipientId: String,
    sentAt: Date,
    method: {
      type: String,
      enum: ['email', 'sms', 'push', 'in-app']
    }
  }]
}, {
  timestamps: true
});

// Indexes
securityAlertSchema.index({ userId: 1 });
securityAlertSchema.index({ alertType: 1 });
securityAlertSchema.index({ severity: 1 });
securityAlertSchema.index({ timestamp: -1 });
securityAlertSchema.index({ status: 1 });

module.exports = mongoose.model('SecurityAlert', securityAlertSchema);
