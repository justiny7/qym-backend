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

export default router;
