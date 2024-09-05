// src/services/machine.service.js
import db from '../models/index.js';
const { Machine, WorkoutLog, User, WorkoutSet } = db;

class MachineService {
  // Create a new machine
  static async createMachine(machineData) {
    try {
      const machine = await Machine.create(machineData);
      return machine;
    } catch (error) {
      throw new Error(`Error creating machine: ${error.message}`);
    }
  }

  // Get a machine by ID
  static async getMachineById(id) {
    try {
      const machine = await Machine.findByPk(id);
      if (!machine) {
        throw new Error('Machine not found');
      }

      return machine;
    } catch (error) {
      throw new Error(`Error retrieving machine: ${error.message}`);
    }
  }

  // Update a machine by ID
  static async updateMachine(id, updateData) {
    try {
      const [updated] = await Machine.update(updateData, {
        where: { id },
      });

      if (!updated) {
        throw new Error('Machine not found');
      }

      return await this.getMachineById(id);
    } catch (error) {
      throw new Error(`Error updating machine: ${error.message}`);
    }
  }

  // Delete a machine by ID
  static async deleteMachine(id) {
    try {
      const deleted = await Machine.destroy({
        where: { id },
      });

      if (!deleted) {
        throw new Error('Machine not found');
      }

      return `Machine with ID ${id} has been deleted`;
    } catch (error) {
      throw new Error(`Error deleting machine: ${error.message}`);
    }
  }

  // Get all machines
  static async getAllMachines() {
    try {
      const machines = await Machine.findAll();
      return machines;
    } catch (error) {
      throw new Error(`Error fetching machines: ${error.message}`);
    }
  }

  /**
   * Retrieves a machine's workout logs along with the user and workout sets for each log.
   * @param {string} machineId - The ID of the machine.
   * @returns {Promise<Array>} - A list of workout logs associated with the machine.
   */
  static async getMachineWorkoutLogs(machineId) {
    try {
      // Find the machine with its associated workout logs
      const machineWithLogs = await Machine.findOne({
        where: { id: machineId },
        include: [
          {
            model: WorkoutLog,
            as: 'workoutLogs',
            include: [
              { model: User, as: 'user' },  // Include user information
              { model: WorkoutSet, as: 'workoutSets' },  // Include associated workout sets
            ],
          },
        ],
      });

      if (!machineWithLogs) {
        throw new Error('Machine not found');
      }

      return machineWithLogs.workoutLogs;
    } catch (error) {
      console.error('Error fetching machine workout logs:', error);
      throw error;
    }
  }
}

export default MachineService;
