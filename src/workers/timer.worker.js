import { timerQueue } from '../config/bull.config.js';
import TimerService from '../services/timer.service.js';


timerQueue.process('processWarningTimer', async (job) => {
  const { userId, type, data, warningDuration } = job.data;
  console.log(`Processing warning timer job: ${job.id}, userId=${userId}, type=${type}`);
  
  await TimerService.queueCountdownUpdate(userId, type, data, Math.floor(warningDuration / 1000));
});

timerQueue.process('processCountdownUpdate', async (job) => {
  const { userId, type, data, remainingTime } = job.data;
  console.log(`Processing countdown update job: ${job.id}, userId=${userId}, type=${type}, remainingTime=${remainingTime}`);
  
  try {
    // Queue the next update
    console.log(`Queueing next update for userId=${userId}, type=${type}, remainingTime=${remainingTime - 1}`);
    await TimerService.queueCountdownUpdate(userId, type, data, remainingTime - 1);
  } catch (error) {
    console.error(`Error in processCountdownUpdate for job ${job.id}:`, error);
    throw error; // Rethrow the error so Bull can handle it
  }
});

timerQueue.on('error', (error) => {
  console.error('Bull queue error:', error);
});

timerQueue.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed with error:`, err);
});
