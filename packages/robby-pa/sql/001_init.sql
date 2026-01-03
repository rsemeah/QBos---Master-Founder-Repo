-- Create required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Organizations
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_orgs_created ON organizations(created_at DESC);

-- Sessions
CREATE TABLE IF NOT EXISTS robby_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  phase TEXT NOT NULL CHECK (phase IN ('INTENT', 'EXECUTION', 'VERDICT')),
  sub_state TEXT NOT NULL,
  ux_state TEXT NOT NULL CHECK (ux_state IN ('shaping', 'building', 'ready')),
  intent JSONB,
  plan JSONB,
  verdict JSONB,
  preview JSONB,
  is_anonymized BOOLEAN NOT NULL DEFAULT false,
  anonymized_at TIMESTAMPTZ,
  costs JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  locked_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  CONSTRAINT valid_phase_substate CHECK (
    (phase = 'INTENT' AND sub_state IN ('collecting', 'refining', 'confirming', 'locked')) OR
    (phase = 'EXECUTION' AND sub_state IN ('queued', 'running', 'blocked', 'pivoting', 'completed')) OR
    (phase = 'VERDICT' AND sub_state IN ('analyzing', 'ready', 'accepted', 'rejected'))
  )
);
CREATE INDEX IF NOT EXISTS idx_robby_sessions_user ON robby_sessions(user_id) WHERE NOT is_anonymized;
CREATE INDEX IF NOT EXISTS idx_robby_sessions_phase ON robby_sessions(phase, sub_state);
CREATE INDEX IF NOT EXISTS idx_robby_sessions_created ON robby_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_robby_sessions_anonymized ON robby_sessions(is_anonymized, anonymized_at);

-- Receipts
CREATE TABLE IF NOT EXISTS robby_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES robby_sessions(id) ON DELETE CASCADE,
  seq INTEGER NOT NULL,
  prev_hash TEXT,
  type TEXT NOT NULL,
  payload JSONB NOT NULL,
  artifact_refs JSONB,
  hash TEXT NOT NULL,
  mac TEXT NOT NULL,
  mac_key_id TEXT NOT NULL,
  retained_for_security BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_session_seq UNIQUE(session_id, seq),
  CHECK (seq >= 0),
  CHECK (artifact_refs IS NULL OR jsonb_typeof(artifact_refs) = 'array')
);
CREATE INDEX IF NOT EXISTS idx_robby_receipts_session ON robby_receipts(session_id, seq);
CREATE INDEX IF NOT EXISTS idx_robby_receipts_type ON robby_receipts(type);
CREATE INDEX IF NOT EXISTS idx_robby_receipts_security ON robby_receipts(retained_for_security, created_at);

-- Session events
CREATE TABLE IF NOT EXISTS robby_session_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES robby_sessions(id) ON DELETE CASCADE,
  session_seq INTEGER NOT NULL,
  type TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_session_event_seq UNIQUE(session_id, session_seq)
);
CREATE INDEX IF NOT EXISTS idx_robby_events_session ON robby_session_events(session_id, session_seq);
CREATE INDEX IF NOT EXISTS idx_robby_events_created ON robby_session_events(created_at DESC);

-- Artifacts
CREATE TABLE IF NOT EXISTS robby_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES robby_sessions(id) ON DELETE CASCADE,
  uri TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size_bytes BIGINT,
  provenance JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_artifact_session_uri UNIQUE(session_id, uri)
);
CREATE INDEX IF NOT EXISTS idx_robby_artifacts_session ON robby_artifacts(session_id);
CREATE INDEX IF NOT EXISTS idx_robby_artifacts_hash ON robby_artifacts(sha256);

-- Snapshots
CREATE TABLE IF NOT EXISTS robby_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES robby_sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  note TEXT,
  is_fork BOOLEAN NOT NULL DEFAULT false,
  parent_snapshot_id UUID REFERENCES robby_snapshots(id) ON DELETE SET NULL,
  phase TEXT NOT NULL,
  sub_state TEXT NOT NULL,
  state_snapshot JSONB NOT NULL,
  state_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (name <> '')
);
CREATE INDEX IF NOT EXISTS idx_robby_snapshots_session ON robby_snapshots(session_id, created_at DESC);

-- Proofs
CREATE TABLE IF NOT EXISTS robby_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES robby_sessions(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  class TEXT NOT NULL CHECK (class IN ('HARD', 'MEDIUM', 'SOFT')),
  artifact_id UUID REFERENCES robby_artifacts(id) ON DELETE CASCADE,
  artifact_uri TEXT,
  artifact_sha256 TEXT,
  verifier TEXT NOT NULL,
  verified_at TIMESTAMPTZ,
  result TEXT CHECK (result IN ('PASS', 'FAIL', 'PENDING')),
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (artifact_id IS NOT NULL OR artifact_uri IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_robby_proofs_session ON robby_proofs(session_id);
CREATE INDEX IF NOT EXISTS idx_robby_proofs_type ON robby_proofs(type, result);
CREATE INDEX IF NOT EXISTS idx_robby_proofs_artifact ON robby_proofs(artifact_id);
