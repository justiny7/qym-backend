// src/auth.controller.js
import passport from '../config/passport.config.js';
import db from '../models/index.js';
import { hashPassword } from '../utils/bcrypt.utils.js';
import { generateWebSocketToken } from '../utils/websocket.utils.js';
const { User } = db;


export async function login(req, res, next) {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({ message: 'Login failed' });
    }
    req.logIn(user, (err) => {
      if (err) return next(err);
      const wsToken = generateWebSocketToken(user);
      return res.json({ message: 'Login successful', wsToken });
    });
  })(req, res, next);
}

export async function googleLogin(req, res, next) {
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })(req, res, next);
}

export async function googleCallback(req, res, next) {
  passport.authenticate('google', (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({ message: 'Authentication failed' });
    }
    req.logIn(user, (err) => {
      if (err) return next(err);
      const wsToken = generateWebSocketToken(user);
      return res.json({ message: 'Login successful', wsToken });
    });
  })(req, res, next);
}

export async function logout(req, res) {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect('/');
  });
};

export async function register(req, res) {
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

    if (role === 'admin') {
      await newUser.update({ gymId: newUser.id });
    }

    res.status(201).json({ message: 'User created successfully', user: newUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating user' });
  }
};
