// src/services/user.service.js
import db from '../models/index.js';
const { User, WorkoutLog, Machine } = db;

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
      const user = await User.findOne({
        where: { id },
        include: [
          {
            model: WorkoutLog,
            as: 'workoutLogs',
            include: [
              {
                model: Machine,
                as: 'machine',
              },
            ],
          },
        ],
      });

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
      const users = await User.findAll({
        include: [
          {
            model: WorkoutLog,
            as: 'workoutLogs',
            include: [
              {
                model: Machine,
                as: 'machine',
              },
            ],
          },
        ],
      });
      return users;
    } catch (error) {
      throw new Error(`Error fetching users: ${error.message}`);
    }
  }

  // Get a user's workout logs by user ID
  static async getUserWorkoutLogs(id) {
    try {
      const user = await this.getUserById(id);
      return user.workoutLogs;
    } catch (error) {
      throw new Error(`Error retrieving workout logs: ${error.message}`);
    }
  }
}

export default UserService;