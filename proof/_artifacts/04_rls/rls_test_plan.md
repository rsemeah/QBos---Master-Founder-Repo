# RLS Test Plan

## Goal
Verify RLS policies block unauthorized access and allow authorized access.

## Proposed Steps
1. Start local Supabase and apply migrations.
2. Select representative tables (e.g., receipts, sessions, users).
3. Attempt unauthenticated SELECT/INSERT and expect failures.
4. Authenticate as a valid user and repeat; expect success.
5. Record results for each table and operation.

## Current Status
Local Supabase CLI is not available in this environment, so this plan is not executed yet.
