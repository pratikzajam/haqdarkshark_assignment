import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

let isConnected = false;

/**
 * Connect to MongoDB using Mongoose
 * Handles connection lifecycle events and error handling.
 */
export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    const errorMsg = 'MONGODB_URI is not defined in environment variables. Please check your .env configuration.';
    console.error(`[Database Error] ${errorMsg}`);
    throw new Error(errorMsg);
  }

  if (isConnected || mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  try {
    mongoose.connection.on('connected', () => {
      isConnected = true;
      console.log(`[Database] Successfully connected to MongoDB at ${mongoose.connection.host}`);
    });

    mongoose.connection.on('error', (err) => {
      console.error('[Database Error] MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      console.warn('[Database Warning] MongoDB connection disconnected');
    });

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true
    });

    isConnected = true;
    return conn;
  } catch (error) {
    console.error('[Database Error] Initial MongoDB connection failed:', error.message);
    throw error;
  }
}

/**
 * Disconnect from MongoDB (useful for graceful shutdown or tests)
 */
export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
    console.log('[Database] MongoDB connection closed cleanly');
  }
}
