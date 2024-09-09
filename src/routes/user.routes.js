// src/routes/user.routes.js
import { Router } from 'express'
import UserController from '../controllers/user.controller.js';
import { roleAuthenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Admin routes (TODO: change to limit view access)
router.post('/users', roleAuthenticate(['admin']), UserController.createUser);
router.get('/users/:id', roleAuthenticate(['admin']), UserController.getUserById);
router.get('/users', roleAuthenticate(['admin', 'user']), UserController.getAllUsers);
router.put('/users/:id', roleAuthenticate(['admin']), UserController.updateUser);
router.delete('/users/:id', roleAuthenticate(['admin']), UserController.deleteUser);

// Shared routes
// router.get('/profile', roleAuthenticate(['admin', 'user']), UserController.getProfile);
// router.post('/dashboard', roleAuthenticate(['admin', 'user']), UserController.getDashboard);
router.get('/workout-logs', roleAuthenticate(['admin', 'user']), UserController.getUserWorkoutLogs);
router.delete('/queue', roleAuthenticate(['admin', 'user']), UserController.dequeue);


export default router;
