import { execa } from 'execa';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { robbyReceipt } from '../util/robby-receipt.js';

type StepResult = { name: string; cmd: string; exitCode: number; stdout: string; stderr: string };

async function runStep(cmd: string, cwd: string): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  try {
    const r = await execa.command(cmd, { cwd, shell: true, reject: false });
    return { exitCode: r.exitCode ?? 0, stdout: r.stdout ?? '', stderr: r.stderr ?? '' };
  } catch (e: any) {
    return { exitCode: 1, stdout: e.stdout ?? '', stderr: String(e.message || e) };
  }
}

export async function verify(cwd: string) {
  const steps: { name: string; cmd: string }[] = [
    { name: 'collect-proof-evidence', cmd: 'NO_INSTALL=1 ./scripts/collect-proof-evidence.sh' },
    { name: 'verify-latest', cmd: 'chmod +x ./scripts/verify-latest.sh && ./scripts/verify-latest.sh' },
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
  const v = await verify(cwd);
  const outPath = path.resolve('artifacts/robby.certify.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify({ timestamp: new Date().toISOString(), verification: v }, null, 2), 'utf8');

  if (v.status !== 'VERIFIED') {
    await robbyReceipt('robby.certify.failed', { status: v.status, summary: v.summary });
    return { status: 'FAILED', verification: v };
  }

  await robbyReceipt('robby.certify.success', { status: 'VERIFIED', summary: v.summary });
  return { status: 'VERIFIED', verification: v };
}
