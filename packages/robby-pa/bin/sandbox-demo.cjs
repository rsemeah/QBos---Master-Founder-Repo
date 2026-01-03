#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

async function demo() {
  const sessionId = 'session_sandbox_demo';
  const taskId = 'task_shell_1';
  const cmd = 'echo hello-world';

  const dir = path.join(process.cwd(), '.robby', 'sandbox', sessionId, taskId);
  fs.mkdirSync(dir, { recursive: true });
  const outPath = path.join(dir, 'output.txt');
  const content = `Simulated run of: ${cmd}\nTime: ${new Date().toISOString()}`;
  fs.writeFileSync(outPath, content, 'utf8');

  console.log('Sandbox result: 0', content.slice(0, 200));
}

demo().catch(e => { console.error(e); process.exit(1); });
