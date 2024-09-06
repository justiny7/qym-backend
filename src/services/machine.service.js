// src/services/machine.service.js
import db from '../models/index.js';
const { Machine, WorkoutLog, User, WorkoutSet, QueueItem } = db;

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


  /**
   * Handles tagging on a user to a machine, creating a new workout log.
   * @param {string} userId - The ID of the user.
   * @param {string} machineId - The ID of the machine.
   * @returns {Promise<Object>} - The created WorkoutLog object.
   */
  static async tagOn(userId, machineId) {
    const transaction = await db.sequelize.transaction({
      isolationLevel: db.Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED
    });

    try {
      // Find the user and machine
      const user = await User.findByPk(userId, { attributes: ['currentWorkoutLogId'], transaction });
      const machine = await Machine.findByPk(machineId, {
        attributes: ['currentWorkoutLogId' , 'maximumSessionDuration'],
        transaction
      });
      
      // Ensure both user and machine exist and are not tagged on
      if (!user || !machine) {
        throw new Error('Invalid user or machine.');
      }

      // If machine is already tagged on, tag off if session exceeds maximum duration
      if (machine.currentWorkoutLogId) {
        const currentWorkoutLog = await WorkoutLog.findByPk(machine.currentWorkoutLogId, { transaction });
        const now = new Date();
        if ((now - currentWorkoutLog.timeOfTagOn) / 1000 <= machine.maximumSessionDuration) {
          throw new Error('Machine already tagged on.');
        } else {
          await this.tagOff(currentWorkoutLog.userId, machineId);
        }
      }

      // If user is already tagged on, tag off first
      if (user.currentWorkoutLogId) {
        const currentWorkoutLog = await WorkoutLog.findByPk(user.currentWorkoutLogId, { transaction });
        await this.tagOff(userId, currentWorkoutLog.machineId);
      }

      // Create a new workout log
      const workoutLog = await WorkoutLog.create({
        userId,
        machineId,
        timeOfTagOn: new Date(),
      }, { transaction });

      // Update the user and machine with the current workout log ID
      await User.update(
        { currentWorkoutLogId: workoutLog.id },
        { where: { id: userId }, transaction }
      );
      await Machine.update(
        { currentWorkoutLogId: workoutLog.id },
        { where: { id: machineId }, transaction }
      );

      await transaction.commit();
      return workoutLog;
    } catch (error) {
      await transaction.rollback();
      console.error('Error during tag on:', error);
      throw new Error('Could not tag on to the machine.');
    }
  }

  /**
   * Handles tagging off a user from a machine, updating the workout log.
   * @param {string} userId - The ID of the user.
   * @param {string} machineId - The ID of the machine.
   * @returns {Promise<Object>} - The updated WorkoutLog object.
   */
  static async tagOff(userId, machineId) {
    const transaction = await db.sequelize.transaction({
      isolationLevel: db.Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED
    });

    try {
      // Find the user and machine
      const user = await User.findByPk(userId, { attributes: ['currentWorkoutLogId'], transaction });
      const machine = await Machine.findByPk(machineId, {
        attributes: ['currentWorkoutLogId', 'maximumSessionDuration', 'lastTenSessions'],
        transaction
      });

      // Ensure both user and machine exist and have the same active workout log
      if (!user || !machine || user.currentWorkoutLogId !== machine.currentWorkoutLogId) {
        throw new Error('Invalid user or machine for tagging off or current user and machine logs don\'t match.');
      }

      // Find the active workout log
      const workoutLog = await WorkoutLog.findByPk(user.currentWorkoutLogId, { transaction });
      if (!workoutLog) {
        throw new Error('No active workout log found for tagging off.');
      }

      // Update the log with the tag off time
      workoutLog.timeOfTagOff = new Date();
      await workoutLog.save({ transaction });

      // Calculate the duration of workout and update machine's last ten sessions
      const workoutDuration = (workoutLog.timeOfTagOff - workoutLog.timeOfTagOn) / 1000;
      if (workoutDuration >= 60 && workoutDuration <= machine.maximumSessionDuration) {
        let lastTenSessions = [...machine.lastTenSessions];
        lastTenSessions.shift();
        lastTenSessions.push(workoutDuration);
        const averageUsageTime = lastTenSessions.reduce((acc, duration) => acc + duration, 0) / 10;

        await Machine.update(
          { lastTenSessions, averageUsageTime },
          { where: { id: machineId }, transaction }
        );
      }
 
      // Clear the current workout log ID on the user and machine
      await User.update(
        { currentWorkoutLogId: null },
        { where: { id: userId }, transaction }
      );
      await Machine.update(
        { currentWorkoutLogId: null },
        { where: { id: machineId }, transaction }
      );

      await transaction.commit();
      return workoutLog;
    } catch (error) {
      await transaction.rollback();
      console.error('Error during tag off:', error);
      throw new Error('Could not tag off from the machine.');
    }
  }


  /**
   * Retrieves the first item in a machine's queue based on creation time.
   * @param {string} machineId - The ID of the machine.
   * @returns {Promise<Object|null>} - The first queue item, or null if no item exists.
   */
  static async poll(machineId) {
    try {
      const firstInQueue = await QueueItem.findOne({
        where: { machineId },
        order: [['timeEnqueued', 'ASC']],  // Order by creation time
        include: [{ model: User, as: 'user' }]  // Include user details
      });

      return firstInQueue || null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Removes the first item in the queue for a machine.
   * @param {string} machineId - The ID of the machine.
   * @returns {Promise<void>} - Resolves when the first queue item is removed.
   */
  static async dequeue(machineId) {
    try {
      // Find the first item in the queue
      const firstInQueue = await QueueItem.findOne({
        where: { machineId },
        order: [['timeEnqueued', 'ASC']],
      });

      if (!firstInQueue) {
        throw new Error('Queue is empty.');
      }

      // Remove the first queue item
      await firstInQueue.destroy();
    } catch (error) {
      throw error;
    }
  }
}

export default MachineService;
