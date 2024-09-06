// src/controllers/utils.controller.js
import UtilsService from '../services/utils.service.js';

class UtilsController {
  /**
   * Updates a WorkoutLog and its associated WorkoutSets.
   * @param {Object} req - The request object, containing the workoutLogId in params and the list of workoutSets in the body.
   * @param {Object} res - The response object.
   */
  static async updateWorkoutLogWithSets(req, res) {
    const { id } = req.params;
    const { workoutSets } = req.body;

    try {
      const result = await UtilsService.updateWorkoutLogWithSets(id, workoutSets);
      res.status(200).json({ message: 'WorkoutLog and WorkoutSets updated', ...result });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Updates a QueueItem with timeReachedFront.
   * @param {Object} req - The request object, containing the queueItemId in params.
   * @param {Object} res - The response object.
   */
  static async updateAsFront(req, res) {
    const { id } = req.params;

    try {
      const queueItem = await UtilsService.updateAsFront(id);
      res.status(200).json({ message: 'QueueItem updated', queueItem });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default UtilsController;
