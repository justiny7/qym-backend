// src/routes/machine.routes.js
import express from 'express'
import MachineController from '../controllers/machine.controller.js';

const router = express.Router();

router.post('/machines', MachineController.createMachine);
router.get('/machines/:id', MachineController.getMachineById);
router.get('/machines', MachineController.getAllMachines);
router.put('/machines/:id', MachineController.updateMachine);
router.delete('/machines/:id', MachineController.deleteMachine);

router.get('/machines/:id/workout-logs', MachineController.getMachineWorkoutLogs);
router.post('/machines/:id/workout-logs', MachineController.tagOn);
router.put('/machines/:id/workout-logs/:userId', MachineController.tagOff);

router.get('/machines/:id/queue', MachineController.poll);
router.post('/machines/:id/queue', MachineController.enqueue);
router.delete('/machines/:id/queue', MachineController.dequeue);

export default router;
