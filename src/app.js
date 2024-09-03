const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
// const routes = require('./routes'); // Import your route files

const app = express();

// Middleware
app.use(helmet()); // Security
app.use(morgan('dev')); // Logging
app.use(cors()); // Enable CORS
app.use(bodyParser.json()); // Parse JSON bodies
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded bodies

// API Routes
/*
app.use('/api/admin', routes.adminRoutes);
app.use('/api/user', routes.userRoutes);
app.use('/api/gym', routes.gymRoutes);
app.use('/api/machine', routes.machineRoutes);
app.use('/api/log', routes.logRoutes);

// Error handling middleware
app.use(require('./middlewares/error.middleware'));
*/

// Test route
app.get('/', (req, res) => {
  res.json({ message: "Welcome to Qym backend!" });
});

module.exports = app;
