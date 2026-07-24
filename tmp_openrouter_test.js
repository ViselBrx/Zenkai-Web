const fs = require('fs');
const https = require('https');

const env = fs.readFileSync('.env', 'utf8');
const keyLine = env.split(/\r?\n/).find(line => line.startsWith('OPENROUTER_API_KEY='));
if (!keyLine) {
  console.error('NO_OPENROUTER_KEY');
  process.exit(1);
}
const value = keyLine.split('=')[1].replace(/^['\"]|['\"]$/g, '');
const body = JSON.stringify({
  model: 'google/gemma-4-31b-it:free',
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Say hi.' }
  ],
  temperature: 0.7,
  max_tokens: 50
});
const req = https.request('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${value}`
  }
}, (res) => {
  console.log('status', res.statusCode);
  let d = '';
  res.on('data', (chunk) => {
    d += chunk;
  });
  res.on('end', () => {
    console.log('body', d);
  });
});
req.on('error', (e) => {
  console.error('ERROR', e.message);
});
req.setTimeout(15000, () => {
  console.error('TIMEOUT');
  req.abort();
});
req.write(body);
req.end();
