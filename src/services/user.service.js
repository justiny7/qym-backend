// src/services/user.service.js
import db from '../models/index.js';
import { Op } from 'sequelize';
const { User, WorkoutLog, Machine, WorkoutSet, QueueItem } = db;

class UserService {
  // Create a new user
  static async createUser(userData) {
    try {
      const newUser = await User.create(userData);
      return newUser;
    } catch (error) {
      throw error;
    }
  }

  // Get a user by ID
  static async getUserById(id) {
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

  // Update a user by ID
  static async updateUser(id, updateData) {
    try {
      const [updated] = await User.update(updateData, {
        where: { id },
      });

      if (!updated) {
        throw new Error('User not found');
      }

      return await this.getUserById(id);
    } catch (error) {
      throw error;
    }
  }

  // Delete a user by ID
  static async deleteUser(id) {
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

  // Get all users
  static async getAllUsers() {
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
  static async getUserWorkoutLogs(id) {
    try {
      // Find the user with their associated workout logs
      const userWithLogs = await User.findOne({
        where: { id },
        include: [
          {
            model: WorkoutLog,
            as: 'workoutLogs',
            include: [
              { model: Machine, as: 'machine' },  // Include machine information
              { model: WorkoutSet, as: 'workoutSets' },  // Include associated workout sets
            ],
          },
        ],
      });

      if (!userWithLogs) {
        throw new Error('User not found');
      }

      return userWithLogs.workoutLogs;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get a user's spot in a machine's queue.
   * @param {string} userId - The ID of the user.
   * @returns {Promise<Object>} - The queue item associated with the user.
   */
  static async getQueueSpot(userId) {
    try {
      const queueItem = await QueueItem.findOne({ where: { userId } });
      if (!queueItem) {
        throw new Error('User is not in a queue');
      }

      const position = await QueueItem.count({
        where: {
          machineId: queueItem.machineId,
          [Op.or]: [
            { timeEnqueued: { [Op.lt]: queueItem.timeEnqueued } },
            {
              timeEnqueued: queueItem.timeEnqueued,
              id: { [Op.lt]: queueItem.id }
            }
          ]
        }
      });
      await queueItem.update({ position: position + 1 });

      return queueItem;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Removes a user from a machine's queue (dequeue operation).
   * @param {string} userId - The ID of the user.
   */
  static async dequeue(userId) {
    try {
      // Check if the user already has a queueItem
      const queueItem = await QueueItem.findOne({ where: { userId } });
      if (!queueItem) {
        throw new Error('User is not in a queue.');
      }

      // Remove the queueItem
      await queueItem.destroy();
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
  static async disassociateWorkoutLog(userId, workoutLogId) {
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
     static async updateWorkoutLogWithSets(userId, workoutLogId, workoutSets) {
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
}

export default UserService;