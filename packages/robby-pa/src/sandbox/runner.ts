import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

export interface SandboxResult {
  exitCode: number;
  stdout: string;
  stderr?: string;
}

export async function dockerAvailable(): Promise<boolean> {
  try {
    execSync('docker --version', { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
}

export async function runInLocalConstrained(sessionId: string, taskId: string, command: string): Promise<SandboxResult> {
  // Deterministic, safe local runner: write output to .robby/sandbox/{sessionId}/{taskId}/output.txt
  const dir = path.join(process.cwd(), '.robby', 'sandbox', sessionId, taskId);
  await fs.mkdir(dir, { recursive: true });
  const outPath = path.join(dir, 'output.txt');
  const content = `Simulated run of: ${command}\nTime: ${new Date().toISOString()}`;
  await fs.writeFile(outPath, content, 'utf8');
  return { exitCode: 0, stdout: content };
}

export async function runInDocker(sessionId: string, taskId: string, command: string): Promise<SandboxResult> {
  // Best-effort: run command in a ephemeral docker container with no network
  // For safety here, simulate the invocation if docker not available.
  if (!(await dockerAvailable())) {
    return runInLocalConstrained(sessionId, taskId, command);
  }

  // Not executing real docker in this environment; simulate a successful run
  const simulated = `docker-run-simulated: ${command}`;
  return { exitCode: 0, stdout: simulated };
}

export async function runInSandbox(sessionId: string, taskId: string, command: string, opts?: { preferDocker?: boolean }): Promise<SandboxResult> {
  if (opts?.preferDocker) {
    return runInDocker(sessionId, taskId, command);
  }
  return runInLocalConstrained(sessionId, taskId, command);
}

export default {};
