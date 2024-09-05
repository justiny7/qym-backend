// src/services/workout-log.service.js
import db from '../models/index.js';
const { WorkoutLog, WorkoutSet, User, Machine } = db;

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

      // If machine is already tagged on, tag off if session exceeds maximum duration
      if (machine.currentWorkoutLogId) {
        const currentWorkoutLog = await WorkoutLog.findByPk(machine.currentWorkoutLogId, { transaction });
        const now = new Date();
        if ((now - currentWorkoutLog.timeOfTagOn) / 1000 <= machine.maximumSessionDuration) {
          throw new Error('Machine already tagged on.');
        } else {
          await this.tagOff(currentWorkoutLog.userId, machineId);
        }
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

      // Calculate the duration of workout and update machine's last ten sessions
      const workoutDuration = (workoutLog.timeOfTagOff - workoutLog.timeOfTagOn) / 1000;
      if (workoutDuration >= 60 && workoutDuration <= machine.maximumSessionDuration) {
        let lastTenSessions = [...machine.lastTenSessions];
        lastTenSessions.shift();
        lastTenSessions.push(workoutDuration);
        const averageUsageTime = lastTenSessions.reduce((acc, duration) => acc + duration, 0) / 10;

        await Machine.update(
          { lastTenSessions, averageUsageTime },
          { where: { id: machineId }, transaction }
        );
      }
 
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

   /**
   * Updates a WorkoutLog and its associated WorkoutSets.
   * @param {string} workoutLogId - The ID of the WorkoutLog.
   * @param {Array} workoutSets - The list of WorkoutSets to associate with the WorkoutLog.
   * @returns {Promise<Object>} - The updated WorkoutLog and associated WorkoutSets.
   */
  static async updateWorkoutLogWithSets(workoutLogId, workoutSets) {
    const transaction = await db.sequelize.transaction();

    try {
      // Find the workout log
      const workoutLog = await WorkoutLog.findByPk(workoutLogId, { transaction });
      if (!workoutLog) {
        throw new Error('WorkoutLog not found');
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
      console.error('Error updating workout log and sets:', error);
      throw error;
    }
  }
}

export default WorkoutLogService;
