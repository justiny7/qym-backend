// src/controllers/machine.controller.js
import * as MachineService from '../services/machine.service.js';

/**
 * Creates a new machine.
 * @param {Object} req - The request object, containing the machine data in the body.
 * @param {Object} res - The response object.
 */
export async function createMachine(req, res) {
  try {
    const newMachine = await MachineService.createMachine(req.user.gymId, req.body);
    res.status(201).json(newMachine);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Gets a machine by ID.
 * @param {Object} req - The request object, containing the machine ID.
 * @param {Object} res - The response object.
 */
export async function getMachineById(req, res) {
  try {
    const machine = await MachineService.getMachineById(req.user.gymId, req.params.id);
    res.status(200).json(machine);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
}

/**
 * Updates a machine by ID.
 * @param {Object} req - The request object, containing the machine ID and updated data in the body.
 * @param {Object} res - The response object.
 */
export async function updateMachine(req, res) {
  try {
    const updatedMachine = await MachineService.updateMachine(req.user.gymId, req.params.id, req.body);
    res.status(200).json(updatedMachine);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Deletes a machine by ID.
 * @param {Object} req - The request object, containing the machine ID.
 * @param {Object} res - The response object.
 */
export async function deleteMachine(req, res) {
  try {
    const message = await MachineService.deleteMachine(req.user.gymId, req.params.id);
    res.status(200).json({ message });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
}

/**
 * Gets all machines
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
export async function getAllMachines(req, res) {
  try {
    const machines = await MachineService.getAllMachines(req.user.gymId);
    res.status(200).json(machines);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Gets a machine's workout logs.
 * @param {Object} req - The request object, containing the machine ID.
 * @param {Object} res - The response object.
 */
export async function getMachineWorkoutLogs(req, res) {
  try {
    const workoutLogs = await MachineService.getMachineWorkoutLogs(req.user.gymId, req.params.id);
    res.status(200).json(workoutLogs);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
}

/**
 * Gets a machine's workout log by ID.
 * @param {Object} req - The request object, containing the machine ID and workout log ID.
 * @param {Object} res - The response object.
 */
export async function getMachineWorkoutLogById(req, res) {
  try {
    const workoutLog = await MachineService.getMachineWorkoutLogById(req.user.gymId, req.params.id, req.params.logId);
    res.status(200).json(workoutLog);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
}


/**
 * Handles the HTTP request for tagging on to a machine.
 * @param {Object} req - The request object, containing userId in the body.
 * @param {Object} res - The response object.
 */
export async function tagOn(req, res) {
  try {
    const workoutLog = await MachineService.tagOn(req.user.id, req.params.id, req.user.gymId);
    res.status(201).json(workoutLog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Handles the HTTP request for tagging off from a machine.
 * @param {Object} req - The request object, containing machineId and userId in the URI.
 * @param {Object} res - The response object.
 */
export async function tagOff(req, res) {
  try {
    const workoutLog = await MachineService.tagOff(req.user.id, req.params.id, req.user.gymId);
    res.status(200).json(workoutLog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Adds a user to a machine's queue (enqueue operation).
 * @param {Object} req - The request object containing userId and machineId.
 * @param {Object} res - The response object.
 */
export async function enqueue(req, res) {
  try {
    const queueItem = await MachineService.enqueue(req.user.id, req.params.id, req.user.gymId);
    res.status(201).json(queueItem);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

/**
 * Retrieves all items in a machine's queue.
 * @param {Object} req - The request object containing gymId and machineId.
 * @param {Object} res - The response object.
 */
export async function getQueue(req, res) {
  try {
    const queue = await MachineService.getQueue(req.user.gymId, req.params.id);
    res.status(200).json(queue);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

/**
 * Retrieves all of a machine's reports.
 * @param {Object} req - The request object containing gymId and machineId.
 * @param {Object} res - The response object.
 */
export async function getMachineReports(req, res) {
  try {
    const reports = await MachineService.getMachineReports(req.user.gymId, req.params.id);
    res.status(200).json(reports);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

/**
 * Retrieves a machine's report by ID.
 * @param {Object} req - The request object containing gymId, machineId, and reportId.
 * @param {Object} res - The response object.
 * @returns {Object} - The machine report.
 */
export async function getMachineReportById(req, res) {
  try {
    const report = await MachineService.getMachineReportById(req.user.gymId, req.params.id, req.params.reportId);
    res.status(200).json(report);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

/**
 * Creates a new machine report.
 * @param {Object} req - The request object containing gymId, machineId, and report data.
 * @param {Object} res - The response object.
 * @returns {Object} - The new machine report.
 */
export async function createMachineReport(req, res) {
  try {
    const newReport = await MachineService.createMachineReport(req.user.gymId, req.params.id, req.body);
    res.status(201).json(newReport);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

/**
 * Updates a machine's report by ID.
 * @param {Object} req - The request object containing gymId, machineId, reportId, and updated data.
 * @param {Object} res - The response object.
 * @returns {Object} - The updated machine report.
 */
export async function updateMachineReport(req, res) {
  try {
    const updatedReport = await MachineService.updateMachineReport(req.user.gymId, req.params.id, req.params.reportId, req.body);
    res.status(200).json(updatedReport);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}
