# Rob UI - Vite + React Frontend

**Status:** Installed and ready to run  
**Port:** 3001 (Vite dev server)  
**Backend:** Proxies to http://localhost:3000 (Next.js proof-harness)

---

## ✅ AUTOMATED SETUP COMPLETE

All files created and dependencies installed.

---

## 🚀 MANUAL STEPS TO START

### Step 1: Start Backend API (Terminal 1)

```bash
cd /workspaces/QBos---Master-Founder-Repo/apps/proof-harness
npm run dev
```

**Expected output:**
```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
- ready started server on 0.0.0.0:3000
```

**Keep this terminal running.**

---

### Step 2: Start Vite UI (Terminal 2)

```bash
cd /workspaces/QBos---Master-Founder-Repo/apps/rob-ui
npm run dev
```

**Expected output:**
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:3001/
➜  Network: use --host to expose
```

**Keep this terminal running.**

---

### Step 3: Open Browser

Navigate to: **http://localhost:3001/rob**

---

## 🧪 TEST THE INTEGRATION

### Test 1: Session Initialization

1. Page loads
2. **Expected:** Session initializes automatically
3. **Expected:** Rob asks for consent
4. **Expected:** Status bar shows:
   - State: INIT
   - Progress: 0%
   - Consent: Pending

### Test 2: Consent Grant

1. Type: `I consent`
2. Press Enter
3. **Expected:** 
   - Consent icon turns green
   - State changes to LISTENING
   - Progress increases to 10%
   - Rob responds: "✅ Consent granted..."

### Test 3: Interaction

1. Type: `show preview`
2. Press Enter
3. **Expected:** Rob responds with preview message
4. **Expected:** State may change to VERIFYING
5. **Expected:** Progress increases

### Test 4: Help Command

1. Type: `help`
2. **Expected:** Rob explains what it can do

---

## 🔍 WHAT'S WIRED

✅ **API Client:** `src/lib/rob-client.ts`
- `initSession()` → POST /api/rob/init
- `sendMessage()` → POST /api/rob/message
- TypeScript interfaces for type safety

✅ **Main Component:** `src/pages/RobPage.tsx`
- Session initialization on mount
- Message input/display
- Real-time state updates
- Loading states
- Error handling
- Auto-scroll to latest message

✅ **Routing:** `src/App.tsx`
- `/` → redirects to `/rob`
- `/rob` → Rob chat page

✅ **Styling:** Tailwind CSS
- Responsive design
- Message bubbles
- Status indicators
- Loading animations

---

## 🛠️ TROUBLESHOOTING

### Issue: "Failed to initialize session"

**Check:**
1. Is backend running on port 3000?
2. Run: `curl http://localhost:3000/api/health`
3. Should return JSON with status

### Issue: "Network request failed"

**Check:**
1. Vite proxy configured? (Yes, in vite.config.ts)
2. Backend reachable? (Try curl command above)
3. CORS issues? (Proxy should handle this)

### Issue: "Module not found"

**Run:**
```bash
cd /workspaces/QBos---Master-Founder-Repo/apps/rob-ui
rm -rf node_modules package-lock.json
npm install
```

---

## 📁 PROJECT STRUCTURE

```
apps/rob-ui/
├── src/
│   ├── lib/
│   │   └── rob-client.ts       # API client
│   ├── pages/
│   │   └── RobPage.tsx         # Main chat UI
│   ├── App.tsx                 # Router setup
│   ├── main.tsx                # React entry point
│   └── index.css               # Tailwind imports
├── index.html                  # HTML template
├── vite.config.ts              # Vite config + proxy
├── tailwind.config.js          # Tailwind config
├── postcss.config.js           # PostCSS config
├── tsconfig.json               # TypeScript config
└── package.json                # Dependencies
```

---

## 🎨 NEXT STEPS: ADD YOUR MAGIC PATTERNS COMPONENTS

### Option 1: Replace RobPage

Replace `src/pages/RobPage.tsx` with your Magic Patterns component and wire it to `robClient`:

```tsx
import { robClient } from '../lib/rob-client';

export default function YourMagicComponent() {
  // Use robClient.initSession() and robClient.sendMessage()
}
```

### Option 2: Add New Routes

Add new pages to `src/pages/` and register in `src/App.tsx`:

```tsx
import YourPage from './pages/YourPage';

<Routes>
  <Route path="/rob" element={<RobPage />} />
  <Route path="/your-page" element={<YourPage />} />
</Routes>
```

### Option 3: Import Magic Patterns Components

Copy Magic Patterns components to `src/components/` and import into pages:

```tsx
import MagicComponent from '../components/MagicComponent';
```

---

## 🔐 CONSTITUTIONAL GUARANTEES

✅ **No Mocks:** All API calls go to real backend  
✅ **Receipt Emission:** Backend persists receipts (if Supabase configured)  
✅ **Consent Enforcement:** CharterEngine blocks without explicit grant  
✅ **State Machine:** Rob state transitions tracked  
✅ **Type Safety:** Full TypeScript support  

---

**Ready to start? Run the manual steps above!**
