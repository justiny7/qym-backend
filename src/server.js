// src/server.js
require('dotenv').config(); // Load environment variables
const app = require('./app');
const { sequelize } = require('./models'); // Import sequelize instance

const PORT = process.env.PORT || 3000;

// Start the server after ensuring the database is connected
sequelize.authenticate()
  .then(() => {
    console.log('Database connected successfully.');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Unable to connect to the database:', err);
  });
