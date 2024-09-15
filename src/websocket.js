import { WebSocketServer, WebSocket } from 'ws';
import MachineService from './services/machine.service.js';
import UserService from './services/user.service.js';
import { verifyWebSocketToken } from './utils/websocket.utils.js';
import CountdownService from './services/countdown.service.js';

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
              await sendCountdownNotification(user.id, existingCountdown.machineId, existingCountdown.endTime);
            } else {
              await CountdownService.clearCountdown(user.id);
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
  const queueItems = await MachineService.getQueue(gymId, machineId);
  const queuePositions = queueItems.reduce((acc, item, index) => {
    acc[item.userId] = { ...item.dataValues, position: index + 1 };
    return acc;
  }, {});

  const machine = await MachineService.getMachineById(gymId, machineId);
  wss.clients.forEach((ws) => {
    if (ws.gymId === gymId && ws.userId in queuePositions && ws.readyState === WebSocket.OPEN) {
      const data = queuePositions[ws.userId];
      if (data.position === 1 && !machine.currentWorkoutLogId) {
        sendCountdownNotification(ws.userId, machineId, Date.now() + 30000);
      }
      ws.send(JSON.stringify({ type: 'queueUpdate', data }));
    }
  });
}

export function sendQueueUpdate(userId, queueItem) {
  const ws = userSockets.get(userId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'queueUpdate', data: queueItem }));
  }
}

async function sendInitialStatus(ws, gymId, queuedMachineId) {
  const machines = await MachineService.getAllMachines(gymId);
  ws.send(JSON.stringify({ type: 'machineStatus', gymId, data: machines }));
  if (queuedMachineId) {
    broadcastQueueUpdate(gymId, queuedMachineId);
  }
}

export async function sendCountdownNotification(userId, machineId, endTime) {
  const ws = userSockets.get(userId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    if (ws.countdownIntervalId) {
      return;
    }

    await CountdownService.setCountdown(userId, machineId, endTime);

    const sendUpdate = () => {
      const now = Date.now();
      const remainingTime = Math.max(0, Math.ceil((endTime - now) / 1000));

      ws.send(JSON.stringify({
        type: 'countdownNotification',
        data: {
          machineId,
          message: `Your turn! You have ${remainingTime} seconds to tag on.`,
          remainingTime,
          endTime
        }
      }));

      if (remainingTime === 0) {
        clearInterval(ws.countdownIntervalId);
        delete ws.countdownIntervalId;
        CountdownService.clearCountdown(userId);
        UserService.dequeue(ws.gymId, userId);
      }
    };

    sendUpdate(); // Send initial update
    ws.countdownIntervalId = setInterval(sendUpdate, 1000);
  }
}

// Add a function to clear the countdown if needed
export function clearCountdownNotification(userId) {
  const ws = userSockets.get(userId);
  if (ws && ws.countdownIntervalId) {
    clearInterval(ws.countdownIntervalId);
    delete ws.countdownIntervalId;
    
    // Send a final message to clear the notification on the frontend
    ws.send(JSON.stringify({
      type: 'countdownNotification',
      data: null
    }));
  }
  CountdownService.clearCountdown(userId);
}
