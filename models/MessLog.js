const mongoose = require('mongoose');
const { MEAL_TYPES, PAYMENT_METHODS } = require('../config/constants');

const messLogSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: [true, 'Student ID is required'],
    ref: 'User'
  },
  messName: {
    type: String,
    required: [true, 'Mess name is required'],
    enum: ['Main Mess', 'Food Court', 'Canteen', 'Snack Bar']
  },
  mealType: {
    type: String,
    required: [true, 'Meal type is required'],
    enum: Object.values(MEAL_TYPES)
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  cost: {
    type: Number,
    required: [true, 'Cost is required'],
    min: 0,
    max: 1000
  },
  paymentMethod: {
    type: String,
    required: [true, 'Payment method is required'],
    enum: Object.values(PAYMENT_METHODS),
    default: PAYMENT_METHODS.CARD
  },
  rfidCardId: {
    type: String,
    required: [true, 'RFID Card ID is required']
  },
  items: [{
    type: String
  }],
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  finalAmount: {
    type: Number
  },
  transactionId: {
    type: String
  }
}, {
  timestamps: true
});

// Calculate final amount before saving
messLogSchema.pre('save', function(next) {
  if (this.discount > 0) {
    this.finalAmount = this.cost - (this.cost * this.discount / 100);
  } else {
    this.finalAmount = this.cost;
  }
  next();
});

// Indexes
messLogSchema.index({ studentId: 1 });
messLogSchema.index({ timestamp: -1 });
messLogSchema.index({ mealType: 1 });
messLogSchema.index({ messName: 1 });

module.exports = mongoose.model('MessLog', messLogSchema);
