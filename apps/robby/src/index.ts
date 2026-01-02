#!/usr/bin/env node
import { calibrate } from './core/calibration.js';
import { rotateKey } from './core/key-rotation.js';
import { certify, verify } from './core/verification.js';
import { retro } from './workflows/retro.js';

async function main() {
  const cwd = process.cwd();
  const cmd = process.argv[2];
  if (!cmd) {
    console.error('Usage: calibrate|verify|certify|retro|rotate-key');
    process.exit(2);
  }
  try {
    if (cmd === 'calibrate') {
      const res = await calibrate(cwd);
      console.log(JSON.stringify(res, null, 2));
      process.exit(res.status === 'READY' ? 0 : 1);
    }
    if (cmd === 'verify') {
      const res = await verify(cwd);
      console.log(JSON.stringify(res, null, 2));
      process.exit(res.status === 'VERIFIED' ? 0 : 1);
    }
    if (cmd === 'certify') {
      const res = await certify(cwd);
      console.log(JSON.stringify(res, null, 2));
      process.exit(res.status === 'VERIFIED' ? 0 : 1);
    }
    if (cmd === 'retro') {
      const res = await retro();
      console.log(JSON.stringify(res, null, 2));
      process.exit(0);
    }
    if (cmd === 'rotate-key') {
      const r = await rotateKey();
      console.log(JSON.stringify(r, null, 2));
      process.exit(0);
    }
    console.error('Unknown command', cmd);
    process.exit(2);
  } catch (e) {
    console.error('ERROR', e);
    process.exit(3);
  }
}

main();
