import { WebSocketServer, WebSocket } from 'ws';
import { getQueue, getMachineById, getAllMachines } from './services/machine.service.js';
import { verifyWebSocketToken } from './utils/websocket.utils.js';
import * as CountdownService from './services/countdown.service.js';

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
          const existingCountdown = await CountdownService.getCountdown(user.id);
          if (existingCountdown) {
            const now = Date.now();
            if (existingCountdown.endTime > now) {
              const timeRemaining = Math.ceil((existingCountdown.endTime - now) / 1000);
              sendCountdownNotification(user.id, existingCountdown.machineId, timeRemaining);
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
      startCountdown(userId, machineId, gymId, Date.now() + 30000);
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

export async function startCountdown(userId, machineId, gymId, endTime) {
  const countdown = await CountdownService.getCountdown(userId);
  if (!countdown) {
    await CountdownService.setCountdown(userId, machineId, gymId, endTime);
  }
}

export async function clearCountdown(userId) {
  await CountdownService.clearCountdown(userId);
  sendCountdownNotification(userId, null, 0);
}

export async function sendCountdownNotification(userId, machineId, remainingTime) {
  const ws = userSockets.get(userId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'countdownNotification',
      data: {
        machineId,
        message: `Your turn! You have ${remainingTime} seconds to tag on.`,
        remainingTime
      }
    }));
  }
}
