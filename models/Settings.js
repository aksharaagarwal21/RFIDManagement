const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  key: {
    type: String,
    required: [true, 'Setting key is required'],
    unique: true,
    trim: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, 'Setting value is required']
  },
  category: {
    type: String,
    required: [true, 'Setting category is required'],
    enum: ['attendance', 'security', 'gamification', 'notification', 'general']
  },
  description: {
    type: String,
    required: [true, 'Setting description is required'],
    maxlength: 200
  },
  dataType: {
    type: String,
    required: [true, 'Data type is required'],
    enum: ['string', 'number', 'boolean', 'array', 'object']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: String,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
settingsSchema.index({ key: 1 });
settingsSchema.index({ category: 1 });
settingsSchema.index({ isActive: 1 });

// Get setting value
settingsSchema.statics.getValue = async function(key, defaultValue = null) {
  const setting = await this.findOne({ key, isActive: true });
  return setting ? setting.value : defaultValue;
};

// Set setting value
settingsSchema.statics.setValue = async function(key, value, userId = null) {
  return await this.findOneAndUpdate(
    { key },
    { value, updatedAt: new Date() },
    { new: true, upsert: false }
  );
};

module.exports = mongoose.model('Settings', settingsSchema);
