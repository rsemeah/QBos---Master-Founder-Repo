# War Room Deployment Guide

## Prerequisites

- Supabase CLI installed: `brew install supabase/tap/supabase` (or equivalent)
- Supabase project created
- Environment variables configured

## Step 1: Deploy Migration

```bash
# Link to your Supabase project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push

# Or manually apply the migration
psql $DATABASE_URL < supabase/migrations/20260121000000_create_war_room_tables.sql
```

## Step 2: Configure Environment

Create `.env` file in `packages/war-room/`:

```bash
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

## Step 3: Build and Install

```bash
# Build War Room
pnpm -C packages/war-room build

# Install globally (optional)
pnpm install -g packages/war-room

# Or use via pnpm
pnpm -C packages/war-room war-room status
```

## Step 4: Verify Installation

```bash
# Test CLI
war-room status
war-room health

# Should show system health with real data
```

## Step 5: Set Up Nightly Regression

The GitHub Action is configured in `.github/workflows/war-room-nightly.yml`.

Ensure these secrets are set in your GitHub repository:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

## Troubleshooting

**Issue**: Migration fails with permission errors
**Solution**: Ensure your database user has CREATE TABLE permissions

**Issue**: War Room shows placeholder data
**Solution**: Live data sources need to be wired in (see next section)

**Issue**: CLI not found
**Solution**: Run `pnpm install` and ensure `node_modules/.bin` is in PATH

## Production Checklist

- [ ] Supabase migration deployed
- [ ] Environment variables configured
- [ ] War Room CLI tested
- [ ] Nightly regression scheduled
- [ ] Live data sources connected
- [ ] Alerts configured (Slack/email)
- [ ] Operator access restricted (RLS policies)

## Security Notes

- War Room is **operator-only** - never expose to end users
- All operations emit TruthSerum receipts for audit
- RLS policies enforce authenticated access only
- Consider adding role-based access for production
