// src/auth.routes.js
import { Router } from 'express';
import AuthController from '../controllers/auth.controller.js';

const router = Router();

router.post('/login', AuthController.login);
router.post('/register', AuthController.register);
router.get('/auth/google', AuthController.googleLogin);
router.get('/auth/google/callback', AuthController.googleCallback);
router.post('/logout', AuthController.logout);

export default router;
