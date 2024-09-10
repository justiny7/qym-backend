// src/middleware/auth.middleware.js
import dotenv from 'dotenv';
dotenv.config();

/**
 * A middleware function that checks if the request is authenticated and has the correct role.
 * @param {List} roles - A list of roles that are allowed to access the route.
 * @returns {Function} - The response object.
 */
export const authUser = (roles) => {
  return (req, res, next) => {
    if (req.isAuthenticated()) {
      if (roles.includes(req.user.role)) {
        return next();
      }
      res.status(403).json({ message: 'Unauthorized' });
    } else {
      res.redirect('/login');
    }
  };
}

/**
 * A middleware function that checks if the request is a machine by checking its Bearer API key.
 * @returns {Function} - The response object.
 */
export const authMachine = () => {
  return (req, res, next) => {
    const apiKey = req.headers['authorization']?.split(' ')[1]; // Extract the key from "Bearer <key>"
    const validApiKey = process.env.INTERNAL_MACHINE_API_KEY;
    console.log(apiKey, validApiKey);

    if (apiKey === validApiKey) {
      next();
    } else {
      res.status(403).json({ message: 'Forbidden'});
    }
  };
}