#!/usr/bin/env node
import { spawn } from 'child_process';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// place receipts adjacent to this script to avoid nested cwd issues
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCRIPT_ROOT = path.resolve(__dirname, '..');
const RECEIPTS_DIR = path.join(SCRIPT_ROOT, 'receipts');
await fs.mkdir(RECEIPTS_DIR, { recursive: true });
// Root of repository / working directory for commands
const ROOT = process.cwd();

let seq = 0;
let prevHash = null;
function sha256Hex(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}
function hmacHex(key, msg) {
  return crypto.createHmac('sha256', key).update(msg).digest('hex');
}

async function writeReceipt(obj) {
  const json = JSON.stringify(obj, null, 2);
  const h = sha256Hex(json);
  obj.hash = h;
  if (process.env.ROBBY_RECEIPT_MAC_SECRET) {
    obj.mac = {
      key_id: process.env.ROBBY_RECEIPT_MAC_KEY_ID || 'robby-v1-primary',
      value: hmacHex(process.env.ROBBY_RECEIPT_MAC_SECRET, h)
    };
  }
  const file = path.join(RECEIPTS_DIR, `${String(seq).padStart(4, '0')}_${obj.type}_${Date.now()}.json`);
  await fs.writeFile(file, JSON.stringify(obj, null, 2));
  seq += 1;
  prevHash = obj.hash;
  return file;
}

async function runCommand(stepName, cmd, args, opts = {}) {
  const stamp = Date.now();
  const stdoutPath = path.join(RECEIPTS_DIR, `${String(seq).padStart(4, '0')}_${stepName}_${stamp}.stdout.log`);
  const stderrPath = path.join(RECEIPTS_DIR, `${String(seq).padStart(4, '0')}_${stepName}_${stamp}.stderr.log`);
  const outStream = await fs.open(stdoutPath, 'w');
  const errStream = await fs.open(stderrPath, 'w');

  return new Promise((resolve) => {
    const child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], ...opts });
    child.stdout.on('data', async (d) => { await outStream.write(d); });
    child.stderr.on('data', async (d) => { await errStream.write(d); });
    child.on('close', async (code, signal) => {
      await outStream.close();
      await errStream.close();

      const stdoutBuf = await fs.readFile(stdoutPath);
      const stderrBuf = await fs.readFile(stderrPath);
      const stdoutHash = sha256Hex(stdoutBuf);
      const stderrHash = sha256Hex(stderrBuf);

      const receipt = {
        seq: seq,
        type: `step.${stepName}`,
        command: [cmd, ...args].join(' '),
        exit_code: code,
        signal: signal || null,
        stdout: path.relative(ROOT, stdoutPath),
        stderr: path.relative(ROOT, stderrPath),
        stdout_hash: stdoutHash,
        stderr_hash: stderrHash,
        timestamp: new Date().toISOString(),
        prev_hash: prevHash
      };

      await writeReceipt(receipt);
      resolve({ code, signal, receipt });
    });
  });
}

function checkEnvOrFail() {
  if (!process.env.ROBBY_RECEIPT_MAC_SECRET) {
    const r = {
      seq,
      type: 'run.failed',
      reason: 'missing_env',
      missing: ['ROBBY_RECEIPT_MAC_SECRET'],
      timestamp: new Date().toISOString(),
      prev_hash: prevHash
    };
    awaitWriteAndExit(r, 2);
  }
}

async function awaitWriteAndExit(obj, code) {
  await writeReceipt(obj);
  console.error('Fail-closed:', obj.reason || obj);
  process.exit(code);
}

