import redisClient from '../config/redis.config.js';
import { countdownQueue } from '../config/bull.config.js';

export async function setCountdown(userId, machineId, gymId, endTime) {
  await redisClient.set(`countdown:${userId}`, JSON.stringify({ machineId, endTime }));
  
  // Schedule the job
  await countdownQueue.add(
    'processCountdown',
    { userId, machineId, gymId },
    { 
      jobId: userId, // Use userId as jobId for easy reference
      removeOnComplete: true,
      removeOnFail: true
    }
  );
}

export async function getCountdown(userId) {
  const countdown = await redisClient.get(`countdown:${userId}`);
  return countdown ? JSON.parse(countdown) : null;
}

export async function clearCountdown(userId) {
  await redisClient.del(`countdown:${userId}`);
  await countdownQueue.removeJobs(userId); // Remove the job if it exists
}
