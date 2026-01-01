# QuietBuild OS - Deployment Guide

This guide covers the complete deployment process for QuietBuild OS to production.

## Prerequisites

- Supabase account
- Stripe account (with live mode keys)
- GitHub account with personal access token
- Vercel account
- OpenAI API key
- Node.js 18+ installed locally

## Step 1: Database Setup

### 1.1 Create Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Create a new project
3. Note your project URL and anon key from Settings > API

### 1.2 Apply Database Migrations

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Apply all migrations
supabase db push
```

**Migrations to apply (in order):**
1. `20241225_auth_starter_v2.sql` - Build sessions and receipts
2. `20251220000001_create_sight_engine_tables.sql` - Sight Engine
3. `20251220000002_create_silent_engine_tables.sql` - Silent Engine
4. `20251220000003_seed_silent_engine_data.sql` - Silent Engine data
5. `20251223000001_create_rob_tables.sql` - Rob Engine
6. `20241226_charter_engine.sql` - Charter Engine
7. `20241226_config_engine.sql` - Config Engine
8. `20241226_identity_engine.sql` - Identity Engine
9. `20241226_paywall_engine.sql` - Paywall Engine
10. `20241226_notifications_engine.sql` - Notifications Engine

### 1.3 Verify Database

```bash
# Run health check query
supabase db execute "SELECT COUNT(*) FROM build_sessions;"
```

## Step 2: Stripe Configuration

### 2.1 Get API Keys

1. Go to [https://dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
2. Toggle to "Live mode"
3. Copy your Publishable key (starts with `pk_live_`)
4. Copy your Secret key (starts with `sk_live_`)

### 2.2 Configure Webhook

1. Go to [https://dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter webhook URL: `https://your-domain.com/api/webhooks/stripe`
4. Select event: `payment_intent.succeeded`
5. Copy the webhook signing secret (starts with `whsec_`)

**Important:** Keep the signing secret secure - it's used to verify webhook authenticity.

## Step 3: GitHub Configuration

### 3.1 Create Personal Access Token

