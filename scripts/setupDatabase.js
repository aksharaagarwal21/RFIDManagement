const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Class = require('../models/Class');
const Exam = require('../models/Exam');
const Settings = require('../models/Settings');
const Gamification = require('../models/Gamification');
const { DEFAULT_SETTINGS } = require('../config/constants');

// Load environment variables
require('dotenv').config();

const setupDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rfid_university');
    console.log('🗄️  Connected to MongoDB');

    // Clear existing data (optional - comment out in production)
    // await clearDatabase();

    // Create default settings
    await createDefaultSettings();

    // Create sample users
    await createSampleUsers();

    // Create sample classes
    await createSampleClasses();

    // Create sample exams
    await createSampleExams();

    console.log('✅ Database setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
};

const clearDatabase = async () => {
  console.log('🧹 Clearing existing data...');
  
  await User.deleteMany({});
  await Class.deleteMany({});
  await Exam.deleteMany({});
  await Settings.deleteMany({});
  await Gamification.deleteMany({});
  
  console.log('✅ Database cleared');
};

const createDefaultSettings = async () => {
  console.log('⚙️  Creating default settings...');
  
  const settings = [
    {
      key: 'attendance_threshold',
      value: DEFAULT_SETTINGS.ATTENDANCE_THRESHOLD,
      category: 'attendance',
      description: 'Minimum attendance percentage required',
      dataType: 'number'
    },
    {
      key: 'late_entry_minutes',
      value: DEFAULT_SETTINGS.LATE_ENTRY_MINUTES,
      category: 'attendance',
      description: 'Minutes after class start considered as late',
      dataType: 'number'
    },
    {
      key: 'security_alert_hours',
      value: DEFAULT_SETTINGS.SECURITY_ALERT_HOURS,
      category: 'security',
      description: 'Hour after which late exit alerts are triggered',
      dataType: 'number'
    },
    {
      key: 'gamification_enabled',
      value: DEFAULT_SETTINGS.GAMIFICATION_ENABLED,
      category: 'gamification',
      description: 'Enable gamification features',
      dataType: 'boolean'
    }
  ];

  await Settings.insertMany(settings);
  console.log('✅ Default settings created');
};

const createSampleUsers = async () => {
  console.log('👥 Creating sample users...');
  
  const users = [
    // Sample Students
    {
      userId: 'RA21CSE001',
      rfidCardId: 'RFC123456001',
      name: 'John Doe',
      email: 'john.doe@srm.edu',
      phone: '+91-9876543210',
      password: 'password123',
      role: 'student',
      studentDetails: {
        srmId: 'RA21CSE001',
        department: 'Computer Science',
        year: 3,
        semester: 5,
        hostelName: 'Boys Hostel 1',
        roomNumber: '101A'
      }
    },
    {
      userId: 'RA21CSE002',
      rfidCardId: 'RFC123456002',
      name: 'Jane Smith',
      email: 'jane.smith@srm.edu',
      phone: '+91-9876543211',
      password: 'password123',
      role: 'student',
      studentDetails: {
        srmId: 'RA21CSE002',
        department: 'Computer Science',
        year: 3,
        semester: 5,
        hostelName: 'Girls Hostel 1',
        roomNumber: '201B'
      }
    },
    // Sample Teacher
    {
      userId: 'T001',
      rfidCardId: 'RFC789456001',
      name: 'Prof. Michael Smith',
      email: 'prof.smith@srm.edu',
      phone: '+91-9876543300',
      password: 'password123',
      role: 'teacher',
      teacherDetails: {
        employeeId: 'T001',
        department: 'Computer Science',
        designation: 'Assistant Professor',
        subjects: ['Data Structures', 'Algorithms', 'Database Systems'],
        experience: 5
      }
    },
    // Sample Warden
    {
      userId: 'W001',
      rfidCardId: 'RFC789456002',
      name: 'Mr. Robert Johnson',
      email: 'warden.johnson@srm.edu',
      phone: '+91-9876543400',
      password: 'password123',
      role: 'warden',
      wardenDetails: {
        employeeId: 'W001',
        hostelName: 'Boys Hostel 1',
        contactNumber: '+91-9876543400'
      }
    }
  ];

  // Hash passwords and create users
  for (const userData of users) {
    const salt = await bcrypt.genSalt(12);
    userData.password = await bcrypt.hash(userData.password, salt);
    
    await User.create(userData);
    
    // Create gamification profile for students
    if (userData.role === 'student') {
      await Gamification.create({
        userId: userData.userId,
        totalPoints: 50,
        level: 1,
        badges: [{
          badgeName: 'Welcome',
          description: 'Welcome to RFID University!',
          icon: '👋',
          points: 50
        }]
      });
    }
  }

  console.log('✅ Sample users created');
};

const createSampleClasses = async () => {
  console.log('📚 Creating sample classes...');
  
  const classes = [
    {
      classCode: 'CSE301',
      className: 'Data Structures and Algorithms',
      department: 'Computer Science',
      year: 3,
      semester: 5,
      teacherId: 'T001',
      teacherName: 'Prof. Michael Smith',
      credits: 4,
      schedule: [
        {
          day: 'Monday',
          startTime: '09:00',
          endTime: '10:30',
          classroom: 'A101'
        },
        {
          day: 'Wednesday',
          startTime: '11:00',
          endTime: '12:30',
          classroom: 'A101'
        }
      ],
      enrolledStudents: ['RA21CSE001', 'RA21CSE002'],
      maxCapacity: 60
    },
    {
      classCode: 'CSE302',
      className: 'Database Management Systems',
      department: 'Computer Science',
      year: 3,
      semester: 5,
      teacherId: 'T001',
      teacherName: 'Prof. Michael Smith',
      credits: 3,
      schedule: [
        {
          day: 'Tuesday',
          startTime: '14:00',
          endTime: '15:30',
          classroom: 'B201'
        }
      ],
      enrolledStudents: ['RA21CSE001', 'RA21CSE002'],
      maxCapacity: 60
    }
  ];

  await Class.insertMany(classes);
  console.log('✅ Sample classes created');
};

const createSampleExams = async () => {
  console.log('📝 Creating sample exams...');
  
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  const exams = [
    {
      examName: 'Data Structures Mid Term',
      classId: 'CSE301',
      classCode: 'CSE301',
      teacherId: 'T001',
      examType: 'midterm',
      examDate: nextWeek,
      duration: 120,
      totalMarks: 100,
      examHall: 'Hall A',
      instructions: 'Bring calculator and ID card',
      enrolledStudents: ['RA21CSE001', 'RA21CSE002']
    }
  ];

  await Exam.insertMany(exams);
  console.log('✅ Sample exams created');
};

// Run setup
setupDatabase();
