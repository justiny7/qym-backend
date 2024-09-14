// src/server.js
import app from './app.js';
import db from './models/index.js';
import http from 'http';
import { initializeWebSocket } from './websocket.js';

import dotenv from 'dotenv';
dotenv.config(); // Load environment variables

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

// Start the server after ensuring the database is connected
db.sequelize.authenticate()
  .then(() => {
    console.log('Database connected successfully.');
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
    initializeWebSocket(server);
  })
  .catch((err) => {
    console.error('Unable to connect to the database:', err);
  });
