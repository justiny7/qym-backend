import WorkoutLogService from '../services/workout-log.service.js';

class WorkoutLogController {
  /**
   * Updates a WorkoutLog and its associated WorkoutSets.
   * @param {Object} req - The request object, containing the workoutLogId in params and the list of workoutSets in the body.
   * @param {Object} res - The response object.
   */
  static async updateWorkoutLogWithSets(req, res) {
    const { id } = req.params;
    const { workoutSets } = req.body;

    try {
      const result = await WorkoutLogService.updateWorkoutLogWithSets(id, workoutSets);
      res.status(200).json({ message: 'WorkoutLog and WorkoutSets updated', ...result });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default WorkoutLogController;
