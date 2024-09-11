// src/routes/machine.routes.js
import { Router } from 'express'
import MachineController from '../controllers/machine.controller.js';
import { authUser, authMachine } from '../middleware/auth.middleware.js';

const router = Router();

// Admin routes (TODO: remove user from getAllMachines)
router.post('/machines', authUser(['admin']), MachineController.createMachine);
router.put('/machines/:id', authUser(['admin']), MachineController.updateMachine);
router.delete('/machines/:id', authUser(['admin']), MachineController.deleteMachine);

router.get('/machines/:id/workout-logs', authUser(['admin']), MachineController.getMachineWorkoutLogs);

// Shared routes
router.get('/machines', authUser(['admin', 'user']), MachineController.getAllMachines);
router.get('/machines/:id', authUser(['admin', 'user']), MachineController.getMachineById);

// User routes
router.post('/machines/:id/workout-logs', authUser(['user']), MachineController.tagOn);
router.patch('/machines/:id/workout-logs/current', authUser(['user']), MachineController.tagOff);

router.post('/machines/:id/queue', authUser(['user']), MachineController.enqueue);

// Internal routes
router.get('/machines/:id/queue/first', authMachine(), MachineController.getAndMarkFirst);
router.delete('/machines/:id/queue/first', authMachine(), MachineController.dequeue);

export default router;
