import redisClient from '../config/redis.config.js';
import { timerQueue } from '../config/bull.config.js';
import * as MachineService from './machine.service.js';
import * as UserService from './user.service.js';
import { sendTimerNotification } from '../websocket.js';

class TimerService {
  static getJobId(userId, type) {
    return `${userId}:${type}`;
  }

  static async setTimer(userId, type, data, duration) {
    await this.clearTimer(userId, type);

    const endTime = Date.now() + duration;
    const timerKey = `timer:${userId}:${type}`;
    await redisClient.set(timerKey, JSON.stringify({ ...data, endTime }));
    console.log(`Timer set: ${timerKey}, endTime: ${endTime}`);
    
    const jobId = this.getJobId(userId, type);
    
    // Schedule the new job
    const job = await timerQueue.add(
      'processTimer',
      { userId, type, data, duration },
      { 
        jobId: jobId,
        delay: duration,
        removeOnComplete: true,
        removeOnFail: true
      }
    );
    console.log(`Job added: ${job.id}`);

    // Schedule warning timer if applicable
    if (type === 'machineTagOff') {
      await this.setWarningTimer(userId, type, data, duration - 15000, 15000); // 15-second warning
    } else if (type === 'gymSessionEnding') {
      await this.setWarningTimer(userId, type, data, duration - 60000, 60000); // 1-minute warning
    } else if (type === 'queueCountdown') {
      await this.queueCountdownUpdate(userId, type, data, Math.floor(duration / 1000));
    }
  }

  static async setWarningTimer(userId, type, data, delay, warningDuration) {
    const jobId = this.getJobId(userId, `${type}Warning`);
    try {
      console.log(`Setting warning timer for userId=${userId}, type=${type}, delay=${delay}, warningDuration=${warningDuration}`);
      const job = await timerQueue.add(
        'processWarningTimer',
        { userId, type: type, data, warningDuration },
        {
          jobId: jobId,
          delay: delay,
          removeOnComplete: true,
          removeOnFail: true
        }
      );
      console.log(`Warning timer job added: ${job.id}`);
    } catch (error) {
      console.error(`Error setting warning timer for userId=${userId}, type=${type}:`, error);
      throw error;
    }
  }

  static async queueCountdownUpdate(userId, type, data, remainingTime) {
    if (remainingTime <= 0) {
      console.log(`Timer completed for userId=${userId}, type=${type}`);
      return;
    }

    // Send notification immediately
    sendTimerNotification(userId, type, remainingTime, data);

    // Split parity so ID is unique
    const jobId = this.getJobId(userId, `${type}:update${remainingTime % 2}`);
    try {
      const job = await timerQueue.add(
        'processCountdownUpdate',
        { userId, type, data, remainingTime },
        {
          jobId: jobId,
          delay: 1000, // 1 second delay
          removeOnComplete: true,
          removeOnFail: true
        }
      );
      console.log(`Countdown update job added: ${job.id}, userId=${userId}, type=${type}, remaining time: ${remainingTime}`);
    } catch (error) {
      console.error(`Error queueing next second update for userId=${userId}, type=${type}:`, error);
      throw error;
    }
  }

  static async getTimer(userId, type) {
    const timerKey = `timer:${userId}:${type}`;
    const timer = await redisClient.get(timerKey);
    console.log(`Getting timer: ${timerKey}, value: ${timer}`);
    return timer ? JSON.parse(timer) : null;
  }

  static async clearTimer(userId, type) {
    const timerKey = `timer:${userId}:${type}`;
    await redisClient.del(timerKey);
    console.log(`Timer cleared from Redis: ${timerKey}`);

    await this.removeJob(this.getJobId(userId, type));
    
    // Remove warnings/countdown updates
    await this.removeJob(this.getJobId(userId, `${type}Warning`));
    await this.removeJob(this.getJobId(userId, `${type}:update0`));
    await this.removeJob(this.getJobId(userId, `${type}:update1`));
  }

  static async removeJob(jobId) {
    try {
      const job = await timerQueue.getJob(jobId);
      if (job) {
        await job.remove();
        console.log(`Job removed: ${jobId}`);
      } else {
        console.log(`Job not found: ${jobId}`);
      }
    } catch (error) {
      console.error(`Error removing job ${jobId}:`, error);
    }
  }

  static async clearAllTimersForUser(userId) {
    const keys = await redisClient.keys(`timer:${userId}:*`);
    console.log(`Clearing all timers for user ${userId}. Found keys:`, keys);
    for (const key of keys) {
      const type = key.split(':')[2];
      await this.clearTimer(userId, type);
    }
  }

  static async processTimer(userId, type, data) {
    // Processes guarantee that the timer is cleared
    console.log(`Processing timer: userId=${userId}, type=${type}`);
    switch (type) {
      case 'queueCountdown':
        await UserService.dequeue(data.gymId, userId);
        break;
      case 'machineTagOff':
        await MachineService.tagOff(userId, data.machineId, data.gymId);
        break;
      case 'gymSessionEnding':
        await UserService.toggleGymSession(userId, data.gymId);
        break;
    }
  }

  static async listAllTimersForUser(userId) {
    const keys = await redisClient.keys(`timer:${userId}:*`);
    const timers = {};
    for (const key of keys) {
      const type = key.split(':')[2];
      timers[type] = await this.getTimer(userId, type);
    }
    console.log(`All timers for user ${userId}:`, timers);
    return timers;
  }
}

export default TimerService;
