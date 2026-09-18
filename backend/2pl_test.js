// 2pl_test.js
// This script simulates 1000 concurrent votes to the backend API.
// Without 2PL (Two-Phase Locking) or proper database concurrency mechanisms,
// many of these votes would be lost due to race conditions.
const http = require('http');

const CONCURRENT_REQUESTS = 1000;
const STAGE_ID = 1;
const TRACK_ID = 'test_track_1';
const VOTE_VALUE = 1;

async function sendVote() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      stage_id: STAGE_ID,
      track_id: TRACK_ID,
      vote_value: VOTE_VALUE
    });

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/vote',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(body));
    });

    req.on('error', (e) => reject(e));
    req.write(data);
    req.end();
  });
}

async function runTest() {
  console.log(`Starting load test: Sending ${CONCURRENT_REQUESTS} concurrent votes...`);
  const startTime = Date.now();
  
  const promises = [];
  for (let i = 0; i < CONCURRENT_REQUESTS; i++) {
    promises.push(sendVote().catch(err => console.error('Request failed:', err.message)));
  }

  await Promise.all(promises);
  const endTime = Date.now();
  
  console.log(`Finished sending ${CONCURRENT_REQUESTS} votes in ${endTime - startTime}ms.`);
  console.log('Check the Admin Dashboard or database to verify the vibe score accurately captured all 1000 votes without "lost updates".');
}

runTest();
