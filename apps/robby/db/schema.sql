-- Supabase / Postgres schema for Robby iteration 1
CREATE TABLE IF NOT EXISTS sessions (
  id text PRIMARY KEY,
  phase text NOT NULL,
  state text NOT NULL,
  intent jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS session_events (
  id text PRIMARY KEY,
  session_id text REFERENCES sessions(id),
  type text NOT NULL,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS receipts (
  receipt_id text PRIMARY KEY,
  session_id text,
  timestamp timestamptz,
  type text,
  payload jsonb,
  signature text
);
