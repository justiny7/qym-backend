import { WebSocketServer, WebSocket } from 'ws';
import MachineService from './services/machine.service.js';
import { verifyWebSocketToken } from './utils/websocket.utils.js';

let wss;
const userSockets = new Map();

export function initializeWebSocket(server) {
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws, req) => {
    console.log('New WebSocket connection attempt');

    ws.on('message', (message) => {
      const data = JSON.parse(message);
      console.log('Received message:', data);
      if (data.type === 'authenticate') {
        const user = verifyWebSocketToken(data.token);
        if (user) {
          console.log('User authenticated:', user);

          ws.userId = user.id;
          ws.gymId = data.gymId;
          userSockets.set(user.id, ws);

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
  
  wss.clients.forEach((ws) => {
    if (ws.gymId === gymId && ws.userId in queuePositions && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'queueUpdate', data: queuePositions[ws.userId] }));
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
