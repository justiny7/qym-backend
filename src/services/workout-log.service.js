// src/services/workout-log.service.js
import db from '../models/index.js';
const { WorkoutLog, User, Machine } = db;

class WorkoutLogService {
  /**
   * Handles tagging on a user to a machine, creating a new workout log.
   * @param {string} userId - The ID of the user.
   * @param {string} machineId - The ID of the machine.
   * @returns {Promise<Object>} - The created WorkoutLog object.
   */
  static async tagOn(userId, machineId) {
    const transaction = await db.sequelize.transaction();

    try {
      // Find the user and machine
      const user = await User.findByPk(userId, { transaction });
      const machine = await Machine.findByPk(machineId, { transaction });
      
      // Ensure both user and machine exist and are not tagged on
      if (!user || !machine) {
        throw new Error('Invalid user or machine.');
      }
      if (machine.currentWorkoutLogId) {
        throw new Error('Machine already tagged on.');
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
      console.log('User tagged on:', workoutLog);
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
    const transaction = await db.sequelize.transaction();

    try {
      // Find the user and machine
      const user = await User.findByPk(userId, { transaction });
      const machine = await Machine.findByPk(machineId, { transaction });

      // Ensure both user and machine exist and have the same active workout log
      if (!user || !machine || user.currentWorkoutLogId !== machine.currentWorkoutLogId) {
        throw new Error('No active workout log found for tagging off.');
      }

      // Find the active workout log
      const workoutLog = await WorkoutLog.findByPk(user.currentWorkoutLogId, { transaction });
      if (!workoutLog) {
        throw new Error('No active workout log found for tagging off.');
      }

      // Update the log with the tag off time
      workoutLog.timeOfTagOff = new Date();
      await workoutLog.save({ transaction });

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
      console.log('User tagged off:', workoutLog);
      return workoutLog;
    } catch (error) {
      await transaction.rollback();
      console.error('Error during tag off:', error);
      throw new Error('Could not tag off from the machine.');
    }
  }
}

export default WorkoutLogService;
