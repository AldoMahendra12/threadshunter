const fs = require('fs');
const crypto = require('crypto');
const http = require('https');

// Define parameters
const SECRET = '58e78c70fa92d5f6cf9151987b265a20'; // From .env.local META_APP_SECRET
const TARGET_URL = 'https://threadshunter-opal.vercel.app/api/webhooks/meta';
const POST_ID = 'DZ-by-_CWvL'; // Monitored Threads Post ID from your dashboard
const COMMENTER_THREADS_ID = '7891234567890'; // A mock Threads ID for the commenter
const COMMENT_ID = 'comment_' + Date.now();

const payload = {
  object: 'threads',
  entry: [
    {
      id: '1016235994595532',
      time: Math.floor(Date.now() / 1000),
      changes: [
        {
          field: 'replies',
          value: {
            id: COMMENT_ID,
            text: 'FREE',
            parent_id: POST_ID,
            from: {
              id: COMMENTER_THREADS_ID
            }
          }
        }
      ]
    }
  ]
};

const rawBody = JSON.stringify(payload);

// Compute signature
const hash = crypto
  .createHmac('sha256', SECRET)
  .update(rawBody)
  .digest('hex');
const signature = `sha256=${hash}`;

console.log('Sending mock webhook payload...');
console.log('Payload:', rawBody);
console.log('Signature:', signature);

const url = new URL(TARGET_URL);
const options = {
  hostname: url.hostname,
  port: 443,
  path: url.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-hub-signature-256': signature,
    'Content-Length': Buffer.byteLength(rawBody)
  }
};

const req = http.request(options, (res) => {
  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  res.on('end', () => {
    console.log(`Server responded with status: ${res.statusCode}`);
    console.log('Response:', responseData);
  });
});

req.on('error', (e) => {
  console.error('Request failed:', e);
});

req.write(rawBody);
req.end();
