// src/controllers/machine.controller.js
const MachineService = require('../services/machine.service');

class MachineController {
  async createMachine(req, res) {
    try {
      const machine = await MachineService.createMachine(req.body);
      res.status(201).json(machine);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async getMachineById(req, res) {
    try {
      const machine = await MachineService.getMachineById(req.params.id);
      if (machine) {
        res.status(200).json(machine);
      } else {
        res.status(404).json({ message: 'Machine not found' });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async getAllMachines(req, res) {
    try {
      const machines = await MachineService.getAllMachines();
      res.status(200).json(machines);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async updateMachine(req, res) {
    try {
      const updated = await MachineService.updateMachine(req.params.id, req.body);
      if (updated) {
        res.status(200).json({ message: 'Machine updated successfully' });
      } else {
        res.status(404).json({ message: 'Machine not found' });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async deleteMachine(req, res) {
    try {
      const deleted = await MachineService.deleteMachine(req.params.id);
      if (deleted) {
        res.status(200).json({ message: 'Machine deleted successfully' });
      } else {
        res.status(404).json({ message: 'Machine not found' });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = new MachineController();
