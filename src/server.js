// src/server.js
import dotenv from 'dotenv';
dotenv.config(); // Load environment variables

import app from './app.js';
import db from './models/index.js';

const PORT = process.env.PORT || 3000;

// Start the server after ensuring the database is connected
db.sequelize.authenticate()
  .then(() => {
    console.log('Database connected successfully.');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Unable to connect to the database:', err);
  });
