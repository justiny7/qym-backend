// src/controllers/machine.controller.js
import { createMachine, getAllMachines, getMachineById, updateMachine, deleteMachine } from '../services/machine.service.js';

class MachineController {
  async createMachine(req, res) {
    try {
      const machine = await createMachine(req.body);
      res.status(201).json(machine);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async getMachineById(req, res) {
    try {
      const machine = await getMachineById(req.params.id);
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
      const machines = await getAllMachines();
      res.status(200).json(machines);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async updateMachine(req, res) {
    try {
      const updated = await updateMachine(req.params.id, req.body);
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
      const deleted = await deleteMachine(req.params.id);
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

export default new MachineController();
