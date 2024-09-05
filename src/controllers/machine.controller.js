// src/controllers/machine.controller.js
import MachineService from '../services/machine.service.js';

class MachineController {
  // Create a new machine
  static async createMachine(req, res) {
    try {
      const machineData = req.body;
      const newMachine = await MachineService.createMachine(machineData);
      res.status(201).json(newMachine);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get a machine by ID
  static async getMachineById(req, res) {
    try {
      const { id } = req.params;
      const machine = await MachineService.getMachineById(id);
      res.status(200).json(machine);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  // Update a machine by ID
  static async updateMachine(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const updatedMachine = await MachineService.updateMachine(id, updateData);
      res.status(200).json(updatedMachine);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Delete a machine by ID
  static async deleteMachine(req, res) {
    try {
      const { id } = req.params;
      const message = await MachineService.deleteMachine(id);
      res.status(200).json({ message });
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  // Get all machines
  static async getAllMachines(req, res) {
    try {
      const machines = await MachineService.getAllMachines();
      res.status(200).json(machines);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get a machine's workout logs
  static async getMachineWorkoutLogs(req, res) {
    try {
      const { id } = req.params;
      const workoutLogs = await MachineService.getMachineWorkoutLogs(id);
      res.status(200).json(workoutLogs);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }
}

export default MachineController;
