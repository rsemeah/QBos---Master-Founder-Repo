# QuietBuild OS™ - Supabase Migrations

This directory contains database migrations for QuietBuild OS™ engines.

## Migration Files

### SightEngine™ (Visual Quality Standards)
- `20251220000001_create_sight_engine_tables.sql` - Core SightEngine tables
  - `sight_assets` - Visual assets with tier specifications
  - `sight_validation_results` - Validation results with detailed scoring
  - `sight_prompt_standards` - AI prompt templates with quality standards
  - `sight_tier_enforcement_logs` - Audit trail for tier enforcement
  - `projects` - Shared project table

### SilentEngine™ (AI Routing)
- `20251220000002_create_silent_engine_tables.sql` - Core SilentEngine tables
  - `silent_providers` - AI provider registry
  - `silent_models` - Available models with capabilities
  - `silent_routing_policies` - Routing policies
  - `silent_routing_decisions` - Routing decision audit trail
  - `silent_audit_logs` - Complete generation audit logs
  - `silent_provider_metrics` - Provider performance metrics
  - `silent_circuit_breaker_state` - Circuit breaker state
  - `silent_safety_logs` - Safety classification logs

- `20251220000003_seed_silent_engine_data.sql` - Initial seed data
  - Default providers (Anthropic, OpenAI, Google)
  - Popular models (Claude 3.5, GPT-4, Gemini)
  - Default routing policies
  - Circuit breaker initialization

## Running Migrations

### Local Development with Supabase CLI

```bash
# Start Supabase locally
supabase start

# Apply migrations
supabase db reset

# Or apply specific migration
supabase migration up
```

### Production Deployment

```bash
# Link to your Supabase project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

## Database Schema Overview

### SightEngine™ Schema

```
sight_assets
├── id (uuid, PK)
├── project_id (uuid)
├── asset_name (text)
├── asset_type (enum: hero-image, product-shot, logo, etc.)
├── tier (enum: A, B, C)
├── resolution_width, resolution_height (integer)
├── camera_model, lens_type, aperture, etc.
└── created_at, updated_at (timestamptz)

sight_validation_results
├── id (uuid, PK)
├── asset_id (uuid, FK → sight_assets)
├── passed (boolean)
├── overall_score (0-100)
├── individual scores (resolution, camera, lighting, etc.)
└── issues (jsonb)

sight_prompt_standards
├── id (uuid, PK)
├── tier (enum: A, B, C)
├── asset_type (enum)
├── prompt_header (text)
└── times_used, success_rate
```

### SilentEngine™ Schema

```
silent_providers
├── id (uuid, PK)
├── provider_key (text, unique)
├── provider_name (text)
├── provider_type (enum: anthropic, openai, google, custom)
└── is_enabled, priority

silent_models
├── id (uuid, PK)
├── provider_id (uuid, FK → silent_providers)
├── model_key, model_name (text)
├── capabilities (jsonb array)
├── cost_per_million_input/output_tokens (numeric)
├── max_context_tokens, max_output_tokens (integer)
└── is_available, health_status

silent_routing_decisions
├── id (uuid, PK)
├── request_id (text, unique)
├── policy_key (text)
├── selected_provider, selected_model (text)
├── fallback_used (boolean)
└── decided_at (timestamptz)

silent_audit_logs
├── id (uuid, PK)
├── request_id (text, FK → silent_routing_decisions)
├── messages (jsonb)
├── provider, model (text)
├── response_text (text)
├── actual_cost, actual_latency_ms
├── status (enum: success, error, timeout, rate_limited)
└── pii_detected, safety_issues (jsonb)
```

## Row Level Security (RLS)

All tables have RLS enabled with organization-based policies. Users can only access data for organizations they belong to.

### Required Helper Table

The RLS policies assume a `user_organizations` table exists:

```sql
CREATE TABLE user_organizations (
  user_id UUID REFERENCES auth.users(id),
  organization_id UUID,
  role TEXT,
  PRIMARY KEY (user_id, organization_id)
);
```

Customize the RLS policies based on your authentication setup.

## Indexes

All tables include appropriate indexes for:
- Foreign key relationships
- Frequently queried columns (project_id, organization_id, created_at)
- Search patterns (tier, asset_type, provider, model)
- JSONB columns (capabilities, issues)

## Triggers

Automatic `updated_at` timestamp triggers are enabled on:
- `sight_assets`
- `projects`
- `silent_providers`
- `silent_models`
- `silent_routing_policies`
- `silent_circuit_breaker_state`

## Cost Tracking

SilentEngine includes comprehensive cost tracking:
- Per-request costs in `silent_audit_logs`
- Aggregated metrics in `silent_provider_metrics`
- Time-windowed analysis support

## Observability

Full observability through:
- `silent_routing_decisions` - Why each model was chosen
- `silent_audit_logs` - Complete request/response audit trail
- `silent_provider_metrics` - Performance trends
- `silent_circuit_breaker_state` - System health
- `silent_safety_logs` - Safety classification results

## Backup and Restore

```bash
# Backup
supabase db dump -f backup.sql

# Restore
psql -h your-host -U postgres -d postgres -f backup.sql
```

## Environment Variables

Required environment variables for Supabase:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Public anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server-side only)

---

**Built for QuietBuild OS™** - Precision Infrastructure for Trust-Based Products
