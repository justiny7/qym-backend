// src/routes/workout-log.routes.js
import express from 'express';
import WorkoutLogController from '../controllers/workout-log.controller.js';

const router = express.Router();

router.post('/workout-logs/tag-on', WorkoutLogController.tagOn);
router.post('/workout-logs/tag-off', WorkoutLogController.tagOff);
router.put('/workout-logs/:id/workout-sets', WorkoutLogController.updateWorkoutLogWithSets);

export default router;
