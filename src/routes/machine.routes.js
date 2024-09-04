// src/routes/machine.routes.js
import express from 'express'

const router = express.Router();
import MachineController from '../controllers/machine.controller.js';

// Define machine routes
router.post('/machines', MachineController.createMachine);
router.get('/machines/:id', MachineController.getMachineById);
router.get('/machines', MachineController.getAllMachines);
router.put('/machines/:id', MachineController.updateMachine);
router.delete('/machines/:id', MachineController.deleteMachine);

export default router;
