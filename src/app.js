import express from 'express';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import { fileURLToPath } from 'url';
import db from './models/index.js'; // Adjust the path as needed

const app = express();

// Middleware
app.use(helmet()); // Security
app.use(morgan('dev')); // Logging
app.use(cors()); // Enable CORS
app.use(bodyParser.json()); // Parse JSON bodies
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Dynamically load all route files in the 'routes' directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const routesPath = path.join(__dirname, 'routes');

fs.readdirSync(routesPath).forEach((file) => {
  if (file.endsWith('.js')) { // Only process JavaScript files
    const routePath = path.join(routesPath, file);
    import(routePath).then((module) => {
      const route = module.default; // Assuming each route file exports a default router object
      app.use('/api', route); // You can change the base path as needed
    }).catch(err => console.error(`Failed to load route ${file}:`, err));
  }
});

// Sync PostgreSQL tables
db.sequelize.sync({ force: false }) // Use force: true to drop and recreate tables each time
  .then(() => {
    console.log('Database & tables created!');
  })
  .catch(err => console.error('Failed to sync database:', err));

// Error handling middleware
// app.use(await import('./middlewares/error.middleware.js').then(m => m.default));

// Test route
app.get('/', (req, res) => {
  res.json({ message: "Welcome to Qym backend!" });
});

export default app;
