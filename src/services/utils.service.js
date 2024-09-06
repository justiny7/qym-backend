// src/services/utils.service.js
import db from '../models/index.js';
const { WorkoutLog, WorkoutSet, QueueItem } = db;

class UtilsService {
   /**
   * Updates a WorkoutLog and its associated WorkoutSets.
   * @param {string} workoutLogId - The ID of the WorkoutLog.
   * @param {Array} workoutSets - The list of WorkoutSets to associate with the WorkoutLog.
   * @returns {Promise<Object>} - The updated WorkoutLog and associated WorkoutSets.
   */
  static async updateWorkoutLogWithSets(workoutLogId, workoutSets) {
    const transaction = await db.sequelize.transaction({
      isolationLevel: db.Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED
    });

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

  /**
   * Updates a QueueItem with timeReachedFront
   * @param {string} queueItemId - The ID of the QueueItem.
   * @returns {Promise<Object>} - The updated QueueItem.
   */
  static async updateAsFront(queueItemId) {
    try {
      // Find the queue item
      const queueItem = await QueueItem.findByPk(queueItemId);
      if (!queueItem) {
        throw new Error('QueueItem not found');
      }

      // Update the queue item with timeReachedFront
      const updatedQueueItem = await queueItem.update({ timeReachedFront: new Date() });
      return updatedQueueItem;
    } catch (error) {
      console.error('Error updating queue item:', error);
      throw error;
    }
  }
}

export default UtilsService;
