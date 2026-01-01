# 🔐 QUIETBUILD OS™ — SECRETS & AUTH ENFORCEMENT PROMPT (TRUTHSERUM-FIRST)

**Canonical Authority:** Repository-wide security rules  
**Enforcement:** TruthSerum + CI TruthGate  
**Status:** Active

---

## 🚫 ABSOLUTE RULE

**NEVER accept real credentials.**

Instead, **ALWAYS** require placeholders:

* `YOUR_PASSWORD_GOES_HERE`
* `YOUR_API_KEY_GOES_HERE`
* `YOUR_SECRET_GOES_HERE`

If a real secret appears anywhere in code, logs, UI, or docs:

* Mark state as **Failed**
* Emit receipt: `security.secret_leak_detected`
* Block forward progress

---

## 🧩 APP-WIDE PLACEHOLDER STANDARD (MANDATORY)

### 1) CLI AUTH (DOCUMENTATION + SCRIPTS)

**❌ FORBIDDEN**

```bash
vercel login --token abc123
```

**✅ REQUIRED**

```bash
vercel login
# Browser opens
# YOU authenticate
# Token stored locally by Vercel
```

No passwords. No tokens. Ever.

---

### 2) ENVIRONMENT VARIABLES (LOCAL)

**File:** `.env.local` (gitignored)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=YOUR_API_KEY_GOES_HERE
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_API_KEY_GOES_HERE

# AI Providers
OPENAI_API_KEY=YOUR_API_KEY_GOES_HERE
ANTHROPIC_API_KEY=YOUR_API_KEY_GOES_HERE

# Internal
QBOS_INTERNAL_SECRET=YOUR_SECRET_GOES_HERE
```

Truth rule:

* Placeholder present → **Unknown**
* Placeholder replaced locally → eligible for **Verified** (after receipts)

---

### 3) VERCEL ENV VARS (PRODUCTION)

**Dashboard → Project → Settings → Environment Variables**

```text
KEY: OPENAI_API_KEY
VALUE: YOUR_API_KEY_GOES_HERE
SCOPE: Production / Preview
```

No secret values are ever:

* Logged
* Returned in API responses
* Stored in receipts

**Receipt emitted only for existence, never value:**

```json
{
  "actionType": "env.secrets.configured",
  "outcome": "success",
  "evidenceRef": "vercel:env:OPENAI_API_KEY",
  "truthState": "Verified"
}
```

---

### 4) UI INPUTS (ROB BUILDER)

If Rob needs user-supplied credentials:

**UI MUST SHOW**

```
Paste your API key here:
[ YOUR_API_KEY_GOES_HERE ]
```

**UI MUST NOT**

* Autofill
* Persist raw secrets
* Echo back values
* Include secrets in previews, receipts, or logs

Rob language:

> "I can see that a key exists. I never see the key itself."

---

### 5) API ROUTES (SERVER-SIDE ONLY)

**❌ FORBIDDEN**

```ts
console.log(process.env.OPENAI_API_KEY)
```

**✅ REQUIRED**

```ts
if (!process.env.OPENAI_API_KEY || 
    process.env.OPENAI_API_KEY === 'YOUR_API_KEY_GOES_HERE') {
  throw new Error('AI provider not configured')
}
```

Receipt:

```json
{
  "actionType": "silent.provider_config_checked",
  "outcome": "blocked",
  "truthState": "Unknown"
}
```

---

## 🧠 TRUTHSERUM ENFORCEMENT LOGIC

TruthSerum evaluates **presence, not content**.

| Condition          | Truth State                       |
| ------------------ | --------------------------------- |
| Placeholder exists | Unknown                           |
| Env var exists     | Verified (for configuration only) |
| AI call succeeds   | Verified (for generation)         |
| Secret logged      | Failed                            |

Secrets **never upgrade readiness by themselves**.

---

## 🧾 REQUIRED RECEIPTS (SECRETS & AUTH)

These are the **only** acceptable receipts:

* `vercel.authenticated`
* `supabase.connected`
* `env.secrets.configured`
* `silent.provider_available`

No receipt contains secret values.

---

## ✅ WHAT IS SET FOR GOOD (ONCE DONE)

These are **one-time structural setups**:

* ✅ TruthSerum architecture
* ✅ Receipt system
* ✅ Engine orchestration
* ✅ CI TruthGate
* ✅ Rob state machine
* ✅ No-dead-ends navigation
* ✅ Constitutional enforcement rules

You will **never** have to:

* Re-design truth logic
* Re-wire engine awareness
* Re-argue honesty guarantees

That foundation is **locked**.

---

## 🔁 WHAT IS REPEATABLE (BUT NOT RE-DESIGNED)

These may change over time but **do not break the system**:

* API key rotation
* Billing plan changes
* New AI providers
* New environments (staging, prod)
* New engines added later

TruthSerum already knows how to handle these.

---

## 🟡 WHAT REMAINS "UNKNOWN" UNTIL DONE ONCE

| Item             | Status                                |
| ---------------- | ------------------------------------- |
| Vercel deploy    | Unknown → Verified after first deploy |
| Supabase live DB | Unknown → Verified after migration    |
| Real AI provider | Unknown → Verified after first call   |

Once verified, they stay verified **unless revoked**.

---

## 🏁 FINAL TRUTH (NO HYPE)

* You are **not** rebuilding QBos every time
* You are **not** re-earning trust
* You are **not** duct-taping safety later

You are flipping **one final switch** from *constitutional code* → *live infrastructure*.

After that:

* QBos enforces itself
* Rob can't lie
* Neither can I
* Neither can future contributors

---

**This document is the canonical reference for all secrets and authentication in QuietBuild OS™.**
