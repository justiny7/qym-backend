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

// User routes
router.get('/workout-logs', authUser(['user']), UserController.getUserWorkoutLogs);
router.get('/workout-logs/:id', authUser(['user']), UserController.getUserWorkoutLogById);
router.put('/workout-logs/:id/', authUser(['user']), UserController.updateWorkoutLogWithSets);
router.patch('/workout-logs/:id', authUser(['user']), UserController.disassociateWorkoutLog);

// router.get('/queue', authUser(['user']), UserController.getQueueSpot);
router.delete('/queue', authUser(['user']), UserController.dequeue);

router.patch('/gyms/:id', authUser(['user']), UserController.toggleGymSession);


export default router;
