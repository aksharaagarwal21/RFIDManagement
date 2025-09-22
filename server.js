const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const socketIo = require('socket.io');
const http = require('http');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const rfidRoutes = require('./routes/rfid');
const attendanceRoutes = require('./routes/attendance');
const examRoutes = require('./routes/exams');
const messRoutes = require('./routes/mess');
const notificationRoutes = require('./routes/notifications');
const securityRoutes = require('./routes/security');
const gamificationRoutes = require('./routes/gamification');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const connectDB = require('./config/database');

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Make io accessible to routes
app.set('io', io);

// Trust proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// Enable compression
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true,
  optionsSuccessStatus: 200
}));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Static file serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/rfid', rfidRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/exam', examRoutes);
app.use('/api/mess', messRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/gamification', gamificationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'RFID University Backend is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to RFID University Management System API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      dashboard: '/api/dashboard',
      rfid: '/api/rfid',
      attendance: '/api/attendance',
      exams: '/api/exam',
      mess: '/api/mess',
      notifications: '/api/notifications',
      security: '/api/security',
      gamification: '/api/gamification'
    }
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`🔌 New client connected: ${socket.id}`);

  // Join specific rooms based on user role
  socket.on('join-dashboard', (userRole) => {
    socket.join(`dashboard-${userRole}`);
    console.log(`👤 User joined ${userRole} dashboard room`);
  });

  // Handle RFID scan events (from RFID devices)
  socket.on('rfid-scan', (data) => {
    console.log('📡 RFID scan received:', data);
    
    // Broadcast to appropriate dashboard rooms
    io.to('dashboard-warden').emit('location-update', data);
    io.to('dashboard-teacher').emit('location-update', data);
    
    // Send to specific student if logged in
    if (data.userId) {
      io.to('dashboard-student').emit('location-update', data);
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('🔌 Process terminated');
    mongoose.connection.close();
  });
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('🔌 Process terminated');
    mongoose.connection.close();
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`
🚀 RFID University Backend Server Started!
📡 Server running on port ${PORT}
🌍 Environment: ${process.env.NODE_ENV}
🗄️  Database: MongoDB
🔌 Socket.IO enabled
📅 Started at: ${new Date().toLocaleString()}
  `);
});

// Export for testing
module.exports = app;
