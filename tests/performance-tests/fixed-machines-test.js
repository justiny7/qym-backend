// Load test with fixed # of machines
import http from 'k6/http';
import { check, sleep, group } from 'k6';

const numMachines = 100;
const numUsers = 500;
const numIterations = 10;

// Configuration for load testing
export let options = {
  stages: [
    { duration: '30s', target: numUsers },
    { duration: '1m', target: numUsers },
    { duration: '45s', target: 0 },
  ],
};

const API_URL = 'http://localhost:3000';

// Random data generator
function randomString(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyzQWERTYUIOPASDFGHJKLZXCVBNM1234567890';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Create User API Test
function createUser() {
  const url = `${API_URL}/users`;
  const payload = JSON.stringify({
    name: `User-${randomString(10)}`,
    email: `${randomString(10)}@example.com`,
  });
  const params = { headers: { 'Content-Type': 'application/json' } };
  const res = http.post(url, payload, params);

  check(res, {
    'User created successfully': (r) => r.status === 201,
  });

  return JSON.parse(res.body).id; // Return userId
}

// Create Machine API Test
function createMachine() {
  const url = `${API_URL}/machines`;
  const payload = JSON.stringify({
    name: `Machine-${randomString(10)}`,
    type: `Type-${randomString(10)}`,
  });
  const params = { headers: { 'Content-Type': 'application/json' } };
  const res = http.post(url, payload, params);

  check(res, {
    'Machine created successfully': (r) => r.status === 201,
  });

  return JSON.parse(res.body).id; // Return machineId
}

// Get all machines API Test
function getAllMachines() {
  const url = `${API_URL}/machines`;
  const res = http.get(url);

  check(res, {
    'Get all machines successful': (r) => r.status === 200,
  });

  const machines = JSON.parse(res.body);
  let machineIds = [];
  for (let i = 0; i < machines.length; i++) {
    machineIds.push(machines[i].id);
  }
  return machineIds;
}

// Get machine by ID API Test
function getMachineById(machineId) {
  const url = `${API_URL}/machines/${machineId}`;
  const res = http.get(url);

  check(res, {
    'Get machine by ID successful': (r) => r.status === 200,
  });

  return JSON.parse(res.body);
}

// Tag On API Test
function tagOn(userId, machineId) {
  const url = `${API_URL}/machines/${machineId}/workout-logs`;
  const payload = JSON.stringify({ userId });
  const params = { headers: { 'Content-Type': 'application/json' } };
  const res = http.post(url, payload, params);

  check(res, {
    'Tag on successful': (r) => (r.status === 201 || r.status === 500), // Tag on can fail if machine is already tagged on
  });
}

// Tag Off API Test
function tagOff(userId, machineId) {
  const url = `${API_URL}/machines/${machineId}/workout-logs/${userId}`;
  const params = { headers: { 'Content-Type': 'application/json' } };
  const res = http.put(url, null, params);

  check(res, {
    'Tag off successful': (r) => (r.status === 200 || r.status === 500), // Tag off can fail if machine is already tagged off
  });
}

// Enqueue User API Test
function enqueueUser(userId, machineId) {
  const url = `${API_URL}/machines/${machineId}/queue`;
  const payload = JSON.stringify({ userId });
  const params = { headers: { 'Content-Type': 'application/json' } };
  const res = http.post(url, payload, params);

  check(res, {
    'Enqueue successful': (r) => r.status === 201,
  });
}

// Dequeue User API Test
function dequeueUser(userId) {
  const url = `${API_URL}/users/${userId}/queue`;
  const res = http.del(url);

  check(res, {
    'Dequeue successful': (r) => r.status === 200,
  });
}

export default function() {
  // Simulation of user gym session, tagging on/off and enqueuing/dequeuing
  const userId = createUser();
  let machineIds = getAllMachines();
  while (machineIds.length < numMachines) {
    createMachine();
    machineIds = getAllMachines();
  }

  for (let i = 0; i < numIterations; i++) {
    let availableMachines = [];
    for (let machineId of machineIds) {
      if (getMachineById(machineId).currentWorkoutLogId === null) {
        availableMachines.push(machineId);
      }
    }

    const randomMachineId = availableMachines[Math.floor(Math.random() * availableMachines.length)];
    if (getMachineById(randomMachineId).currentWorkoutLogId === null) {
      tagOn(userId, randomMachineId);
      enqueueUser(userId, randomMachineId);

      dequeueUser(userId);
      tagOff(userId, randomMachineId);
    }
  }
}
