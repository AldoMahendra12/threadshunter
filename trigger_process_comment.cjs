const http = require('https');

const INTERNAL_SECRET = '6TTl6h58utBWq7XfGToEp6TcRNEPDCHlXBAwsWx6hBY'; // From .env.local
const TARGET_URL = 'https://threadshunter-opal.vercel.app/api/internal/process-comment';

const payload = {
  eventId: '7c96513a-166c-46cf-8eb4-2b2497d38d5f',
  postId: '3b9ffad8-b675-4cb1-9949-55e0202ecbef',
  threadsPostId: 'DZ-by-_CWvL',
  likerThreadsId: '7891234567890',
  userId: '8263aaa1-6849-46e5-b1bd-bd80cb911c71',
  commentId: 'comment_1782448923675',
  commentText: 'FREE'
};

const rawBody = JSON.stringify(payload);

console.log('Sending manual process-comment request...');
console.log('Payload:', rawBody);

const url = new URL(TARGET_URL);
const options = {
  hostname: url.hostname,
  port: 443,
  path: url.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-internal-api-secret': INTERNAL_SECRET,
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
