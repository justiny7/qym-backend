// src/routes/machine.routes.js
import { Router } from 'express'
import MachineController from '../controllers/machine.controller.js';
import { authUser, authMachine } from '../middleware/auth.middleware.js';

const router = Router();

// Admin routes (TODO: remove user from getAllMachines)
router.get('/machines', authUser(['admin', 'user']), MachineController.getAllMachines);
router.post('/machines', authUser(['admin']), MachineController.createMachine);
router.get('/machines/:id', authUser(['admin']), MachineController.getMachineById);
router.put('/machines/:id', authUser(['admin']), MachineController.updateMachine);
router.delete('/machines/:id', authUser(['admin']), MachineController.deleteMachine);

router.get('/machines/:id/workout-logs', authUser(['admin']), MachineController.getMachineWorkoutLogs);

// Shared routes
router.post('/machines/:id/workout-logs', authUser(['admin', 'user']), MachineController.tagOn);
router.patch('/machines/:id/workout-logs/current', authUser(['admin', 'user']), MachineController.tagOff);

router.get('/machines/:id/queue', authMachine(), MachineController.getAndMarkFirst);
router.post('/machines/:id/queue', authUser(['admin', 'user']), MachineController.enqueue);
router.delete('/machines/:id/queue', authMachine(), MachineController.dequeue);

export default router;
