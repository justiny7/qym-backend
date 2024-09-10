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
      const id = req.user.id || req.params.id;
      const user = await UserService.getUserById(id);
      res.status(200).json(user);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  // Update a user by ID
  static async updateUser(req, res) {
    try {
      const id = req.user.id || req.params.id;
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
      const id = req.user.id || req.params.id;
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
   * Get a user's spot in a machine's queue.
   * @param {Object} req - The request object containing the userId.
   * @param {Object} res - The response object.
   */
  static async getQueueSpot(req, res) {
    try {
      const queueItem = await UserService.getQueueSpot(req.user.id);
      res.status(200).json(queueItem);
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

  /**
   * Disassociates a workout log from a user
   * @param {Object} req - The request object containing the workout log ID.
   * @param {Object} res - The response object.
   */
  static async disassociateWorkoutLog(req, res) {
    try {
      const { id } = req.params;
      const workoutLog = await UserService.disassociateWorkoutLog(req.user.id, id);
      res.status(200).json(workoutLog);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Updates a WorkoutLog and its associated WorkoutSets.
   * @param {Object} req - The request object, containing the workoutLogId in params and the list of workoutSets in the body.
   * @param {Object} res - The response object.
   */
  static async updateWorkoutLogWithSets(req, res) {
    const { id } = req.params;
    const { workoutSets } = req.body;

    try {
      const result = await UserService.updateWorkoutLogWithSets(req.user.id, id, workoutSets);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default UserController;
