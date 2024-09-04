// src/routes/machine.routes.js
const express = require('express');
const router = express.Router();
const MachineController = require('../controllers/machine.controller');

// Define machine routes
router.post('/machines', MachineController.createMachine);
router.get('/machines/:id', MachineController.getMachineById);
router.get('/machines', MachineController.getAllMachines);
router.put('/machines/:id', MachineController.updateMachine);
router.delete('/machines/:id', MachineController.deleteMachine);

module.exports = router;
