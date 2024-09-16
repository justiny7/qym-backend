import { countdownQueue } from '../config/bull.config.js';
import * as CountdownService from '../services/countdown.service.js';
import { dequeue } from '../services/user.service.js';
import { sendCountdownNotification } from '../websocket.js';

countdownQueue.process('processCountdown', async (job) => {
  const { userId, machineId, gymId } = job.data;
  
  const countdown = await CountdownService.getCountdown(userId);
  if (!countdown) {
    console.log(`No countdown found for user ${userId}`);
    return;
  }

  const now = Date.now();
  const remainingTime = Math.max(0, Math.ceil((countdown.endTime - now) / 1000));

  sendCountdownNotification(userId, machineId, remainingTime);

  if (remainingTime > 0) {
    await countdownQueue.add(
      'processCountdown',
      { userId, machineId, gymId },
      { 
        delay: 1000, // Check again in 1 second
        removeOnComplete: true,
        removeOnFail: true
      }
    );
  } else {
    console.log(`Countdown finished for user ${userId}. Dequeuing.`);
    await CountdownService.clearCountdown(userId);
    await dequeue(gymId, userId);
  }
});

// Add error handling
countdownQueue.on('error', (error) => {
  console.error('Bull queue error:', error);
});

countdownQueue.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed with error ${err.message}`);
});
