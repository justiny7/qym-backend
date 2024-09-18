// src/services/user.service.js
import db from '../models/index.js';
import * as WS from '../websocket.js';
import { tagOff } from './machine.service.js';
const { User, WorkoutLog, Machine, WorkoutSet, QueueItem } = db;
import { sendTimerNotification } from '../websocket.js';
import TimerService from './timer.service.js';

/**
 * Creates a new user.
 * @param {Object} userData - The data for the new user.
 * @returns {Promise<User>} - The created user.
 */
export async function createUser(userData) {
  try {
    const newUser = await User.create(userData);
    return newUser;
  } catch (error) {
    throw error;
  }
}

/**
 * Gets a user by their ID.
 * @param {string} id - The ID of the user.
 * @returns {Promise<User>} - The user with the specified ID.
 */
export async function getUserById(id) {
  try {
    const user = await User.findByPk(id);
    if (!user) {
      throw new Error('User not found');
    }

    return user;
  } catch (error) {
    throw error;
  }
}

/**
 * Updates a user by their ID.
 * @param {string} id - The ID of the user.
 * @param {Object} updateData - The data to update.
 * @returns {Promise<User>} - The updated user.
 */
export async function updateUser(id, updateData) {
  try {
    const [updated] = await User.update(updateData, {
      where: { id },
    });

    if (!updated) {
      throw new Error('User not found');
    }

    return await getUserById(id);
  } catch (error) {
    throw error;
  }
}

/**
 * Deletes a user by their ID.
 * @param {string} id - The ID of the user.
 * @returns {Promise<string>} - A message indicating the user has been deleted.
 */
export async function deleteUser(id) {
  try {
    const deleted = await User.destroy({
      where: { id },
    });

    if (!deleted) {
      throw new Error('User not found');
    }

    return `User with ID ${id} has been deleted`;
  } catch (error) {
    throw error;
  }
}

/**
 * Retrieves all users.
 * @returns {Promise<Array>} - A list of all users.
 */
export async function getAllUsers() {
  try {
    const users = await User.findAll();
    return users;
  } catch (error) {
    throw error;
  }
}

/**
 * Retrieves a user's workout logs along with the machine and workout sets for each log.
 * @param {string} id - The ID of the user.
 * @returns {Promise<Array>} - A list of workout logs associated with the user.
 */
export async function getUserWorkoutLogs(id) {
  try {
    // Find the user with their associated workout logs
    const workoutLogs = await WorkoutLog.findAll({
      where: { userId: id },
      include: [
        { model: Machine, as: 'machine' },
        { model: WorkoutSet, as: 'workoutSets' },
      ],
    });
    if (!workoutLogs) {
      throw new Error('User not found');
    }

    return workoutLogs;
  } catch (error) {
    throw error;
  }
}

/**
 * Retrieves a user's workout log by ID along with the machine and workout sets for the log.
 * @param {string} userId - The ID of the user.
 * @param {string} workoutLogId - The ID of the workout log.
 * @returns {Promise<Object>} - The workout log associated with the user.
 */
export async function getUserWorkoutLogById(userId, workoutLogId) {
  try {
    const workoutLog = await WorkoutLog.findOne({
      where: { id: workoutLogId, userId },
      include: [
        { model: Machine, as: 'machine' },
        { model: WorkoutSet, as: 'workoutSets' },
      ],
    });
    if (!workoutLog) {
      throw new Error('Workout log not found');
    }

    return workoutLog;
  } catch (error) {
    throw error;
  }
}

/**
 * Removes a user from a machine's queue (dequeue operation).
 * @param {string} gymId - The ID of the gym.
 * @param {string} userId - The ID of the user.
 */
export async function dequeue(gymId, userId) {
  try {
    // Check if the user already has a queueItem
    const queueItem = await QueueItem.findOne({ where: { userId } });
    if (!queueItem) {
      throw new Error('User is not in a queue.');
    }

    const machine = await Machine.findOne({
      where: { id: queueItem.machineId, gymId },
      attributes: ['id', 'queueSize']
    });
    if (!machine) {
      throw new Error('Machine not found.');
    }
    
    // Remove the queueItem
    await queueItem.destroy();
    await machine.update({ queueSize: machine.queueSize - 1 });

    WS.sendQueueUpdate(userId, null);
    WS.broadcastMachineUpdates(gymId, queueItem.machineId, { queueSize: machine.queueSize });
    WS.broadcastQueueUpdate(gymId, queueItem.machineId);
    WS.clearCountdown(userId);

    return `User has been dequeued`;
  } catch (error) {
    throw error;
  }
}

