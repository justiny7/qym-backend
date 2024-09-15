// src/server.js
import app from './app.js';
import db from './models/index.js';
import http from 'http';
import { initializeWebSocket } from './websocket.js';
import redisClient from './config/redis.config.js';

import dotenv from 'dotenv';
dotenv.config(); // Load environment variables

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

// Function to start the server
const startServer = async () => {
  try {
    // Connect to Redis
    await redisClient.connect();
    console.log('Connected to Redis');

    // Connect to the database
    await db.sequelize.authenticate();
    console.log('Database connected successfully.');

    // Start the server
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

    // Initialize WebSocket
    initializeWebSocket(server);

  } catch (error) {
    console.error('Unable to start the server:', error);
    process.exit(1);
  }
};

// Handle Redis connection errors
redisClient.on('error', (err) => {
  console.error('Redis connection error:', err);
});

// Start the server
startServer();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  server.close(() => {
    console.log('HTTP server closed.');
  });
  await redisClient.quit();
  console.log('Redis connection closed.');
  await db.sequelize.close();
  console.log('Database connection closed.');
  process.exit(0);
});
