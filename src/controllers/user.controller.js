// src/controllers/user.controller.js
import * as UserService from '../services/user.service.js';

// Create a new user
export async function createUser(req, res) {
  try {
    const userData = req.body;
    const newUser = await UserService.createUser(userData);
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Get a user by ID
export async function getUserById(req, res) {
  try {
    const id = req.user.id || req.params.id;
    const user = await UserService.getUserById(id);
    res.status(200).json(user);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
}

// Update a user by ID
export async function updateUser(req, res) {
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
export async function deleteUser(req, res) {
  try {
    const id = req.user.id || req.params.id;
    const message = await UserService.deleteUser(id);
    res.status(200).json({ message });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
}

// Get all users
export async function getAllUsers(req, res) {
  try {
    const users = await UserService.getAllUsers();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Get a user's workout logs by user ID
export async function getUserWorkoutLogs(req, res) {
  try {
    const workoutLogs = await UserService.getUserWorkoutLogs(req.user.id);
    res.status(200).json(workoutLogs);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
}

/**
 * Get a user's workout log by workout log ID.
 * @param {Object} req - The request object containing the workout log ID.
 * @param {Object} res - The response object.
 */
export async function getUserWorkoutLogById(req, res) {
  try {
    const workoutLog = await UserService.getUserWorkoutLogById(req.user.id, req.params.id);
    res.status(200).json(workoutLog);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
}

/**
 * Removes a user from a machine's queue (dequeue operation).
 * @param {Object} req - The request object containing userId and gymId.
 * @param {Object} res - The response object.
 */
export async function dequeue(req, res) {
  try {
    const message = await UserService.dequeue(req.user.gymId, req.user.id);
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
export async function disassociateWorkoutLog(req, res) {
  try {
    const workoutLog = await UserService.disassociateWorkoutLog(req.user.id, req.params.id);
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
export async function updateWorkoutLogWithSets(req, res) {
  try {
    const result = await UserService.updateWorkoutLogWithSets(req.user.id, req.params.id, req.body);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Toggle user's gym session.
 * @param {Object} req - The request object, containing the user ID and gym ID.
 * @param {Object} res - The response object.
 */
export async function toggleGymSession(req, res) {
  try {
    const gymSession = await UserService.toggleGymSession(req.user.id, req.params.id);
    res.status(200).json(gymSession);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
