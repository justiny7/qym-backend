// src/config/passports.config.js
import passport from 'passport';
import LocalStrategy from 'passport-local';
import GoogleStrategy from 'passport-google-oauth20';
import { comparePassword } from '../utils/bcrypt.utils.js';

import dotenv from 'dotenv';
dotenv.config(); // Load environment variables

import db from '../models/index.js';
const { User } = db;

// Local Strategy
passport.use(new LocalStrategy(
  { usernameField: 'email' },
  async (email, password, done) => {
    try {
      const user = await User.findOne({
        where: { email },
        attributes: { include: ['password'] }
      });
      if (!user) {
        return done(null, false, { message: 'No user found with this email.' });
      }
      if (!user.password) {
        return done(null, false, { message: 'Please login with Google.' });
      }

      const isMatch = await comparePassword(password, user.password);
      if (!isMatch) {
        return done(null, false, { message: 'Incorrect password.' });
      }

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

// Google Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/auth/google/callback',
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const userEmail = profile.emails[0].value;
    let user = await User.findOne({ where: { email: userEmail } });
    if (!user) {
      user = await User.create({
        name: profile.displayName,
        googleId: profile.id,
        email: userEmail
      });
    } else if (!user.googleId) {
      await user.update({ googleId: profile.id });
    }
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

// Serialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

export default passport;
