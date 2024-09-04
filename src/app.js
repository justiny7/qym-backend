const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const { sequelize } = require('./models');

const app = express();

// Middleware
app.use(helmet()); // Security
app.use(morgan('dev')); // Logging
app.use(cors()); // Enable CORS
app.use(bodyParser.json()); // Parse JSON bodies
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Dynamically load all route files in the 'routes' directory
const routesPath = path.join(__dirname, 'routes');
fs.readdirSync(routesPath).forEach((file) => {
    const routePath = path.join(routesPath, file);
    const route = require(routePath);
    // Assuming each route file exports a router object
    app.use('/api', route); // You can change the base path as needed
});

// Sync PostgreSQL tables
sequelize.sync({ force: false })  // Use force: true to drop and recreate tables each time
  .then(() => {
    console.log('Database & tables created!');
  })
  .catch(err => console.error('Failed to sync database:', err));

/*
// Error handling middleware
app.use(require('./middlewares/error.middleware'));
*/

// Test route
app.get('/', (req, res) => {
  res.json({ message: "Welcome to Qym backend!" });
});


module.exports = app;
