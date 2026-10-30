import dotenv from 'dotenv';
import { createApp } from './app.js';
import { connectDB, disconnectDB } from './config/database.js';

dotenv.config();

const PORT = process.env.PORT || 5000;
const app = createApp();

let server;

async function startServer() {
  try {
    // Connect to MongoDB
    if (process.env.MONGODB_URI) {
      await connectDB();
    } else {
      console.warn('[Server Warning] MONGODB_URI not set. Running server without active database connection.');
    }

    server = app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`  Government Scheme Extraction API Server`);
      console.log(`  Running on: http://localhost:${PORT}`);
      console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`=======================================================`);
    });
  } catch (error) {
    console.error('[Server Startup Error]:', error.message);
    process.exit(1);
  }
}

// Graceful shutdown handling
const shutdown = async (signal) => {
  console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
  if (server) {
    server.close(async () => {
      console.log('[Server] HTTP server closed');
      await disconnectDB();
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

startServer();
