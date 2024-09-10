// src/controllers/machine.controller.js
import MachineService from '../services/machine.service.js';

class MachineController {
  // Create a new machine
  static async createMachine(req, res) {
    try {
      const newMachine = await MachineService.createMachine(req.body);
      res.status(201).json(newMachine);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get a machine by ID
  static async getMachineById(req, res) {
    try {
      const machine = await MachineService.getMachineById(req.params.id);
      res.status(200).json(machine);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  // Update a machine by ID
  static async updateMachine(req, res) {
    try {
      const updatedMachine = await MachineService.updateMachine(req.params.id, req.body);
      res.status(200).json(updatedMachine);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Delete a machine by ID
  static async deleteMachine(req, res) {
    try {
      const message = await MachineService.deleteMachine(req.params.id);
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
      const workoutLogs = await MachineService.getMachineWorkoutLogs(req.params.id);
      res.status(200).json(workoutLogs);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }


  /**
   * Handles the HTTP request for tagging on to a machine.
   * @param {Object} req - The request object, containing userId in the body.
   * @param {Object} res - The response object.
   */
  static async tagOn(req, res) {
    try {
      const workoutLog = await MachineService.tagOn(req.user.id, req.params.id);
      res.status(201).json(workoutLog);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Handles the HTTP request for tagging off from a machine.
   * @param {Object} req - The request object, containing machineId and userId in the URI.
   * @param {Object} res - The response object.
   */
  static async tagOff(req, res) {
    try {
      const workoutLog = await MachineService.tagOff(req.user.id, req.params.id);
      res.status(200).json(workoutLog);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }


  /**
   * Retrieves the first item in a machine's queue. Updates the item's timeReachedFront.
   * @param {Object} req - The request object containing machineId.
   * @param {Object} res - The response object.
   */
  static async getAndMarkFirst(req, res) {
    try {
      const firstInQueue = await MachineService.getAndMarkFirst(req.params.id);
      if (!firstInQueue) {
        return res.status(404).json({ message: 'Queue is empty' });
      }
      res.status(200).json(firstInQueue);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Adds a user to a machine's queue (enqueue operation).
   * @param {Object} req - The request object containing userId and machineId.
   * @param {Object} res - The response object.
   */
  static async enqueue(req, res) {
    try {
      const queueItem = await MachineService.enqueue(req.user.id, req.params.id);
      res.status(201).json(queueItem);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Removes the first item in a machine's queue (dequeue operation).
   * @param {Object} req - The request object containing machineId.
   * @param {Object} res - The response object.
   */
  static async dequeue(req, res) {
    try {
      await MachineService.dequeue(req.params.id);
      res.status(200).json({ message: 'First item removed from queue' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

export default MachineController;
