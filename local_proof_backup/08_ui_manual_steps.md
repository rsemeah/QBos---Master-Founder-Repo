# Manual UI Validation Steps

## Prerequisites
```bash
cd /workspaces/QBos---Master-Founder-Repo/apps/proof-harness
npm install
npm run dev
```

## Test Flow

### 1. Navigate to Rob Builder
- Open http://localhost:3000/rob
- Verify: Page loads without errors
- Verify: Left panel shows chat interface
- Verify: Right panel shows preview area
- Verify: Status badge shows state from TruthSerum

### 2. Create Session
- Page auto-creates session on mount
- Verify: Session ID appears in header
- Verify: Initial receipts written (identity.authenticated, billing.active)

### 3. Send Chat Message
- Type: "Build me a landing page"
- Click send
- Verify: User message appears
- Verify: Rob responds (sanitized if missing proofs)
- Verify: Receipt count increases

### 4. Check Truth Status
- Verify: Shows TruthState (Verified/Unknown/Blocked)
- Verify: Lists missing proofs if any
- Verify: Shows next actions

### 5. Navigate to Engines
- Click any engine tile
- Verify: No 404 error
- Verify: Engine page shows receipts
- Verify: Shows "Unknown" if no receipts found
- Verify: Back/Forward links work

## Success Criteria
- ✅ No 404 errors
- ✅ No runtime exceptions
- ✅ Truth status from receipts only
- ✅ Missing proofs communicated
- ✅ All engine pages accessible
