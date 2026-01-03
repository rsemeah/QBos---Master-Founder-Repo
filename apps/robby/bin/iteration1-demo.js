#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const RECEIPTS_PATH = path.resolve(__dirname, '..', 'receipts', 'robby', 'robby.receipts.jsonl');

function ensureDir() {
    const dir = path.dirname(RECEIPTS_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function writeReceipt(type, payload) {
    ensureDir();
    const r = { id: `${type}_${Date.now()}`, timestamp: new Date().toISOString(), type, payload };
    fs.appendFileSync(RECEIPTS_PATH, JSON.stringify(r) + '\n', 'utf8');
    return r;
}

function createSession(initialGoal) {
    const id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    writeReceipt('session.created', { sessionId: id, initialGoal });
    return { id, phase: 'INTENT', state: 'collecting', intent: null, blockers: [] };
}

function submitIntent(session, intent) {
    session.intent = intent;
    session.state = 'confirming';
    writeReceipt('intent.submitted', { sessionId: session.id, intent });
}

function checkReceiptExists(sessionId, type) {
    if (!fs.existsSync(RECEIPTS_PATH)) return false;
    const lines = fs.readFileSync(RECEIPTS_PATH, 'utf8').split(/\r?\n/).filter(Boolean);
    return lines.map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean).some(r => r.type === type && r.payload && (r.payload.sessionId === sessionId || r.payload.sessionId === undefined));
}

async function demo() {
    const s = createSession('Create authenticated user session');
    console.log('created session:', s.id, s.state);

    submitIntent(s, {
        goal: 'Create authenticated user session',
        successCriteria: ['User identity verified'],
        scope: { in: ['Authentication'], out: [] },
        engines: ['IdentityEngine']
    });
    console.log('after submitIntent state:', s.state);

    // Attempt execute without approval
    if (!checkReceiptExists(s.id, 'intent.locked')) {
        s.phase = 'EXECUTION';
        s.state = 'blocked';
        s.blockers = ['intent.locked missing'];
        writeReceipt('execution.blocked', { sessionId: s.id, reason: 'intent_not_locked' });
        console.log('execute attempt result: BLOCKED', s.blockers);
    }

    // Approve intent (human)
    const locked = writeReceipt('intent.locked', { sessionId: s.id, approvedBy: 'human' });
    writeReceipt('intent.locked.ack', { sessionId: s.id, receiptId: locked.id });
    s.state = 'locked';
    console.log('intent approved, state:', s.state);

    // Execute now
    writeReceipt('execution.started', { sessionId: s.id });
    writeReceipt('execution.completed', { sessionId: s.id });
    s.phase = 'EXECUTION';
    s.state = 'completed';
    console.log('execution completed, final status:', { phase: s.phase, state: s.state });

    // Print receipts for session
    const lines = fs.readFileSync(RECEIPTS_PATH, 'utf8').split(/\r?\n/).filter(Boolean);
    const receipts = lines.map(l => JSON.parse(l)).filter(r => r.payload && r.payload.sessionId === s.id);
    console.log('receipts for session:', receipts.map(r => ({ type: r.type, id: r.id })));
}

demo().catch(e => { console.error(e); process.exit(1); });
#!/usr/bin / env node
const fs = require('fs');
const path = require('path');

const RECEIPTS_PATH = path.resolve(__dirname, '..', 'receipts', 'robby', 'robby.receipts.jsonl');

function ensureDir() {
    const dir = path.dirname(RECEIPTS_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function writeReceipt(type, payload) {
    ensureDir();
    const r = { id: `${type}_${Date.now()}`, timestamp: new Date().toISOString(), type, payload };
    fs.appendFileSync(RECEIPTS_PATH, JSON.stringify(r) + '\n', 'utf8');
    return r;
}

function createSession(initialGoal) {
    const id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    writeReceipt('session.created', { sessionId: id, initialGoal });
    return { id, phase: 'INTENT', state: 'collecting', intent: null, blockers: [] };
}

function submitIntent(session, intent) {
    session.intent = intent;
    session.state = 'confirming';
    writeReceipt('intent.submitted', { sessionId: session.id, intent });
}

function checkReceiptExists(sessionId, type) {
    if (!fs.existsSync(RECEIPTS_PATH)) return false;
    const lines = fs.readFileSync(RECEIPTS_PATH, 'utf8').split(/\r?\n/).filter(Boolean);
    return lines.map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean).some(r => r.type === type && r.payload && (r.payload.sessionId === sessionId || r.payload.sessionId === undefined));
}

async function demo() {
    const s = createSession('Create authenticated user session');
    console.log('created session:', s.id, s.state);

    submitIntent(s, {
        goal: 'Create authenticated user session',
        successCriteria: ['User identity verified'],
        scope: { in: ['Authentication'], out: [] },
        engines: ['IdentityEngine']
    });
    console.log('after submitIntent state:', s.state);

    // Attempt execute without approval
    if (!checkReceiptExists(s.id, 'intent.locked')) {
        s.phase = 'EXECUTION';
        s.state = 'blocked';
        s.blockers = ['intent.locked missing'];
        writeReceipt('execution.blocked', { sessionId: s.id, reason: 'intent_not_locked' });
        console.log('execute attempt result: BLOCKED', s.blockers);
    }

    // Approve intent (human)
    const locked = writeReceipt('intent.locked', { sessionId: s.id, approvedBy: 'human' });
    writeReceipt('intent.locked.ack', { sessionId: s.id, receiptId: locked.id });
    s.state = 'locked';
    console.log('intent approved, state:', s.state);

  // Execute now
  #!/usr/bin / env node
    const fs = require('fs');
    const path = require('path');

    const RECEIPTS_PATH = path.resolve(__dirname, '..', 'receipts', 'robby', 'robby.receipts.jsonl');

    function ensureDir() {
        const dir = path.dirname(RECEIPTS_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    }

    function writeReceipt(type, payload) {
        ensureDir();
        const r = { id: `${type}_${Date.now()}`, timestamp: new Date().toISOString(), type, payload };
        fs.appendFileSync(RECEIPTS_PATH, JSON.stringify(r) + '\n', 'utf8');
        return r;
    }

    function createSession(initialGoal) {
        const id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        writeReceipt('session.created', { sessionId: id, initialGoal });
        return { id, phase: 'INTENT', state: 'collecting', intent: null, blockers: [] };
    }

    function submitIntent(session, intent) {
        session.intent = intent;
        session.state = 'confirming';
        writeReceipt('intent.submitted', { sessionId: session.id, intent });
    }

    function checkReceiptExists(sessionId, type) {
        if (!fs.existsSync(RECEIPTS_PATH)) return false;
        const lines = fs.readFileSync(RECEIPTS_PATH, 'utf8').split(/\r?\n/).filter(Boolean);
        return lines.map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean).some(r => r.type === type && r.payload && (r.payload.sessionId === sessionId || r.payload.sessionId === undefined));
    }

    async function demo() {
        const s = createSession('Create authenticated user session');
        console.log('created session:', s.id, s.state);

        submitIntent(s, {
            goal: 'Create authenticated user session',
            successCriteria: ['User identity verified'],
            scope: { in: ['Authentication'], out: [] },
            engines: ['IdentityEngine']
        });
        console.log('after submitIntent state:', s.state);

        // Attempt execute without approval
        if (!checkReceiptExists(s.id, 'intent.locked')) {
            s.phase = 'EXECUTION';
            s.state = 'blocked';
            s.blockers = ['intent.locked missing'];
            writeReceipt('execution.blocked', { sessionId: s.id, reason: 'intent_not_locked' });
            console.log('execute attempt result: BLOCKED', s.blockers);
        }

        // Approve intent (human)
        const locked = writeReceipt('intent.locked', { sessionId: s.id, approvedBy: 'human' });
        writeReceipt('intent.locked.ack', { sessionId: s.id, receiptId: locked.id });
        s.state = 'locked';
        console.log('intent approved, state:', s.state);

        // Execute now
        writeReceipt('execution.started', { sessionId: s.id });
        writeReceipt('execution.completed', { sessionId: s.id });
        s.phase = 'EXECUTION';
        s.state = 'completed';
        console.log('execution completed, final status:', { phase: s.phase, state: s.state });

        // Print receipts for session
        const lines = fs.readFileSync(RECEIPTS_PATH, 'utf8').split(/\r?\n/).filter(Boolean);
        const receipts = lines.map(l => JSON.parse(l)).filter(r => r.payload && r.payload.sessionId === s.id);
        console.log('receipts for session:', receipts.map(r => ({ type: r.type, id: r.id })));
    }

    demo().catch(e => { console.error(e); process.exit(1); });