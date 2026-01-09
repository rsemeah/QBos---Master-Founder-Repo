import bodyParser from 'body-parser';
import express from 'express';
import { adminAuthMiddleware, userAuthMiddleware } from './auth';
import { createReceipt } from './receipt';
import InMemoryStore from './store/inMemoryStore';
import PostgresReceiptStore from './store/postgresStore';
import { InMemorySessionStore, PostgresSessionStore } from './store/sessionStore';

const app: any = express();
app.use(bodyParser.json());

const usePostgres = !!process.env.PGHOST || !!process.env.PG_CONNECTION_STRING;
const sessionStore = usePostgres ? new PostgresSessionStore() : new InMemorySessionStore();
const receiptStore = usePostgres ? new PostgresReceiptStore() : new InMemoryStore();

app.post('/api/v1/sessions', userAuthMiddleware, async (req: any, res: any) => {
  try {
    const initial = req.body || {};
    const session = await sessionStore.createSession(initial);

    // emit session.created receipt
    await createReceipt({
      sessionId: session.id,
      type: 'session.created',
      payload: { createdBy: (req as any).user?.sub || 'unknown' },
      store: {
        getLastReceiptForSession: receiptStore.getLastReceiptForSession.bind(receiptStore),
        insertReceipt: receiptStore.insertReceipt.bind(receiptStore)
      }
    } as any);

    // Auto-approval: lock intent immediately when non-interactive policy allows
    const autoApprove = (process.env.ROBBY_AUTO_APPROVE_INTENT || '').toLowerCase();
    if (autoApprove === 'true' || autoApprove === '1') {
      await sessionStore.updateSession(session.id, { phase: 'INTENT', sub_state: 'locked', ux_state: 'shaping', locked_at: new Date().toISOString() } as any);
      await createReceipt({
        sessionId: session.id,
        type: 'intent.locked',
        payload: { by: 'policy' },
        store: {
          getLastReceiptForSession: receiptStore.getLastReceiptForSession.bind(receiptStore),
          insertReceipt: receiptStore.insertReceipt.bind(receiptStore)
        }
      } as any);
      const updated = await sessionStore.getSession(session.id);
      return res.status(201).json(updated);
    }

    res.status(201).json(session);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/v1/sessions/:id/approve', userAuthMiddleware, async (req: any, res: any) => {
  try {
    const id = req.params.id;
    const session = await sessionStore.getSession(id);
    if (!session) return res.status(404).json({ error: 'not found' });

    // Transition to INTENT.locked
    await sessionStore.updateSession(id, { phase: 'INTENT', sub_state: 'locked', ux_state: 'shaping', locked_at: new Date().toISOString() } as any);

    await createReceipt({
      sessionId: id,
      type: 'intent.locked',
      payload: { by: (req as any).user?.sub || 'unknown' },
      store: {
        getLastReceiptForSession: receiptStore.getLastReceiptForSession.bind(receiptStore),
        insertReceipt: receiptStore.insertReceipt.bind(receiptStore)
      }
    } as any);

    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/v1/sessions/:id/status', userAuthMiddleware, async (req: any, res: any) => {
  const id = req.params.id;
  const session = await sessionStore.getSession(id);
  if (!session) return res.status(404).json({ error: 'not found' });
  // user-facing UX state
  res.json({ phase: session.phase, sub_state: session.sub_state, ux_state: session.ux_state });
});

app.get('/api/v1/sessions/:id/receipts', userAuthMiddleware, async (req: any, res: any) => {
  const id = req.params.id;
  const receipts = await receiptStore.getReceiptsForSession(id);
  res.json(receipts);
});

// admin transition endpoint
app.post('/api/v1/admin/sessions/:id/transition', adminAuthMiddleware, async (req: any, res: any) => {
  const id = req.params.id;
  const { targetPhase, targetState } = req.body;
  const session = await sessionStore.getSession(id);
  if (!session) return res.status(404).json({ error: 'not found' });
  await sessionStore.updateSession(id, { phase: targetPhase, sub_state: targetState } as any);

  await createReceipt({
    sessionId: id,
    type: 'admin.forced_transition',
    payload: { targetPhase, targetState, adminId: (req as any).adminId },
    store: {
      getLastReceiptForSession: receiptStore.getLastReceiptForSession.bind(receiptStore),
      insertReceipt: receiptStore.insertReceipt.bind(receiptStore)
    }
  } as any);

  res.json({ success: true });
});

const PORT = process.env.ROBBY_PORT || 4002;
app.listen(PORT, () => console.log('robby-pa server listening on', PORT));

export default app;
