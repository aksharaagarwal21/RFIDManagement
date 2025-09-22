const mongoose = require('mongoose');

const gamificationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    unique: true,
    ref: 'User'
  },
  totalPoints: {
    type: Number,
    default: 0,
    min: 0
  },
  level: {
    type: Number,
    default: 1,
    min: 1
  },
  badges: [{
    badgeName: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    icon: {
      type: String,
      required: true
    },
    earnedAt: {
      type: Date,
      default: Date.now
    },
    points: {
      type: Number,
      required: true
    }
  }],
  streaks: {
    attendance: {
      type: Number,
      default: 0
    },
    messVisits: {
      type: Number,
      default: 0
    },
    libraryVisits: {
      type: Number,
      default: 0
    }
  },
  rank: {
    overall: {
      type: Number,
      default: 0
    },
    department: {
      type: Number,
      default: 0
    },
    year: {
      type: Number,
      default: 0
    }
  },
  achievements: [{
    name: String,
    description: String,
    unlockedAt: {
      type: Date,
      default: Date.now
    },
    category: String
  }],
  pointsHistory: [{
    points: Number,
    reason: String,
    category: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
gamificationSchema.index({ userId: 1 });
gamificationSchema.index({ totalPoints: -1 });
gamificationSchema.index({ level: -1 });

// Calculate level based on points
gamificationSchema.methods.updateLevel = function() {
  const pointsRequired = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500];
  
  for (let i = pointsRequired.length - 1; i >= 0; i--) {
    if (this.totalPoints >= pointsRequired[i]) {
      this.level = i + 1;
      break;
    }
  }
  
  this.lastUpdated = new Date();
  return this.save();
};

// Add points
gamificationSchema.methods.addPoints = function(points, reason, category = 'general') {
  this.totalPoints += points;
  this.pointsHistory.push({
    points,
    reason,
    category
  });
  
  return this.updateLevel();
};

module.exports = mongoose.model('Gamification', gamificationSchema);
