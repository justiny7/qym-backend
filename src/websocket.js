import { WebSocketServer, WebSocket } from 'ws';
import { getQueue, getMachineById, getAllMachines } from './services/machine.service.js';
import { verifyWebSocketToken } from './utils/websocket.utils.js';
import TimerService from './services/timer.service.js';

let wss;
const userSockets = new Map();

export function initializeWebSocket(server) {
  wss = new WebSocketServer({ server });

  wss.on('connection', async (ws, req) => {
    console.log('New WebSocket connection attempt');

    ws.on('message', async (message) => {
      const data = JSON.parse(message);
      console.log('Received message:', data);
      if (data.type === 'authenticate') {
        const user = verifyWebSocketToken(data.token);
        if (user) {
          console.log('User authenticated:', user);

          ws.userId = user.id;
          ws.gymId = data.gymId;
          userSockets.set(user.id, ws);

          // Check for existing countdown
          const existingCountdown = await TimerService.getTimer(user.id, 'queueCountdown');
          if (existingCountdown) {
            const now = Date.now();
            if (existingCountdown.endTime > now) {
              const timeRemaining = Math.ceil((existingCountdown.endTime - now) / 1000);
              sendTimerNotification(user.id, 'queueCountdown', timeRemaining, null);
            } else {
              await clearCountdown(user.id);
            }
          }

          sendInitialStatus(ws, data.gymId, data.queuedMachineId);
        } else {
          ws.close();
        }
      }
    });
  });
}

export async function broadcastMachineUpdates(gymId, machineId, update) {
  if (!gymId || !machineId) {
    console.error('No gymId or machineId provided for machine status update');
    return;
  }
  
  const message = JSON.stringify({
    type: 'machineUpdate',
    machineId,
    data: update
  });

  wss.clients.forEach((ws) => {
    if (ws.gymId === gymId && ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
}

export function sendUserUpdate(userId, update) {
  const ws = userSockets.get(userId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'userUpdate', data: update }));
  }
}

export async function broadcastQueueUpdate(gymId, machineId) {
  // Assign position to each user in the queue
  const queueItems = await getQueue(gymId, machineId);
  const queuePositions = queueItems.reduce((acc, item, index) => {
    acc[item.userId] = { ...item.dataValues, position: index + 1 };
    return acc;
  }, {});

  // Broadcast queue update to all users
  const machine = await getMachineById(gymId, machineId);
  for (const [userId, data] of Object.entries(queuePositions)) {
    // If the user is in the first position and the machine is not currently being used, start the countdown
    if (data.position === 1 && !machine.currentWorkoutLogId) {
      startCountdown(userId, machineId, gymId, 30000);
    }

    // Send the queue update to the user if websocket is open
    const ws = userSockets.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'queueUpdate', data }));
    }
  }
}

export function sendQueueUpdate(userId, queueItem) {
  const ws = userSockets.get(userId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'queueUpdate', data: queueItem }));
  }
}

async function sendInitialStatus(ws, gymId, queuedMachineId) {
  const machines = await getAllMachines(gymId);
  ws.send(JSON.stringify({ type: 'machineStatus', gymId, data: machines }));
  if (queuedMachineId) {
    broadcastQueueUpdate(gymId, queuedMachineId);
  }
}


export async function startCountdown(userId, machineId, gymId, duration) {
  const countdown = await TimerService.getTimer(userId, 'queueCountdown');
  if (!countdown) {
    await TimerService.setTimer(userId, 'queueCountdown', { machineId, gymId }, duration);
  }
}


export async function clearCountdown(userId) {
  await TimerService.clearTimer(userId, 'queueCountdown');
  sendTimerNotification(userId, 'queueCountdown', 0, null);
}

export async function clearMachineTagOffCountdown(userId) {
  await TimerService.clearTimer(userId, 'machineTagOff');
  sendTimerNotification(userId, 'machineTagOff', 0, null);
}

export async function clearGymSessionEndingCountdown(userId) {
  await TimerService.clearTimer(userId, 'gymSessionEnding');
  sendTimerNotification(userId, 'gymSessionEnding', 0, null);
}

export function sendTimerNotification(userId, type, remainingTime, data) {
  const ws = userSockets.get(userId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    let message;
    switch (type) {
      case 'queueCountdown':
        message = `Your turn! You have ${remainingTime} seconds to tag on.`;
        break;
      case 'machineTagOff':
        message = `Warning: You will be automatically tagged off in ${remainingTime} seconds.`;
        break;
      case 'gymSessionEnding':
        message = `Warning: Your gym session will end in ${remainingTime} seconds.`;
        break;
    }

    ws.send(JSON.stringify({
      type: 'timerNotification',
      data: {
        type,
        message,
        remainingTime,
        ...data
      }
    }));
  }
}
