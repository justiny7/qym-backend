import { WebSocketServer, WebSocket } from 'ws';
import MachineService from './services/machine.service.js';
import { verifyWebSocketToken } from './utils/websocket.utils.js';

let wss;
const userSockets = new Map();

export function initializeWebSocket(server) {
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws, req) => {
    console.log('New WebSocket connection attempt');
    ws.isAuthenticated = false;

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
          sendMachineStatus(ws, data.gymId);
        } else {
          ws.close();
        }
      }
    });
  });
}

export async function broadcastMachineUpdates(gymId) {
  if (!gymId) {
    console.error('No gymId provided for machine status update');
    return;
  }
  
  const machines = await MachineService.getAllMachines(gymId);
  const message = JSON.stringify({
    type: 'machineStatus',
    data: machines
  });

  userSockets.forEach((ws) => {
    if (ws.gymId === gymId) {
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

async function sendMachineStatus(ws, gymId) {
  const machines = await MachineService.getAllMachines(gymId);
  ws.send(JSON.stringify({ type: 'machineStatus', gymId, data: machines }));
}
