// src/services/machine.service.js
import db from '../models/index.js';
import { broadcastMachineUpdates, sendUserUpdate, sendQueueUpdate, broadcastQueueUpdate } from '../websocket.js';
const { Machine, WorkoutLog, User, WorkoutSet, QueueItem, MachineReport } = db;

class MachineService {
  // Create a new machine
  static async createMachine(gymId, machineData) {
    try {
      const machine = await Machine.create({ ...machineData, gymId });
      broadcastMachineUpdates(gymId, machine.id, machine);
      return machine;
    } catch (error) {
      throw new Error(`Error creating machine: ${error.message}`);
    }
  }

  // Get a machine by ID
  static async getMachineById(gymId, id) {
    try {
      const machine = await Machine.findOne({ where: { id, gymId } });
      if (!machine) {
        throw new Error('Machine not found');
      }

      return machine;
    } catch (error) {
      throw new Error(`Error retrieving machine: ${error.message}`);
    }
  }

  // Update a machine by ID
  static async updateMachine(gymId, id, updateData) {
    try {
      const [updated] = await Machine.update(updateData, {
        where: { id, gymId },
      });
      if (!updated) {
        throw new Error('Machine not found');
      }

      broadcastMachineUpdates(gymId, id, updateData);
      return await this.getMachineById(gymId, id);
    } catch (error) {
      throw new Error(`Error updating machine: ${error.message}`);
    }
  }

  // Delete a machine by ID
  static async deleteMachine(gymId, id) {
    try {
      const deleted = await Machine.destroy({
        where: { id, gymId },
      });

      if (!deleted) {
        throw new Error('Machine not found');
      }

      broadcastMachineUpdates(gymId, id, null);
      return `Machine has been deleted`;
    } catch (error) {
      throw new Error(`Error deleting machine: ${error.message}`);
    }
  }

  // Get all machines
  static async getAllMachines(gymId) {
    try {
      const machines = await Machine.findAll({ where: { gymId } });
      return machines;
    } catch (error) {
      throw new Error(`Error fetching machines: ${error.message}`);
    }
  }

