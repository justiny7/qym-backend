// src/config/db.config.js
import dotenv from 'dotenv';
dotenv.config(); // Load environment variables

const dbConfig = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
  },
  test: {
    username: 'your_username',
    password: 'your_password',
    database: 'gym_machine_manager_test',
    host: '127.0.0.1',
    dialect: 'postgres',
  },
  production: {
    username: 'your_username',
    password: 'your_password',
    database: 'gym_machine_manager_production',
    host: '127.0.0.1',
    dialect: 'postgres',
  },
};

export default dbConfig;