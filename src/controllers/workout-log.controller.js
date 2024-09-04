import WorkoutLogService from '../services/workout-log.service.js';

class WorkoutLogController {
  /**
   * Handles the HTTP request for tagging on to a machine.
   * @param {Object} req - The request object, containing userId and machineId in the body.
   * @param {Object} res - The response object.
   */
  static async tagOn(req, res) {
    const { userId, machineId } = req.body;
    try {
      const workoutLog = await WorkoutLogService.tagOn(userId, machineId);
      res.status(201).json(workoutLog);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Handles the HTTP request for tagging off from a machine.
   * @param {Object} req - The request object, containing userId and machineId in the body.
   * @param {Object} res - The response object.
   */
  static async tagOff(req, res) {
    const { userId, machineId } = req.body;
    try {
      const workoutLog = await WorkoutLogService.tagOff(userId, machineId);
      res.status(200).json(workoutLog);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default WorkoutLogController;
