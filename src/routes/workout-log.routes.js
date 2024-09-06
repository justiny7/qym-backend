// src/routes/workout-log.routes.js
import express from 'express';
import WorkoutLogController from '../controllers/workout-log.controller.js';

const router = express.Router();

router.put('/workout-logs/:id/workout-sets', WorkoutLogController.updateWorkoutLogWithSets);

export default router;