  /**
   * Retrieves a machine's workout logs along with the user and workout sets for each log.
   * @param {string} gymId - The ID of the gym.
   * @param {string} machineId - The ID of the machine.
   * @returns {Promise<Array>} - A list of workout logs associated with the machine.
   */
  static async getMachineWorkoutLogs(gymId, machineId) {
    try {
      const machineWithLogs = await Machine.findOne({
        where: { id: machineId, gymId },
        attributes: [],
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
      throw error;
    }
  }

  /**
   * Retrieves a machine's workout log by ID along with the user and workout sets for the log.
   * @param {string} gymId - The ID of the gym.
   * @param {string} machineId - The ID of the machine.
   * @param {string} logId - The ID of the workout log.
   */
  static async getMachineWorkoutLogById(gymId, machineId, logId) {
    try {
      const workoutLog = await WorkoutLog.findOne({
        where: { id: logId, machineId },
        include: [
          {
            model: Machine,
            as: 'machine',
            where: { id: machineId, gymId },
            attributes: [],
          },
          { model: User, as: 'user' },
          { model: WorkoutSet, as: 'workoutSets' },
        ],
      });
      if (!workoutLog) {
        throw new Error('Workout log not found or machine does not belong to the gym');
      }

      return workoutLog;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Handles tagging on a user to a machine, creating a new workout log.
   * @param {string} userId - The ID of the user.
   * @param {string} machineId - The ID of the machine.
   * @param {string} gymId - The ID of the gym.
   * @returns {Promise<Object>} - The created WorkoutLog object.
   */
  static async tagOn(userId, machineId, gymId) {
    const transaction = await db.sequelize.transaction({
      isolationLevel: db.Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED
    });

    try {
      // Find the user and machine
      const user = await User.findByPk(userId, { attributes: ['id', 'currentWorkoutLogId'], transaction });
      const machine = await Machine.findOne({
        where: { id: machineId, gymId },
        attributes: ['id', 'currentWorkoutLogId', 'maximumSessionDuration'],
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
          await this.tagOff(currentWorkoutLog.userId, machineId, gymId);
        }
      }

      // If user is already tagged on, tag off first
      if (user.currentWorkoutLogId) {
        const currentWorkoutLog = await WorkoutLog.findByPk(user.currentWorkoutLogId, { transaction });
        await this.tagOff(userId, currentWorkoutLog.machineId, gymId);
      }

      // Create a new workout log
      const workoutLog = await WorkoutLog.create({
        userId,
        machineId,
        timeOfTagOn: new Date(),
      }, { transaction });

      
      // Update the user and machine with the current workout log ID
      await user.update({ currentWorkoutLogId: workoutLog.id }, { transaction });
      await machine.update({ currentWorkoutLogId: workoutLog.id }, { transaction });

      await transaction.commit();
      broadcastMachineUpdates(gymId, machine.id, machine);
      sendUserUpdate(userId, { currentWorkoutLogId: workoutLog.id });

      return workoutLog;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Handles tagging off a user from a machine, updating the workout log.
   * @param {string} userId - The ID of the user.
   * @param {string} machineId - The ID of the machine.
   * @param {string} gymId - The ID of the gym.
   * @returns {Promise<Object>} - The updated WorkoutLog object.
   */
  static async tagOff(userId, machineId, gymId) {
    const transaction = await db.sequelize.transaction({
      isolationLevel: db.Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED
    });

    try {
      // Find the user and machine
      const user = await User.findByPk(userId, { attributes: ['id', 'currentWorkoutLogId'], transaction });
      const machine = await Machine.findOne({
        where: { id: machineId, gymId },
        attributes: ['id', 'currentWorkoutLogId', 'maximumSessionDuration', 'lastTenSessions'],
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
      await workoutLog.update({ timeOfTagOff: new Date() }, { transaction });

      // Calculate the duration of workout and update machine's last ten sessions
      const workoutDuration = (workoutLog.timeOfTagOff - workoutLog.timeOfTagOn) / 1000;
      if (workoutDuration >= 60 && workoutDuration <= machine.maximumSessionDuration) {
        let lastTenSessions = [...machine.lastTenSessions];
        lastTenSessions.shift();
        lastTenSessions.push(workoutDuration);
        const averageUsageTime = lastTenSessions.reduce((acc, duration) => acc + duration, 0) / 10;

        await machine.update({
          lastTenSessions,
          averageUsageTime,
        }, { transaction });
      }
 
      // Clear the current workout log ID on the user and machine
      await user.update({ currentWorkoutLogId: null }, { transaction });
      await machine.update({ currentWorkoutLogId: null }, { transaction });

      await transaction.commit();
      broadcastMachineUpdates(gymId, machine.id, machine);
      sendUserUpdate(userId, { currentWorkoutLogId: null });

      return workoutLog;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Adds a user to a machine's queue. Ensures a user can only be in one queue.
   * @param {string} userId - The ID of the user.
   * @param {string} machineId - The ID of the machine.
   * @param {string} gymId - The ID of the gym.
   * @returns {Promise<Object>} - The newly created QueueItem.
   */
  static async enqueue(userId, machineId, gymId) {
    try {
      // Check if the user already has a queueItem
      const queueItem = await QueueItem.findOne({ where: { userId } });
      if (queueItem) {
        throw new Error('User is already in a queue.');
      }

      // Check if machine queue capacity is reached
      const machine = await Machine.findOne({
        where: { id: machineId, gymId },
        attributes: ['id', 'queueSize', 'maximumQueueSize'],
      });
      if (!machine) {
        throw new Error('Machine not found.');
      }

      if (machine.queueSize >= machine.maximumQueueSize) {
        throw new Error('Queue is full.');
      }

      // Create a new QueueItem for the machine
      const newQueueItem = await QueueItem.create({ userId, machineId });
      await machine.update({ queueSize: machine.queueSize + 1 });
      broadcastMachineUpdates(gymId, machineId, { queueSize: machine.queueSize });
      broadcastQueueUpdate(gymId, machineId);

      return newQueueItem;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Gets all queue items for a machine.
   * @param {string} gymId - The ID of the gym.
   * @param {string} machineId - The ID of the machine.
   */
  static async getQueue(gymId, machineId) {
    try {
      const machine = await Machine.findOne({
        where: { id: machineId, gymId },
        attributes: ['id'],
      });
      if (!machine) {
        throw new Error('Machine not found.');
      }

      const queueItems = await QueueItem.findAll({
        where: { machineId },
        include: [{ model: User, as: 'user' }],
        order: [['timeEnqueued', 'ASC'], ['id', 'ASC']],
      });

      return queueItems;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Removes the first item in the queue for a machine.
   * @param {string} machineId - The ID of the machine.
   * @returns {Promise<void>} - Resolves when the first queue item is removed.
   */
  /*
  static async dequeue(machineId) {
    try {
      // Find the first item in the queue
      const firstInQueue = await QueueItem.findOne({
        where: { machineId },
        order: [['timeEnqueued', 'ASC'], ['id', 'ASC']],
      });
      if (!firstInQueue) {
        throw new Error('Queue is empty.');
      }

      // Remove the first queue item
      await firstInQueue.destroy();
      sendQueueUpdate(firstInQueue.userId, null);
    } catch (error) {
      throw error;
    }
  }
  */

  /**
   * Retrieves the first item in a machine's queue based on creation time. Updates timeReachedFront attribute.
   * @param {string} machineId - The ID of the machine.
   * @returns {Promise<Object|null>} - The first queue item, or null if no item exists.
   */
  /*
  static async getAndMarkFirst(machineId) {
    try {
      const firstInQueue = await QueueItem.findOne({
        where: { machineId },
        order: [['timeEnqueued', 'ASC'], ['id', 'ASC']],  // Order by creation time
        include: [{ model: User, as: 'user' }]  // Include user details
      });

      if (firstInQueue && firstInQueue.timeReachedFront === null) {
        await firstInQueue.update({ timeReachedFront: new Date() });
      }

      return firstInQueue || null;
    } catch (error) {
      throw error;
    }
  }
  */

  /**
   * Retrieves all reports for a machine.
   * @param {string} gymId - The ID of the gym.
   * @param {string} machineId - The ID of the machine.
   * @returns {Promise<Array>} - A list of machine reports.
   */
  static async getMachineReports(gymId, machineId) {
    try {
      const machineWithReports = await Machine.findOne({
        where: { id: machineId, gymId },
        attributes: [],
        include: [
          {
            model: MachineReport,
            as: 'machineReports',
          },
        ],
      });
      if (!machineWithReports) {
        throw new Error('Machine not found');
      }

      return machineWithReports.machineReports;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Retrieves a machine report by ID.
   * @param {string} gymId - The ID of the gym.
   * @param {string} machineId - The ID of the machine.
   * @param {string} reportId - The ID of the report.
   * @returns {Promise<Object>} - The machine report.
   */
  static async getMachineReportById(gymId, machineId, reportId) {
    try {
      const machineReport = await MachineReport.findOne({
        where: { id: reportId, machineId },
        include: [
          {
            model: Machine,
            as: 'machine',
            where: { id: machineId, gymId },
            attributes: [],
          },
        ],
      });
      if (!machineReport) {
        throw new Error('Machine report not found or machine does not belong to the gym');
      }

      return machineReport;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Creates a new machine report.
   * @param {string} gymId - The ID of the gym.
   * @param {string} machineId - The ID of the machine.
   * @param {Object} reportData - The report data.
   * @returns {Promise<Object>} - The new machine report.
   */
  static async createMachineReport(gymId, machineId, reportData) {
    try {
      const machine = await Machine.findOne({ where: { id: machineId, gymId } });
      if (!machine) {
        throw new Error('Machine not found');
      }

      const newReport = await MachineReport.create({ ...reportData, machineId });
      return newReport;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Updates a machine report by ID.
   * @param {string} gymId - The ID of the gym.
   * @param {string} machineId - The ID of the machine.
   * @param {string} reportId - The ID of the report.
   * @param {Object} updateData - The updated report data.
   */
  static async updateMachineReport(gymId, machineId, reportId, updateData) {
    try {
      const machineReport = await MachineReport.findOne({
        where: { id: reportId, machineId },
        include: [
          {
            model: Machine,
            as: 'machine',
            where: { id: machineId, gymId },
            attributes: [],
          },
        ],
      });
      if (!machineReport) {
        throw new Error('Machine report not found');
      }

      await machineReport.update(updateData);
      return machineReport;
    } catch (error) {
      throw error;
    }
  }
}

export default MachineService;