/**
 * Disassociates a workout log from a user.
 * @param {string} userId - The ID of the user.
 * @param {string} workoutLogId - The ID of the log.
 */
export async function disassociateWorkoutLog(userId, workoutLogId) {
  try {
    const workoutLog = await WorkoutLog.findByPk(workoutLogId);
    if (!workoutLog) {
      throw new Error('Workout log not found');
    }
    if (!workoutLog.userId) {
      throw new Error('Workout log is not associated with a user');
    }
    if (workoutLog.userId !== userId) {
      throw new Error('User is not associated with this workout log');
    }

    workoutLog.userId = null;
    await workoutLog.save();
    return 'Workout log has been disassociated from user';
  } catch (error) {
    throw error;
  }
}

/**
 * Updates a WorkoutLog and its associated WorkoutSets.
 * @param {string} userId - The ID of the user.
 * @param {string} workoutLogId - The ID of the WorkoutLog.
 * @param {Array} workoutSets - The list of WorkoutSets to associate with the WorkoutLog.
 * @returns {Promise<Object>} - The updated WorkoutLog and associated WorkoutSets.
 */
export async function updateWorkoutLogWithSets(userId, workoutLogId, workoutSets) {
  const transaction = await db.sequelize.transaction({
    isolationLevel: db.Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED
  });

  try {
    // Find the workout log
    const workoutLog = await WorkoutLog.findByPk(workoutLogId, { transaction });
    if (!workoutLog) {
      throw new Error('WorkoutLog not found');
    }
    if (!workoutLog.userId) {
      throw new Error('WorkoutLog is not associated with a user');
    }
    if (workoutLog.userId !== userId) {
      throw new Error('User is not associated with this workout log');
    }

    // Remove old workout sets associated with this workout log
    await WorkoutSet.destroy({
      where: { workoutLogId },
      transaction,
    });

    // Create new workout sets
    const newWorkoutSets = await WorkoutSet.bulkCreate(
      workoutSets.map((set) => ({
        workoutLogId,
        reps: set.reps,
        weight: set.weight,
      })),
      { transaction }
    );

    await transaction.commit();
    return { workoutLog, workoutSets: newWorkoutSets };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

/**
 * Toggles gym session (starts session if not in session, otherwise ends session).
 * @param {string} userId - The ID of the user.
 * @param {string} gymId - The ID of the gym.
 * @returns {Promise<string>} - A message indicating the result of the operation.
 */
export async function toggleGymSession(userId, gymId) {
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }
    if (user.gymId) {
      if (user.gymId === gymId) {
        // If the user is in a workout, tag them off
        if (user.currentWorkoutLogId) {
          const workoutLog = await WorkoutLog.findByPk(user.currentWorkoutLogId);
          await tagOff(userId, workoutLog.machineId, user.gymId);
        }

        // If user is in a queue, dequeue them
        try {
          await dequeue(user.gymId, userId);
          sendTimerNotification(userId, 'queueCountdown', 0, null);
        } catch {
          console.log('User is not in a queue');
        }

        // Clear all timers for the user
        await TimerService.clearAllTimersForUser(userId);

        // Update the user's gymId to null
        await user.update({ gymId: null });
        WS.sendUserUpdate(userId, { gymId: null });
        WS.clearGymSessionEndingCountdown(userId);
        return 'Gym session ended';
      }
      throw new Error('User is already in a gym session');
    }

    const gym = await User.findByPk(gymId);
    if (!gym || gym.role !== 'admin') {
      throw new Error('Gym not found');
    }

    await TimerService.setTimer(userId, 'gymSessionEnding', { gymId }, 60 * 60 * 1000); // 1 hour
    await user.update({ gymId });
    WS.sendUserUpdate(userId, { gymId });
    return 'Gym session started';
  } catch (error) {
    throw error;
  }
}
