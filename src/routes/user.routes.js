// src/routes/user.routes.js
import { Router } from 'express'
import UserController from '../controllers/user.controller.js';
import { roleAuthenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Admin routes (TODO: change to limit view access)
router.get('/users', roleAuthenticate(['admin']), UserController.getAllUsers);
router.post('/users', roleAuthenticate(['admin']), UserController.createUser);
router.get('/users/:id', roleAuthenticate(['admin']), UserController.getUserById);
router.put('/users/:id', roleAuthenticate(['admin']), UserController.updateUser);
router.delete('/users/:id', roleAuthenticate(['admin']), UserController.deleteUser);

// Shared routes
router.get('/profile', roleAuthenticate(['admin', 'user']), UserController.getUserById);
router.post('/profile', roleAuthenticate(['admin', 'user']), UserController.updateUser);
router.delete('/profile', roleAuthenticate(['admin', 'user']), UserController.deleteUser);
// router.get('/dashboard', roleAuthenticate(['admin', 'user']), UserController.getDashboard);
router.get('/workout-logs', roleAuthenticate(['admin', 'user']), UserController.getUserWorkoutLogs);
router.patch('/workout-logs/:id', roleAuthenticate(['admin', 'user']), UserController.disassociateWorkoutLog);
router.delete('/queue', roleAuthenticate(['admin', 'user']), UserController.dequeue);


export default router;
