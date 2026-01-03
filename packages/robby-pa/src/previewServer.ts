import express, { NextFunction, Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';

const app = express();

interface PreviewConfig {
  previewUrl: string;
  expiresAt: string;
  accessToken: string;
  maxRequests: number;
}

const requestCounters = new Map<string, number>();

async function loadPreviewConfig(sessionId: string): Promise<PreviewConfig | null> {
  const file = path.join(process.cwd(), '.robby', 'previews', `${sessionId}.json`);
  try {
    const raw = await fs.readFile(file, 'utf8');
    return JSON.parse(raw) as PreviewConfig;
  } catch (e) {
    return null;
  }
}

app.use('/preview/:sessionId', async (req: Request, res: Response, next: NextFunction) => {
  const sessionId = String(req.params.sessionId || '');
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : null;

  const cfg = await loadPreviewConfig(sessionId);
  if (!cfg) return res.status(404).json({ error: 'preview not found' });

  if (!token || token !== cfg.accessToken) return res.status(401).json({ error: 'Unauthorized' });

  if (new Date() > new Date(cfg.expiresAt)) return res.status(410).json({ error: 'Preview expired' });

  // simple rate limit
  const key = `preview:${sessionId}`;
  const count = (requestCounters.get(key) || 0) + 1;
  requestCounters.set(key, count);
  if (count > (cfg.maxRequests || 1000)) return res.status(429).json({ error: 'Rate limit exceeded' });

  // serve static files from artifacts dir
  const dir = path.join(process.cwd(), '.robby', 'artifacts', sessionId);
  express.static(dir)(req, res, next);
});

export default app;

if (require.main === module) {
  const PORT = process.env.ROBBY_PREVIEW_PORT || 3001;
  app.listen(PORT, () => console.log('preview server listening on', PORT));
}
