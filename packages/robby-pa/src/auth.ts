import { createHmac } from 'crypto';

function base64urlDecode(s: string) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return Buffer.from(s, 'base64').toString();
}

export function verifyJwtHs256(token: string, secret: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [h, p, sig] = parts;
    const data = `${h}.${p}`;
    const expected = createHmac('sha256', secret).update(data).digest('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
    if (sig !== expected) return null;
    const payload = JSON.parse(base64urlDecode(p));
    return payload;
  } catch (e) {
    return null;
  }
}

export function userAuthMiddleware(req: any, res: any, next: any) {
  const auth = req.headers.authorization;
  const apiKey = process.env.ROBBY_API_KEY;
  const supSecret = process.env.SUPABASE_JWT_SECRET;

  if (!auth && !apiKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (auth && auth.startsWith('Bearer ')) {
    const token = auth.slice(7).trim();
    if (apiKey && token === apiKey) {
      req.user = { sub: 'api_key' };
      return next();
    }

    if (supSecret) {
      const payload = verifyJwtHs256(token, supSecret);
      if (payload) {
        req.user = payload;
        return next();
      }
    }
  }

  return res.status(401).json({ error: 'Unauthorized' });
}

export function adminAuthMiddleware(req: any, res: any, next: any) {
  const auth = req.headers.authorization;
  const adminKey = process.env.ROBBY_ADMIN_KEY;
  if (!adminKey) return res.status(500).json({ error: 'Admin key not configured' });
  if (!auth || !auth.startsWith('Bearer ')) return res.status(403).json({ error: 'Forbidden' });
  const token = auth.slice(7).trim();
  if (token !== adminKey) return res.status(403).json({ error: 'Forbidden' });
  req.adminId = 'admin';
  return next();
}

export default {};
