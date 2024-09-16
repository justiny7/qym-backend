import Queue from 'bull';
import dotenv from 'dotenv';
dotenv.config();

export const timerQueue = new Queue('timer', process.env.REDIS_URL, {
  redis: {
    maxRetriesPerRequest: null,
    enableReadyCheck: false
  }
});
