// src/routes/user.routes.js
import express from 'express'
import UserController from '../controllers/user.controller.js';

const router = express.Router();

router.post('/users', UserController.createUser);
router.get('/users/:id', UserController.getUserById);
router.get('/users', UserController.getAllUsers);
router.put('/users/:id', UserController.updateUser);
router.delete('/users/:id', UserController.deleteUser);

router.get('/users/:id/workout-logs', UserController.getUserWorkoutLogs);

router.delete('/users/:id/queue', UserController.dequeue);

export default router;
