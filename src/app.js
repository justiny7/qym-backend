const express = require('express');
// const bodyParser = require('body-parser');
// const cors = require('cors');
// const helmet = require('helmet');
// const morgan = require('morgan');

const machineRoutes = require('./routes/machineRoutes');

const app = express();


// Middleware
// app.use(helmet());
// app.use(bodyParser.json());
// app.use(cors());
// app.use(morgan('combined'));

// Test route
app.get('/', (req, res) => {
  res.json({ message: "Welcome to Qym backend!" });
});


// Routes
// app.use('/api/machines', machineRoutes);

// Error handling middleware
/*
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});
*/

module.exports = app;
