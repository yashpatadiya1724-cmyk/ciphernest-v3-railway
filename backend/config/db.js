const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ciphernest';
    console.log(`🔌 Connecting to MongoDB: ${uri}`);
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);

    mongoose.connection.on('error', err => {
      console.error('🌊 Mongoose connection error:', err);
    });
    mongoose.connection.on('disconnected', () => {
      console.warn('📡 Mongoose disconnected');
    });
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.error('💡 Make sure MongoDB is running: mongod --dbpath /data/db');
    process.exit(1);
  }
};

module.exports = connectDB;