1. Go to [https://github.com/settings/tokens/new](https://github.com/settings/tokens/new)
2. Token name: "QuietBuild OS Production"
3. Expiration: Custom (1 year recommended)
4. Scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (Update GitHub Action workflows)
5. Generate token and copy it immediately

### 3.2 Create Template Repository

1. Go to your GitHub account
2. Create new repository: `qbos-auth-starter-template`
3. Make it a template:
   - Settings > General
   - Check "Template repository"
4. Push the template code from `templates/qbos-auth-starter-template/`

```bash
cd templates/qbos-auth-starter-template
git init
git add .
git commit -m "Initial template commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/qbos-auth-starter-template.git
git push -u origin main
```

## Step 4: Vercel Configuration

### 4.1 Get API Token

1. Go to [https://vercel.com/account/tokens](https://vercel.com/account/tokens)
2. Create new token
3. Name: "QuietBuild OS"
4. Scope: Full Account
5. Copy the token

### 4.2 Get Team ID (if using Vercel Teams)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# List teams
vercel teams ls

# Copy your team ID
```

## Step 5: Environment Variables

### 5.1 Create `.env.production`

```bash
cp .env.production.template .env.production
```

### 5.2 Fill in All Values

Edit `.env.production` and replace all placeholder values with your actual keys from steps 1-4.

**Critical variables:**
- All `SUPABASE_*` variables
- All `STRIPE_*` variables (including webhook secret)
- `GITHUB_TOKEN` and `GITHUB_ORG`
- `VERCEL_TOKEN` and `VERCEL_TEAM_ID`
- `OPENAI_API_KEY`

### 5.3 Verify Environment Variables

```bash
# Run verification script
npm run verify-env

# Or manually check
node -e "require('dotenv').config({ path: '.env.production' }); console.log('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY?.substring(0, 10) + '...')"
```

## Step 6: Deploy to Vercel

### 6.1 Connect Repository

1. Go to [https://vercel.com/new](https://vercel.com/new)
2. Import your Git repository
3. Select the repository
4. Configure project:
   - Framework Preset: Next.js
   - Root Directory: `apps/proof-harness`
   - Build Command: `npm run build`
   - Install Command: `npm install`

### 6.2 Set Environment Variables in Vercel

1. Go to your project settings
2. Navigate to Environment Variables
3. Add ALL variables from `.env.production`
4. Set environment to "Production"

**Shortcut:** Use Vercel CLI:

```bash
cd apps/proof-harness
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# ... repeat for all variables
```

### 6.3 Deploy

```bash
# Deploy to production
vercel --prod

# Or push to main branch (if auto-deploy is enabled)
git push origin main
```

## Step 7: Configure Cron Jobs

The job processor needs to run every minute to process async jobs.

### 7.1 Verify `vercel.json`

Ensure `apps/proof-harness/vercel.json` contains:

```json
{
  "crons": [
    {
      "path": "/api/jobs/process",
      "schedule": "* * * * *"
    }
  ]
}
```

### 7.2 Verify Cron is Active

1. Go to Vercel Dashboard > Your Project > Cron Jobs
2. Verify `/api/jobs/process` is listed
3. Check "Last Run" after deployment

## Step 8: Post-Deployment Verification

### 8.1 Health Checks

Visit these URLs and verify responses:

```bash
# API health
curl https://your-domain.com/api/health

# Expected: { "status": "healthy" }

# Database connection
curl https://your-domain.com/api/build/sessions

# Expected: { "sessions": [] } (authenticated) or 401
```

### 8.2 Test Build Flow (End-to-End)

1. Sign up: `https://your-domain.com/signup`
2. Create build: `https://your-domain.com/build/new`
3. Verify template matching works
4. Test payment with Stripe test card:
   - Card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
5. Verify webhook fires (check Stripe dashboard > Webhooks > Recent deliveries)
6. Verify job processor runs (check Vercel logs)
7. Verify GitHub repo created
8. Verify Vercel deployment succeeds

### 8.3 Monitor Logs

```bash
# Stream production logs
vercel logs --follow

# Filter by function
vercel logs --filter="/api/build/start"

# Check for errors
vercel logs --filter="ERROR"
```

## Step 9: Security Checklist

- [ ] All environment variables set in Vercel (not in code)
- [ ] `.env.production` added to `.gitignore`
- [ ] Stripe webhook signature verified in code
- [ ] Supabase RLS policies enabled for all tables
- [ ] GitHub token has minimum required scopes
- [ ] CORS configured for API routes (if needed)
- [ ] Rate limiting enabled (optional but recommended)

## Step 10: Monitoring Setup (Optional but Recommended)

### 10.1 Sentry for Error Tracking

```bash
npm install @sentry/nextjs

npx @sentry/wizard -i nextjs
```

### 10.2 Uptime Monitoring

Use services like:
- [UptimeRobot](https://uptimerobot.com)
- [Pingdom](https://www.pingdom.com)
- [Better Uptime](https://betteruptime.com)

Monitor these endpoints:
- `https://your-domain.com/api/health`
- `https://your-domain.com/api/jobs/process`

## Troubleshooting

### Database Migration Errors

```bash
# Reset and reapply migrations
supabase db reset

# Or manually drop/recreate tables
supabase db execute "DROP TABLE IF EXISTS table_name CASCADE;"
```

### Stripe Webhook Failures

1. Check webhook signature verification in `/api/webhooks/stripe/route.ts`
2. Verify `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
3. Check Stripe dashboard > Webhooks > Recent deliveries for error details
4. Ensure webhook URL is HTTPS (not HTTP)

### GitHub API Failures

1. Verify token has `repo` and `workflow` scopes
2. Check token hasn't expired
3. Ensure template repo exists and is marked as template
4. Verify `GITHUB_ORG` matches your username or org name

### Vercel Deployment Failures

1. Check build logs in Vercel dashboard
2. Verify all environment variables are set
3. Ensure `package.json` dependencies are correct
4. Check for TypeScript errors: `npm run typecheck`

### Cron Job Not Running

1. Verify `vercel.json` is in project root
2. Check Vercel dashboard > Cron Jobs
3. Manually trigger: `curl https://your-domain.com/api/jobs/process`
4. Check Vercel logs for cron execution

## Rollback Procedure

If deployment fails or has issues:

```bash
# Revert to previous deployment
vercel rollback

# Or redeploy specific commit
vercel --prod --commit=abc123def
```

## Support

- Documentation: `docs/`
- GitHub Issues: [Create Issue](https://github.com/YOUR_ORG/YOUR_REPO/issues/new)
- Email: support@quietbuild.com (if applicable)

## Next Steps

After successful deployment:

1. Set up custom domain in Vercel
2. Configure email sending (SendGrid, Mailgun, etc.)
3. Add analytics (PostHog, Mixpanel, etc.)
4. Set up automated backups for Supabase
5. Configure monitoring and alerts
6. Create runbook for common operations

---

**Last Updated:** 2024-12-26
**Version:** 1.0.0
