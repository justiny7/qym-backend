// src/routes/machine.routes.js
import { Router } from 'express'
import MachineController from '../controllers/machine.controller.js';
import { roleAuthenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Admin routes
router.post('/machines', roleAuthenticate(['admin']), MachineController.createMachine);
router.get('/machines/:id', roleAuthenticate(['admin']), MachineController.getMachineById);
router.get('/machines', roleAuthenticate(['admin']), MachineController.getAllMachines);
router.put('/machines/:id', roleAuthenticate(['admin']), MachineController.updateMachine);
router.delete('/machines/:id', roleAuthenticate(['admin']), MachineController.deleteMachine);

router.get('/machines/:id/workout-logs', roleAuthenticate(['admin']), MachineController.getMachineWorkoutLogs);

// Shared routes
router.post('/machines/:id/workout-logs', roleAuthenticate(['admin', 'user']), MachineController.tagOn);
router.put('/machines/:id/workout-logs', roleAuthenticate(['admin', 'user']), MachineController.tagOff);

router.get('/machines/:id/queue', MachineController.poll);
router.post('/machines/:id/queue', MachineController.enqueue);
router.delete('/machines/:id/queue', MachineController.dequeue);

export default router;
