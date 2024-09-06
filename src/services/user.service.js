// src/services/user.service.js
import db from '../models/index.js';
const { User, WorkoutLog, Machine, WorkoutSet, QueueItem } = db;

class UserService {
  // Create a new user
  static async createUser(userData) {
    try {
      const newUser = await User.create(userData);
      return newUser;
    } catch (error) {
      throw new Error(`Error creating user: ${error.message}`);
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
      throw new Error(`Error retrieving user: ${error.message}`);
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
      throw new Error(`Error updating user: ${error.message}`);
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
      throw new Error(`Error deleting user: ${error.message}`);
    }
  }

  // Get all users
  static async getAllUsers() {
    try {
      const users = await User.findAll();
      return users;
    } catch (error) {
      throw new Error(`Error fetching users: ${error.message}`);
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
      console.error('Error fetching user workout logs:', error);
      throw error;
    }
  }

  /**
   * Adds a user to a machine's queue. Ensures a user can only be in one queue.
   * @param {string} userId - The ID of the user.
   * @param {string} machineId - The ID of the machine.
   * @returns {Promise<Object>} - The newly created QueueItem.
   */
  static async enqueue(userId, machineId) {
    try {
      // Check if the user already has a queueItem
      const queueItem = await QueueItem.findOne({
        where: { userId },
      });

      if (queueItem) {
        throw new Error('User is already in a queue.');
      }

      // Create a new QueueItem for the machine
      const newQueueItem = await QueueItem.create({ userId, machineId });
      return newQueueItem;
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
      const queueItem = await QueueItem.findOne({
        where: { userId },
      });

      if (!queueItem) {
        throw new Error('User is not in a queue.');
      }

      // Remove the queueItem
      await queueItem.destroy();
      return `User with ID ${userId} has been dequeued`;
    } catch (error) {
      throw error;
    }
  }
}

export default UserService;