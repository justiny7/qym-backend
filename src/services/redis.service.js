import redisClient from '../config/redis.config.js';

const USER_KEY_PREFIX = 'user:';
const MACHINE_KEY_PREFIX = 'machine:';
const GYM_KEY_PREFIX = 'gym:';

export const setCurrentWorkoutLogId = async (userId, workoutLogId) => {
  await redisClient.set(`${USER_KEY_PREFIX}${userId}:currentWorkoutLogId`, workoutLogId !== null ? workoutLogId : 'null');
};

export const getCurrentWorkoutLogId = async (userId) => {
  const result = await redisClient.get(`${USER_KEY_PREFIX}${userId}:currentWorkoutLogId`);
  return result === 'null' ? null : result;
};

export const removeCurrentWorkoutLogId = async (userId) => {
  await redisClient.del(`${USER_KEY_PREFIX}${userId}:currentWorkoutLogId`);
};

export const setMachineData = async (gymId, machineId, data) => {
  const key = `${GYM_KEY_PREFIX}${gymId}:${MACHINE_KEY_PREFIX}${machineId}`;
  await redisClient.hSet(key, data);
};

export const getMachineData = async (gymId, machineId) => {
  const key = `${GYM_KEY_PREFIX}${gymId}:${MACHINE_KEY_PREFIX}${machineId}`;
  const data = await redisClient.hGetAll(key);
  
  // Convert numeric strings to numbers
  if (data) {
    ['queueSize', 'averageUsageTime', 'maximumSessionDuration', 'maximumQueueSize'].forEach(field => {
      if (data[field]) data[field] = parseFloat(data[field]);
    });
    if (data.lastTenSessions) {
      data.lastTenSessions = JSON.parse(data.lastTenSessions);
    }
    if (data.currentWorkoutLogId) {
      data.currentWorkoutLogId = data.currentWorkoutLogId === 'null' ? null : data.currentWorkoutLogId;
    }
  }
  
  return data;
};

export const updateMachineData = async (gymId, machineId, updates) => {
  const key = `${GYM_KEY_PREFIX}${gymId}:${MACHINE_KEY_PREFIX}${machineId}`;
  const multi = redisClient.multi();
  
  try {
    Object.entries(updates).forEach(([field, value]) => {
      if (field === 'lastTenSessions') value = JSON.stringify(value);
      if (value === null) value = 'null';
      multi.hSet(key, field, value);
    });

    await multi.exec();
  } catch (error) {
    console.error('Error updating machine data in Redis:', error);
  }
  
};