const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.NODE_ENV === 'production' 
      ? process.env.MONGODB_URI_PROD 
      : process.env.MONGODB_URI || 'mongodb://localhost:27017/rfid_university';

    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`🗄️  MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database Name: ${conn.connection.name}`);

    // Connection event handlers
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('🔌 MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });

    // Graceful close on app termination
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('🗄️  MongoDB connection closed through app termination');
        process.exit(0);
      } catch (err) {
        console.error('❌ Error closing MongoDB connection:', err);
        process.exit(1);
      }
    });

  } catch (error) {
    console.error('❌ Database connection failed:', error);
    
    // Retry connection after 5 seconds
    console.log('🔄 Retrying database connection in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
};

module.exports = connectDB;
