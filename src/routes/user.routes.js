// src/routes/user.routes.js
import { Router } from 'express'
import UserController from '../controllers/user.controller.js';
import { authUser } from '../middleware/auth.middleware.js';

const router = Router();

// Admin routes (TODO: change to limit view access)
router.get('/users', authUser(['admin']), UserController.getAllUsers);
router.post('/users', authUser(['admin']), UserController.createUser);
router.get('/users/:id', authUser(['admin']), UserController.getUserById);
router.put('/users/:id', authUser(['admin']), UserController.updateUser);
router.delete('/users/:id', authUser(['admin']), UserController.deleteUser);

// Shared routes
router.get('/profile', authUser(['admin', 'user']), UserController.getUserById);
router.post('/profile', authUser(['admin', 'user']), UserController.updateUser);
router.delete('/profile', authUser(['admin', 'user']), UserController.deleteUser);
// router.get('/dashboard', authUser(['admin', 'user']), UserController.getDashboard);

router.get('/workout-logs', authUser(['admin', 'user']), UserController.getUserWorkoutLogs);
router.put('/workout-logs/:id/', authUser(['admin', 'user']), UserController.updateWorkoutLogWithSets);
router.patch('/workout-logs/:id', authUser(['admin', 'user']), UserController.disassociateWorkoutLog);

router.delete('/queue', authUser(['admin', 'user']), UserController.dequeue);


export default router;
