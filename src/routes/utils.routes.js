// src/routes/utils.routes.js
import express from 'express';
import UtilsController from '../controllers/utils.controller.js';

const router = express.Router();

router.put('/workout-logs/:id/', UtilsController.updateWorkoutLogWithSets);

router.put('/queue-items/:id', UtilsController.updateAsFront);

export default router;
