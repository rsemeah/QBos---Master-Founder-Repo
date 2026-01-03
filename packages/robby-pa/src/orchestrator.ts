import { createHash } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { getAdapter } from './engines';
import { createReceipt } from './receipt';

export interface Task {
  id: string;
  intent?: string;
  engine: string;
  params?: Record<string, any>;
  requiredProofs?: string[];
}

export async function ensureArtifactDir(sessionId: string) {
  const dir = path.join(process.cwd(), '.robby', 'artifacts', sessionId);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export async function storeArtifact(sessionId: string, taskId: string, content: string) {
  const dir = await ensureArtifactDir(sessionId);
  const filename = `artifact_${taskId}_${Date.now()}.txt`;
  const full = path.join(dir, filename);
  await fs.writeFile(full, content, 'utf8');
  const sha = createHash('sha256').update(content).digest('hex');
  return { uri: `file://${full}`, sha256: sha, contentType: 'text/plain', size: Buffer.byteLength(content) };
}

const errorMemory: Map<string, { hash: string; count: number; lastSeen: number }> = new Map();

export async function executeTask(sessionId: string, task: Task, receiptStore: any, attemptCount = 0): Promise<{ success: boolean; result?: any }> {
  const adapter = getAdapter(task.engine);

  // emit task.started (on first attempt)
  if (attemptCount === 0) {
    await createReceipt({ sessionId, type: 'task.started', payload: { taskId: task.id, engine: task.engine }, store: receiptStore } as any);
  }

  try {
    const res = await adapter.invoke(task.params || {});

    const artifacts = [] as any[];
    if (res.artifacts && res.artifacts.length) {
      for (const a of res.artifacts) {
        // if artifact URI is local virtual, materialize
        if (a.uri && (a.uri.startsWith('local://') || a.uri.startsWith('silent://'))) {
          const content = res.stdout || JSON.stringify(task.params || {});
          const stored = await storeArtifact(sessionId, task.id, content);
          artifacts.push(stored);
        } else {
          artifacts.push(a);
        }
      }
    }

    // Emit task.completed with artifactRefs
    await createReceipt({ sessionId, type: 'task.completed', payload: { taskId: task.id, engine: task.engine }, artifactRefs: artifacts, store: receiptStore } as any);

    // clear error memory on success
    errorMemory.delete(`${sessionId}:${task.id}`);

    return { success: true, result: res };
  } catch (err: any) {
    // fingerprint the error
    const fingerprint = createHash('sha256').update(`${err.name}:${String(err.message || err)}`.slice(0, 300)).digest('hex');
    const key = `${sessionId}:${task.id}`;
    const existing = errorMemory.get(key);

    if (!existing) {
      // first failure - record and retry once
      errorMemory.set(key, { hash: fingerprint, count: 1, lastSeen: Date.now() });

      await createReceipt({ sessionId, type: 'task.retry.attempted', payload: { taskId: task.id, error: String(err), errorFingerprint: fingerprint }, store: receiptStore } as any);

      // small backoff then retry
      await new Promise(r => setTimeout(r, 1000));
      return executeTask(sessionId, task, receiptStore, attemptCount + 1);
    }

    // if same fingerprint seen before -> pivot/stop
    if (existing.hash === fingerprint) {
      await createReceipt({ sessionId, type: 'task.pivoted', payload: { taskId: task.id, reason: 'Identical error on retry', errorFingerprint: fingerprint }, store: receiptStore } as any);

      // Emit execution.needs_input as blocker
      await createReceipt({ sessionId, type: 'execution.needs_input', payload: { taskId: task.id, reason: 'Unable to complete after retry', requiredInput: {} }, store: receiptStore } as any);

      // mark in-memory as counted
      existing.count += 1;
      existing.lastSeen = Date.now();
      errorMemory.set(key, existing);

      throw err;
    }

    // Different fingerprint - treat as new first failure
    errorMemory.set(key, { hash: fingerprint, count: 1, lastSeen: Date.now() });
    await createReceipt({ sessionId, type: 'task.retry.attempted', payload: { taskId: task.id, error: String(err), errorFingerprint: fingerprint }, store: receiptStore } as any);
    await new Promise(r => setTimeout(r, 1000));
    return executeTask(sessionId, task, receiptStore, attemptCount + 1);
  }
}

export default {};

export default {};
