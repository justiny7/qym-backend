import Queue from 'bull';
import dotenv from 'dotenv';
dotenv.config();

export const countdownQueue = new Queue('countdown', process.env.REDIS_URL, {
  redis: {
    maxRetriesPerRequest: null,
    enableReadyCheck: false
  }
});
