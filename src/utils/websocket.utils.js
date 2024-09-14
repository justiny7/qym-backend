// src/utils/websocket.utils.js
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export function generateWebSocketToken(user) {
  return jwt.sign({ id: user.id, gymId: user.gymId }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

export function verifyWebSocketToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
}
