import * as fs from 'node:fs';
import * as path from 'node:path';
import { robbyReceipt } from '../util/robby-receipt.js';

type StepResult = { name: string; cmd: string; exitCode: number; stdout: string; stderr: string };

async function runStep(cmd: string, cwd: string): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  // Use child_process.exec with a shell to reliably support compound commands (&&, |, etc.)
  try {
    const child = await import('node:child_process');
    const execFile = child.execFile;
    return await new Promise((resolve) => {
      const shell = process.platform === 'win32' ? 'cmd.exe' : '/bin/bash';
      const args = process.platform === 'win32' ? ['/d', '/s', '/c', cmd] : ['-lc', cmd];
      execFile(shell, args, { cwd, maxBuffer: 10 * 1024 * 1024 }, (error: any, stdout: string, stderr: string) => {
        const exitCode = error && typeof error.code === 'number' ? error.code : 0;
        resolve({ exitCode, stdout: stdout ?? '', stderr: stderr ?? '' });
      });
    });
  } catch (e: any) {
    return { exitCode: 1, stdout: e?.stdout ?? '', stderr: String(e?.message || e) };
  }
}

export async function verify(cwd: string) {
  const steps: { name: string; cmd: string }[] = [
    // invoke via bash to avoid relying on executable bit in dev environments
    { name: 'collect-proof-evidence', cmd: 'NO_INSTALL=1 bash ./scripts/collect-proof-evidence.sh' },
    { name: 'verify-latest', cmd: 'bash ./scripts/verify-latest.sh' },
    { name: 'truth-built-works-report', cmd: 'node scripts/truth-built-works-report.mjs' }
  ];

  const results: StepResult[] = [];
  await robbyReceipt('robby.verification.ladder.start', { cwd, steps: steps.map(s => s.name) });

  for (const s of steps) {
    const res = await runStep(s.cmd, cwd);
    const stepResult: StepResult = { name: s.name, cmd: s.cmd, exitCode: res.exitCode, stdout: res.stdout, stderr: res.stderr };
    results.push(stepResult);
    await robbyReceipt(`robby.verification.step.${s.name}`, { step: s.name, exitCode: res.exitCode });
    if (res.exitCode !== 0) break;
  }

  const out = { timestamp: new Date().toISOString(), steps: results };
  const outPath = path.resolve('artifacts/robby.verification.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');

  const reportStep = results.find(r => r.name === 'truth-built-works-report');
  let summary = { verified: 0, failed: 0, unknown: 0, parseErrors: 0 };
  if (reportStep) {
    const outTxt = (reportStep.stdout || '') + '\n' + (reportStep.stderr || '');
    summary.verified = parseInt((outTxt.match(/Verified=(\d+)/) || [])[1] || '0', 10);
    summary.failed = parseInt((outTxt.match(/Failed=(\d+)/) || [])[1] || '0', 10);
    summary.unknown = parseInt((outTxt.match(/Unknown=(\d+)/) || [])[1] || '0', 10);
    summary.parseErrors = parseInt((outTxt.match(/ParseErrors=(\d+)/) || [])[1] || '0', 10);
  }

  const status = (summary.failed === 0 && summary.unknown === 0 && summary.parseErrors === 0 && summary.verified > 0) ? 'VERIFIED' : 'UNKNOWN';

  await robbyReceipt('robby.verification.complete', { status, summary });
  return { status, summary, steps: results };
}

export async function certify(cwd: string) {
  // For now certify delegates to verify and can be extended with
  // additional certification logic (DB writes, audit, etc.).
  return await verify(cwd);
}
