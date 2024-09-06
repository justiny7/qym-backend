// src/routes/utils.routes.js
import express from 'express';
import UtilsController from '../controllers/utils.controller.js';

const router = express.Router();

router.put('/workout-log/:id/', UtilsController.updateWorkoutLogWithSets);

router.put('/queue-item/:id', UtilsController.updateAsFront);

export default router;
