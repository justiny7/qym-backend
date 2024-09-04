// src/services/machine.service.js
import db from '../models/index.js';
const { Machine, WorkoutLog, User } = db;

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
      const machine = await Machine.findOne({
        where: { id },
        include: [
          {
            model: WorkoutLog,
            as: 'workoutLogs',
            include: [
              {
                model: User,
                as: 'user',
              },
            ],
          },
        ],
      });

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
      const machines = await Machine.findAll({
        include: [
          {
            model: WorkoutLog,
            as: 'workoutLogs',
            include: [
              {
                model: User,
                as: 'user',
              },
            ],
          },
        ],
      });
      return machines;
    } catch (error) {
      throw new Error(`Error fetching machines: ${error.message}`);
    }
  }

  // Get a machine's workout logs
  static async getMachineWorkoutLogs(id) {
    try {
      const machine = await this.getMachineById(id);
      return machine.workoutLogs;
    } catch (error) {
      throw new Error(`Error retrieving workout logs: ${error.message}`);
    }
  }
}

export default MachineService;