async function main() {
  // enforce secret present
  if (!process.env.ROBBY_RECEIPT_MAC_SECRET) {
    const r = {
      seq,
      type: 'run.failed',
      reason: 'missing_env',
      missing: ['ROBBY_RECEIPT_MAC_SECRET'],
      timestamp: new Date().toISOString(),
      prev_hash: prevHash
    };
    await writeReceipt(r);
    console.error('Missing ROBBY_RECEIPT_MAC_SECRET — aborting (fail-closed)');
    process.exit(2);
  }

  const steps = [
    { name: 'unit-tests', cmd: 'pnpm', args: ['test:unit'], opts: { cwd: path.join(ROOT, 'packages', 'robby-pa') } },
    { name: 'start-postgres', cmd: 'docker-compose', args: ['-f', 'packages/robby-pa/dev/docker-compose.pg.yml', 'up', '-d', '--force-recreate'] },
    { name: 'migrate', cmd: 'node', args: ['packages/robby-pa/bin/migrate.cjs'] },
    { name: 'integration-tests', cmd: 'pnpm', args: ['test:integration'], opts: { cwd: path.join(ROOT, 'packages', 'robby-pa') } },
    { name: 'teardown-postgres', cmd: 'docker-compose', args: ['-f', 'packages/robby-pa/dev/docker-compose.pg.yml', 'down', '-v'] }
  ];

  for (const s of steps) {
    // special pre-check for docker
    if (s.name.startsWith('start-postgres') || s.name.startsWith('teardown-postgres')) {
      try {
        const which = spawn('docker', ['--version']);
        which.on('error', async () => {
          const r = {
            seq,
            type: 'run.failed',
            reason: 'docker_not_available',
            detail: s.name,
            timestamp: new Date().toISOString(),
            prev_hash: prevHash
          };
          await writeReceipt(r);
          console.error('Docker not available — aborting (fail-closed)');
          process.exit(3);
        });
      } catch (e) {
        const r = {
          seq,
          type: 'run.failed',
          reason: 'docker_not_available',
          detail: s.name,
          timestamp: new Date().toISOString(),
          prev_hash: prevHash
        };
        await writeReceipt(r);
        console.error('Docker not available — aborting (fail-closed)');
        process.exit(3);
      }
    }

    console.log('Running step:', s.name, s.cmd, s.args.join(' '));
    // run
    // eslint-disable-next-line no-await-in-loop
    const res = await runCommand(s.name, s.cmd, s.args, { env: process.env });
    if (res.code !== 0) {
      const r = {
        seq,
        type: 'run.failed',
        reason: 'step_failed',
        step: s.name,
        exit_code: res.code,
        timestamp: new Date().toISOString(),
        prev_hash: prevHash
      };
      await writeReceipt(r);
      console.error('Step failed:', s.name, 'exit code', res.code);
      process.exit(4);
    }
  }

  // final summary receipt
  const final = {
    seq,
    type: 'run.succeeded',
    timestamp: new Date().toISOString(),
    prev_hash: prevHash
  };
  await writeReceipt(final);
  // verify receipt chain
  try {
    const chainOk = await verifyReceipts(RECEIPTS_DIR, process.env.ROBBY_RECEIPT_MAC_SECRET);
    if (!chainOk) {
      const r = { seq, type: 'run.failed', reason: 'receipt_chain_invalid', timestamp: new Date().toISOString(), prev_hash: prevHash };
      await writeReceipt(r);
      console.error('Receipt chain verification failed — aborting (fail-closed)');
      process.exit(5);
    }
  } catch (e) {
    const r = { seq, type: 'run.error', error: String(e), timestamp: new Date().toISOString(), prev_hash: prevHash };
    await writeReceipt(r);
    console.error('Receipt chain verification error — aborting (fail-closed)');
    process.exit(6);
  }

  console.log('Verification run completed — receipts saved to', RECEIPTS_DIR);
}

async function verifyReceipts(dir, secret) {
  const files = await fs.readdir(dir);
  const receipts = [];
  for (const f of files) {
    if (!f.endsWith('.json')) continue;
    const raw = await fs.readFile(path.join(dir, f), 'utf8');
    try {
      const obj = JSON.parse(raw);
      receipts.push(obj);
    } catch (e) {
      // ignore
    }
  }
  receipts.sort((a, b) => (a.seq || 0) - (b.seq || 0));

  let prev = null;
  for (const r of receipts) {
    const { mac, hash, ...withoutMac } = r;
    const computedHash = crypto.createHash('sha256').update(JSON.stringify(withoutMac)).digest('hex');
    if (computedHash !== r.hash) return false;
    const expectedMac = crypto.createHmac('sha256', secret).update(r.hash).digest('hex');
    if (r.mac && r.mac.value) {
      if (r.mac.value !== expectedMac) return false;
    } else if (r.mac) {
      // legacy mac as string
      if (r.mac !== expectedMac) return false;
    } else {
      return false;
    }

    if (prev === null) {
      if (r.prev_hash !== null && r.prev_hash !== undefined) return false;
      if (r.seq !== 0) return false;
    } else {
      if (r.prev_hash !== prev.hash) return false;
      if (r.seq !== prev.seq + 1) return false;
    }
    prev = r;
  }
  return true;
}

main().catch(async (err) => {
  const r = {
    seq,
    type: 'run.error',
    error: String(err && err.stack ? err.stack : err),
    timestamp: new Date().toISOString(),
    prev_hash: prevHash
  };
  await writeReceipt(r);
  console.error('Unexpected error:', err);
  process.exit(10);
});
