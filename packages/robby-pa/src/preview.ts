import { randomBytes } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { createReceipt } from './receipt';

export interface PreviewConfig {
  previewUrl: string;
  expiresAt: string;
  accessToken: string;
  indexed: boolean;
  rateLimited: boolean;
  maxRequests: number;
  artifactPaths: Array<string>;
}

export async function ensurePreviewDir() {
  const dir = path.join(process.cwd(), '.robby', 'previews');
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export function generateSecureToken() {
  return randomBytes(24).toString('hex');
}

export async function generatePreview(sessionId: string, artifactPaths: string[], receiptStore: any): Promise<PreviewConfig> {
  const dir = await ensurePreviewDir();

  const accessToken = generateSecureToken();
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();

  const previewConfig: PreviewConfig = {
    previewUrl: `http://localhost:3001/preview/${sessionId}`,
    expiresAt,
    accessToken,
    indexed: false,
    rateLimited: true,
    maxRequests: 1000,
    artifactPaths
  };

  const file = path.join(dir, `${sessionId}.json`);
  await fs.writeFile(file, JSON.stringify(previewConfig, null, 2), 'utf8');

  // Emit receipt
  await createReceipt({
    sessionId,
    type: 'preview.created',
    payload: { url: previewConfig.previewUrl, expiresAt },
    artifactRefs: artifactPaths.map(p => ({ uri: p })),
    store: receiptStore
  } as any);

  return previewConfig;
}

export default {};
