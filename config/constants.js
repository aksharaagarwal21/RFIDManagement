// Application constants
const ROLES = {
  STUDENT: 'student',
  TEACHER: 'teacher',
  WARDEN: 'warden',
  PARENT: 'parent',
  ADMIN: 'admin'
};

const LOCATIONS = {
  MAIN_GATE: 'main_gate',
  HOSTEL_GATE: 'hostel_gate',
  LIBRARY: 'library',
  MESS: 'mess',
  CLASSROOM: 'classroom',
  LABORATORY: 'laboratory',
  EXAM_HALL: 'exam_hall'
};

const ACTIONS = {
  ENTRY: 'entry',
  EXIT: 'exit'
};

const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late'
};

const EXAM_TYPES = {
  QUIZ: 'quiz',
  MIDTERM: 'midterm',
  FINAL: 'final',
  ASSIGNMENT: 'assignment'
};

const MEAL_TYPES = {
  BREAKFAST: 'breakfast',
  LUNCH: 'lunch',
  DINNER: 'dinner',
  SNACKS: 'snacks'
};

const NOTIFICATION_TYPES = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  SUCCESS: 'success'
};

const NOTIFICATION_CATEGORIES = {
  ATTENDANCE: 'attendance',
  EXAM: 'exam',
  MESS: 'mess',
  SECURITY: 'security',
  GENERAL: 'general',
  GAMIFICATION: 'gamification'
};

const ALERT_TYPES = {
  UNUSUAL_TIMING: 'unusual_timing',
  MULTIPLE_FAILED_ATTEMPTS: 'multiple_failed_attempts',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  UNAUTHORIZED_ACCESS: 'unauthorized_access'
};

const ALERT_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

const ALERT_STATUS = {
  PENDING: 'pending',
  REVIEWED: 'reviewed',
  RESOLVED: 'resolved'
};

const PAYMENT_METHODS = {
  CARD: 'card',
  CASH: 'cash',
  DIGITAL: 'digital'
};

const DEPARTMENTS = [
  'Computer Science',
  'Electronics and Communication',
  'Mechanical Engineering',
  'Civil Engineering',
  'Information Technology',
  'Electrical Engineering',
  'Chemical Engineering',
  'Biotechnology'
];

const HOSTELS = [
  'Boys Hostel 1',
  'Boys Hostel 2',
  'Boys Hostel 3',
  'Girls Hostel 1',
  'Girls Hostel 2',
  'Girls Hostel 3'
];

const CLASSROOMS = [
  'A101', 'A102', 'A103', 'A201', 'A202', 'A203',
  'B101', 'B102', 'B103', 'B201', 'B202', 'B203',
  'C101', 'C102', 'C103', 'C201', 'C202', 'C203',
  'Lab-1', 'Lab-2', 'Lab-3', 'Lab-4',
  'Hall A', 'Hall B', 'Hall C'
];

const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 6,
  PASSWORD_MAX_LENGTH: 128,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  PHONE_LENGTH: 10,
  USER_ID_MIN_LENGTH: 5,
  USER_ID_MAX_LENGTH: 20,
  RFID_CARD_ID_LENGTH: 12
};

const GAMIFICATION = {
  POINTS: {
    ATTENDANCE: 10,
    EARLY_ARRIVAL: 5,
    PERFECT_WEEK: 50,
    LIBRARY_VISIT: 3,
    MESS_VISIT: 2,
    EXAM_PARTICIPATION: 20
  },
  BADGES: {
    PERFECT_ATTENDANCE: {
      name: 'Perfect Attendance',
      description: 'Attended all classes this week',
      icon: '🎯',
      points: 100
    },
    EARLY_BIRD: {
      name: 'Early Bird',
      description: 'First to enter classroom 5 times',
      icon: '🌅',
      points: 50
    },
    LIBRARY_CHAMPION: {
      name: 'Library Champion',
      description: 'Spent 20+ hours in library this week',
      icon: '📚',
      points: 75
    },
    MESS_REGULAR: {
      name: 'Mess Regular',
      description: 'Never missed a meal this week',
      icon: '🍽️',
      points: 30
    }
  }
};

const DEFAULT_SETTINGS = {
  ATTENDANCE_THRESHOLD: 75,
  LATE_ENTRY_MINUTES: 10,
  SECURITY_ALERT_HOURS: 22,
  GAMIFICATION_ENABLED: true,
  EMAIL_NOTIFICATIONS: true,
  PUSH_NOTIFICATIONS: true
};

module.exports = {
  ROLES,
  LOCATIONS,
  ACTIONS,
  ATTENDANCE_STATUS,
  EXAM_TYPES,
  MEAL_TYPES,
  NOTIFICATION_TYPES,
  NOTIFICATION_CATEGORIES,
  ALERT_TYPES,
  ALERT_SEVERITY,
  ALERT_STATUS,
  PAYMENT_METHODS,
  DEPARTMENTS,
  HOSTELS,
  CLASSROOMS,
  VALIDATION_RULES,
  GAMIFICATION,
  DEFAULT_SETTINGS
};
