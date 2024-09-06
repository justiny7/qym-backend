import http from 'k6/http';
import { check, sleep, group } from 'k6';

// Configuration for load testing
export let options = {
  stages: [
    { duration: '30s', target: 20 }, // Ramp-up to 20 users over 30 seconds
    { duration: '1m', target: 20 },  // Stay at 20 users for 1 minute
    { duration: '45s', target: 0 },  // Ramp-down to 0 users
  ],
};

const API_URL = 'http://localhost:3000/api'; // Update this with your API URL

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

// Tag On API Test
function tagOn(userId, machineId) {
  const url = `${API_URL}/machines/${machineId}/tag-on`;
  const payload = JSON.stringify({ userId });
  const params = { headers: { 'Content-Type': 'application/json' } };
  const res = http.post(url, payload, params);

  check(res, {
    'Tag on successful': (r) => r.status === 201,
  });
}

// Tag Off API Test
function tagOff(userId, machineId) {
  const url = `${API_URL}/machines/${machineId}/tag-off`;
  const payload = JSON.stringify({ userId });
  const params = { headers: { 'Content-Type': 'application/json' } };
  const res = http.post(url, payload, params);

  check(res, {
    'Tag off successful': (r) => r.status === 200,
  });
}

// Enqueue User API Test
function enqueueUser(userId, machineId) {
  const url = `${API_URL}/users/${userId}/enqueue`;
  const payload = JSON.stringify({ machineId });
  const params = { headers: { 'Content-Type': 'application/json' } };
  const res = http.post(url, payload, params);

  check(res, {
    'Enqueue successful': (r) => r.status === 201,
  });
}

// Dequeue User API Test
function dequeueUser(machineId) {
  const url = `${API_URL}/machines/${machineId}/dequeue`;
  const res = http.del(url);

  check(res, {
    'Dequeue successful': (r) => r.status === 200,
  });
}

// Main function for running load tests
export default function () {

  const numMachines = 100;
  const numUsers = 1000;

  let users = [];
  let userMachine = [];
  let machines = [];
  let machineQueue = [];

  group('Create Users and Machines', () => {
    for (let i = 0; i < numUsers; i++) {
      users.push(createUser());
      userMachine.push(Math.floor(Math.random() * numMachines));
    }
    for (let i = 0; i < numMachines; i++) {
      machines.push(createMachine());
      machineQueue.push(0);
    }
  });

  for (let i = 0; i < numUsers; i++) {
    group('Tag on/off + enqueue', () => {
      for (let j = i - 1; j >= 0; j--) {
        if (userMachine[i] === userMachine[j]) {
          tagOff(users[j], machines[userMachine[j]]);
          break;
        }
      }
      tagOn(users[i], machines[userMachine[i]]);
      
      let machineId = Math.floor(Math.random() * numMachines);
      enqueueUser(users[i], machines[machineId]);
      machineQueue[machineId] += 1;
    });
  }

  group('Dequeue', () => {
    for (let i = 0; i < numMachines; i++) {
      while (machineQueue[i] > 0) {
        dequeueUser(machines[i]);
        machineQueue[i] -= 1;
      }
    }
  });

  sleep(1);  // Simulate a short wait between iterations
}
