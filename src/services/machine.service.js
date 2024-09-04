// src/services/machine.service.js
import db from '../models/index.js';  // Import models (including Machine)
const { Machine } = db;

// Create a new machine
export const createMachine = async (machineData) => {
  try {
    const machine = await Machine.create(machineData);
    return machine;
  } catch (error) {
    throw new Error(`Error creating machine: ${error.message}`);
  }
};

// Get all machines
export const getAllMachines = async () => {
  try {
    const machines = await Machine.findAll();
    return machines;
  } catch (error) {
    throw new Error(`Error fetching machines: ${error.message}`);
  }
};

// Get a machine by ID
export const getMachineById = async (id) => {
  try {
    const machine = await Machine.findByPk(id);
    if (!machine) {
      throw new Error('Machine not found');
    }
    return machine;
  } catch (error) {
    throw new Error(`Error fetching machine: ${error.message}`);
  }
};

// Update a machine by ID
export const updateMachine = async (id, updateData) => {
  try {
    const machine = await Machine.findByPk(id);
    if (!machine) {
      throw new Error('Machine not found');
    }
    await machine.update(updateData);
    return machine;
  } catch (error) {
    throw new Error(`Error updating machine: ${error.message}`);
  }
};

// Delete a machine by ID
export const deleteMachine = async (id) => {
  try {
    const machine = await Machine.findByPk(id);
    if (!machine) {
      throw new Error('Machine not found');
    }
    await machine.destroy();
    return { message: 'Machine deleted successfully' };
  } catch (error) {
    throw new Error(`Error deleting machine: ${error.message}`);
  }
};
