// src/auth.controller.js
import passport from '../config/passport.config.js';
import db from '../models/index.js';
import { hashPassword } from '../utils/bcrypt.utils.js';
const { User } = db;

class AuthController {
  static login(req, res, next) {
    passport.authenticate('local', (err, user, info) => {
      if (err) {
        return next(err); // Handle unexpected errors
      }
      if (!user) {
        // Store the failure message in the session
        req.session.authMessage = info.message || 'Login failed';
        return res.redirect('/login');
      }
      req.logIn(user, (err) => {
        if (err) {
          return next(err); // Handle errors during login
        }
        return res.redirect('/dashboard');
      });
    })(req, res, next);
  }
  
  static googleLogin(req, res, next) {
    passport.authenticate('google', {
      scope: ['profile', 'email'],
    })(req, res, next);
  }
  
  static googleCallback(req, res, next) {
    passport.authenticate('google', (err, user, info) => {
      if (err) {
        return next(err); // Handle unexpected errors
      }
      if (!user) {
        // Store the failure message in the session
        req.session.authMessage = info.message || 'Authentication failed';
        return res.redirect('/login');
      }
      req.logIn(user, (err) => {
        if (err) {
          return next(err); // Handle errors during login
        }
        return res.redirect('/dashboard');
      });
    })(req, res, next);
  }
  
  static logout(req, res) {
    req.logout((err) => {
      if (err) {
        return next(err);
      }
      res.redirect('/');
    });
  };
  
  static async register(req, res) {
    const { email, password, name, role } = req.body;
  
    try {
      // Check if the user already exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }
  
      // Hash the password before storing it
      const hashedPassword = await hashPassword(password);
  
      // Create a new user
      const newUser = await User.create({
        name,
        email,
        role,
        password: hashedPassword
      });
  
      res.status(201).json({ message: 'User created successfully', user: newUser });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error creating user' });
    }
  };
}

export default AuthController;