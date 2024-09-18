import redisClient from '../config/redis.config.js';

const USER_KEY_PREFIX = 'user:';
const MACHINE_KEY_PREFIX = 'machine:';

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

export const setMachineData = async (machineId, data) => {
  const key = `${MACHINE_KEY_PREFIX}${machineId}`;
  await redisClient.hSet(key, data);
};

export const getMachineData = async (machineId) => {
  const key = `${MACHINE_KEY_PREFIX}${machineId}`;
  const data = await redisClient.hGetAll(key);
  
  // Convert numeric strings to numbers
  if (data) {
    ['queueSize', 'averageUsageTime', 'maximumSessionDuration'].forEach(field => {
      if (data[field]) data[field] = parseFloat(data[field]);
    });
    if (data.lastTenSessions) data.lastTenSessions = JSON.parse(data.lastTenSessions);
  }
  
  return data;
};

export const updateMachineData = async (machineId, updates) => {
  const key = `${MACHINE_KEY_PREFIX}${machineId}`;
  const multi = redisClient.multi();
  
  Object.entries(updates).forEach(([field, value]) => {
    if (field === 'lastTenSessions') value = JSON.stringify(value);
    multi.hSet(key, field, value);
  });
  
  await multi.exec();
};