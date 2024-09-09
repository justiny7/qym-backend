// src/controllers/user.controller.js
import UserService from '../services/user.service.js';

class UserController {
  // Create a new user
  static async createUser(req, res) {
    try {
      const userData = req.body;
      const newUser = await UserService.createUser(userData);
      res.status(201).json(newUser);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get a user by ID
  static async getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = await UserService.getUserById(id);
      res.status(200).json(user);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  // Update a user by ID
  static async updateUser(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const updatedUser = await UserService.updateUser(id, updateData);
      res.status(200).json(updatedUser);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Delete a user by ID
  static async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const message = await UserService.deleteUser(id);
      res.status(200).json({ message });
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  // Get all users
  static async getAllUsers(req, res) {
    try {
      const users = await UserService.getAllUsers();
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get a user's workout logs by user ID
  static async getUserWorkoutLogs(req, res) {
    try {
      const workoutLogs = await UserService.getUserWorkoutLogs(req.user.id);
      res.status(200).json(workoutLogs);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  /**
   * Removes a user from a machine's queue (dequeue operation).
   * @param {Object} req - The request object containing userId and machineId.
   * @param {Object} res - The response object.
   */
  static async dequeue(req, res) {
    try {
      const message = await UserService.dequeue(req.user.id);
      res.status(200).json({ message });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

export default UserController;
