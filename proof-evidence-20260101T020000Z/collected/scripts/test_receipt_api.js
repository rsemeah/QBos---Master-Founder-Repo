// Node script to POST a sample receipt to /api/receipts. Useful when server is running.
// Usage: node scripts/test_receipt_api.js [port]
const http = require('http');

const port = process.argv[2] || 3000;
const data = JSON.stringify({
  type: 'test.receipt',
  proof_type: 'integration_test',
  payload: { ok: true, timestamp: new Date().toISOString() },
});

const options = {
  hostname: 'localhost',
  port: port,
  path: '/api/receipts',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
  },
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => (body += chunk));
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', body);
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});

req.write(data);
req.end();
