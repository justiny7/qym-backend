import redisClient from '../config/redis.config.js';

class CountdownService {
  static async setCountdown(userId, machineId, endTime) {
    await redisClient.set(`countdown:${userId}`, JSON.stringify({ machineId, endTime }));
  }

  static async getCountdown(userId) {
    const countdown = await redisClient.get(`countdown:${userId}`);
    return countdown ? JSON.parse(countdown) : null;
  }

  static async clearCountdown(userId) {
    await redisClient.del(`countdown:${userId}`);
  }
}

export default CountdownService;
