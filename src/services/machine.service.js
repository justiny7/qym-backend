// src/services/machine.service.js
import db from '../models/index.js';
import * as WS from '../websocket.js';
import * as UserService from './user.service.js';
import TimerService from './timer.service.js';
import { Op } from 'sequelize';
import { getMachineData, updateMachineData } from './redis.service.js';
const { Machine, WorkoutLog, User, WorkoutSet, QueueItem, MachineReport } = db;

const getPostgresMachineData = async (machineId) => {
  try {
    const machine = await Machine.findByPk(machineId);
    const workoutLog = await WorkoutLog.findOne({
      where: { machineId },
      order: [['timeOfTagOn', 'DESC']],
    });
    const queueSize = await QueueItem.count({ where: { machineId } });
    const lastTenLogs = await WorkoutLog.findAll({
      where: { machineId, timeOfTagOff: { [Op.not]: null } },
      order: [['timeOfTagOn', 'DESC']],
      limit: 10,
      attributes: ['timeOfTagOn', 'timeOfTagOff']
    });
    const lastTenSessions = lastTenLogs.map(log => {
      const duration = log.timeOfTagOff - log.timeOfTagOn;
      return duration;
    });
    const averageUsageTime = lastTenSessions.reduce((acc, duration) => {
      return acc + duration;
    }, 0) / lastTenSessions.length;

    return {
      currentWorkoutLogId: workoutLog ? workoutLog.id : null,
      queueSize,
      averageUsageTime: averageUsageTime,
      lastTenSessions: lastTenSessions,
      maximumSessionDuration: machine.maximumSessionDuration,
      maximumQueueSize: machine.maximumQueueSize
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Creates a new machine.
 * @param {string} gymId - The ID of the gym.
 * @param {Object} machineData - The data for the new machine.
 * @returns {Promise<Machine>} - The created machine.
 */
export async function createMachine(gymId, machineData) {
  try {
    const machine = await Machine.create({ ...machineData, gymId });
    WS.broadcastMachineUpdates(gymId, machine.id, machine);
    return machine;
  } catch (error) {
    throw new Error(`Error creating machine: ${error.message}`);
  }
}

/**
 * Retrieves a machine by its ID.
 * @param {string} gymId - The ID of the gym.
 * @param {string} id - The ID of the machine.
 * @returns {Promise<Machine>} - The machine with the specified ID.
 */
export async function getMachineById(gymId, id) {
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

/**
 * Updates a machine by its ID.
 * @param {string} gymId - The ID of the gym.
 * @param {string} id - The ID of the machine.
 * @param {Object} updateData - The data to update.
 * @returns {Promise<Machine>} - The updated machine.
 */
export async function updateMachine(gymId, id, updateData) {
  try {
    const [updated] = await Machine.update(updateData, {
      where: { id, gymId },
    });
    if (!updated) {
      throw new Error('Machine not found');
    }

    WS.broadcastMachineUpdates(gymId, id, updateData);
    return await getMachineById(gymId, id);
  } catch (error) {
    throw new Error(`Error updating machine: ${error.message}`);
  }
}

/**
 * Deletes a machine by its ID.
 * @param {string} gymId - The ID of the gym.
 * @param {string} id - The ID of the machine.
 * @returns {Promise<string>} - A message indicating the machine has been deleted.
 */
export async function deleteMachine(gymId, id) {
  try {
    const deleted = await Machine.destroy({
      where: { id, gymId },
    });

    if (!deleted) {
      throw new Error('Machine not found');
    }

    WS.broadcastMachineUpdates(gymId, id, null);
    return `Machine has been deleted`;
  } catch (error) {
    throw new Error(`Error deleting machine: ${error.message}`);
  }
}

/**
 * Retrieves all machines for a gym.
 * @param {string} gymId - The ID of the gym.
 * @returns {Promise<Array>} - A list of all machines in the gym.
 */
export async function getAllMachines(gymId) {
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
export async function getMachineWorkoutLogs(gymId, machineId) {
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
export async function getMachineWorkoutLogById(gymId, machineId, logId) {
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
export async function tagOn(userId, machineId, gymId) {
  const transaction = await db.sequelize.transaction({
    isolationLevel: db.Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED
  });

  try {
    // Find the user and machine
    // const user = await User.findByPk(userId, { attributes: ['id', 'currentWorkoutLogId'], transaction });
    const currentWorkoutLogId = await UserService.getUserCurrentWorkoutLogId(userId);
    const machine = await Machine.findOne({
      where: { id: machineId, gymId },
      attributes: ['id', 'currentWorkoutLogId', 'maximumSessionDuration', 'queueSize'],
      transaction
    });
    
    // Ensure machine exists and are not tagged on
    if (!machine) {
      throw new Error('Invalid user or machine.');
    }

    // If machine is already tagged on, throw error
    if (machine.currentWorkoutLogId) {
      throw new Error('Machine already tagged on.');
    }

    // If machine has a queue, check if user is first in queue
    let dequeueUser = false;
    if (machine.queueSize > 0) {
      const firstInQueue = await getFirstInQueue(machineId);
      if (firstInQueue.userId !== userId) {
        throw new Error('User is not first in queue.');
      } else {
        dequeueUser = true;
        machine.queueSize -= 1;
      }
    }

    // If user is already tagged on, tag off first
    if (currentWorkoutLogId) {
      const currentWorkoutLog = await WorkoutLog.findByPk(currentWorkoutLogId, { transaction });
      await tagOff(userId, currentWorkoutLog.machineId, gymId);
    }

    // Create a new workout log
    const workoutLog = await WorkoutLog.create({
      userId,
      machineId,
      timeOfTagOn: new Date(),
    }, { transaction });

    
    // Update the user and machine with the current workout log ID
    await UserService.setUserCurrentWorkoutLogId(userId, workoutLog.id);
    await machine.update({ currentWorkoutLogId: workoutLog.id }, { transaction });

    await transaction.commit();
    
    await TimerService.setTimer(userId, 'machineTagOff', { machineId, gymId }, machine.maximumSessionDuration);
    await TimerService.setTimer(userId, 'gymSessionEnding', { gymId }, 60 * 60 * 1000); // 1 hour
    WS.broadcastMachineUpdates(gymId, machine.id, machine);
    WS.sendUserUpdate(userId, { currentWorkoutLogId: workoutLog.id });
    if (dequeueUser) {
      await UserService.dequeue(gymId, userId); // Delay dequeue until after transaction commit
      WS.clearCountdown(userId);
    }

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
export async function tagOff(userId, machineId, gymId) {
  const transaction = await db.sequelize.transaction({
    isolationLevel: db.Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED
  });

  try {
    // Find the user and machine
    const currentWorkoutLogId = await UserService.getUserCurrentWorkoutLogId(userId);
    // const user = await User.findByPk(userId, { attributes: ['id', 'currentWorkoutLogId'], transaction });
    const machine = await Machine.findOne({
      where: { id: machineId, gymId },
      attributes: ['id', 'currentWorkoutLogId', 'maximumSessionDuration', 'lastTenSessions'],
      transaction
    });

    // Ensure machine exists and has the same active workout log as user
    if (!machine || currentWorkoutLogId !== machine.currentWorkoutLogId) {
      throw new Error('Invalid user or machine for tagging off or current user and machine logs don\'t match.');
    }

    // Find the active workout log
    const workoutLog = await WorkoutLog.findByPk(currentWorkoutLogId, { transaction });
    if (!workoutLog) {
      throw new Error('No active workout log found for tagging off.');
    }

    // Update the log with the tag off time
    await workoutLog.update({ timeOfTagOff: new Date() }, { transaction });

    // Calculate the duration of workout and update machine's last ten sessions (has to last at least a minute)
    const workoutDuration = workoutLog.timeOfTagOff - workoutLog.timeOfTagOn;
    if (workoutDuration >= 60 * 1000 && workoutDuration <= machine.maximumSessionDuration) {
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
    await UserService.setUserCurrentWorkoutLogId(userId, null);
    await machine.update({ currentWorkoutLogId: null }, { transaction });

    await transaction.commit();

    await TimerService.clearTimer(userId, 'machineTagOff');
    WS.broadcastMachineUpdates(gymId, machineId, machine);
    WS.sendUserUpdate(userId, { currentWorkoutLogId: null });
    WS.broadcastQueueUpdate(gymId, machineId);
    WS.clearMachineTagOffCountdown(userId);

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
export async function enqueue(userId, machineId, gymId) {
  try {
    // Check if the user already has a queueItem
    const queueItem = await QueueItem.findOne({ where: { userId } });
    if (queueItem) {
      throw new Error('User is already in a queue.');
    }

    // Check if machine queue capacity is reached
    const machine = await Machine.findOne({
      where: { id: machineId, gymId },
      attributes: ['id', 'queueSize', 'maximumQueueSize', 'currentWorkoutLogId'],
    });
    if (!machine) {
      throw new Error('Machine not found.');
    }
    if (!machine.currentWorkoutLogId && machine.queueSize === 0) {
      throw new Error('Machine is open.');
    }
    if (machine.queueSize >= machine.maximumQueueSize) {
      throw new Error('Queue is full.');
    }

    // Create a new QueueItem for the machine
    const newQueueItem = await QueueItem.create({ userId, machineId });
    await machine.update({ queueSize: machine.queueSize + 1 });
    WS.broadcastMachineUpdates(gymId, machineId, { queueSize: machine.queueSize });
    WS.broadcastQueueUpdate(gymId, machineId);

    return newQueueItem;
  } catch (error) {
    throw error;
  }
}

/**
 * Gets the first item in the queue for a machine.
 * @param {string} machineId - The ID of the machine.
 * @returns {Promise<Object>} - The first queue item.
 */
export async function getFirstInQueue(machineId) {
  try {
    const firstInQueue = await QueueItem.findOne({
      where: { machineId },
      order: [['timeEnqueued', 'ASC'], ['id', 'ASC']],
    });
    return firstInQueue;
  } catch (error) {
    throw error;
  }
}

/**
 * Gets all queue items for a machine.
 * @param {string} gymId - The ID of the gym.
 * @param {string} machineId - The ID of the machine.
 */
export async function getQueue(gymId, machineId) {
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
 * Retrieves all reports for a machine.
 * @param {string} gymId - The ID of the gym.
 * @param {string} machineId - The ID of the machine.
 * @returns {Promise<Array>} - A list of machine reports.
 */
export async function getMachineReports(gymId, machineId) {
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
export async function getMachineReportById(gymId, machineId, reportId) {
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
export async function createMachineReport(gymId, machineId, reportData) {
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
export async function updateMachineReport(gymId, machineId, reportId, updateData) {
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