const mongoose = require('mongoose');
const { LOCATIONS, ACTIONS } = require('../config/constants');

const rfidLogSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    ref: 'User'
  },
  rfidCardId: {
    type: String,
    required: [true, 'RFID Card ID is required']
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    enum: Object.values(LOCATIONS)
  },
  locationName: {
    type: String,
    required: [true, 'Location name is required']
  },
  action: {
    type: String,
    required: [true, 'Action is required'],
    enum: Object.values(ACTIONS)
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  deviceId: {
    type: String,
    required: [true, 'Device ID is required']
  },
  isValid: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Indexes
rfidLogSchema.index({ userId: 1 });
rfidLogSchema.index({ location: 1 });
rfidLogSchema.index({ timestamp: -1 });
rfidLogSchema.index({ action: 1 });
rfidLogSchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model('RfidLog', rfidLogSchema);
