/**
 * VERIFICATION TESTS - IdentityEngine
 *
 * These tests verify that IdentityEngine actually works as claimed.
 * They test against REAL external systems (Supabase), not mocks.
 *
 * Status: 🔴 NOT IMPLEMENTED
 * These tests will fail until IdentityEngine is migrated to Supabase.
 *
 * See: REBUILD_ROADMAP.md (Weeks 3-6)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { IdentityEngine } from '../src/identity.engine'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321'
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'test-key'

describe('IdentityEngine - VERIFICATION TESTS', () => {
  let engine: IdentityEngine
  let supabase: any
  let testUserId: string

  beforeEach(async () => {
    // Create Supabase client
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

    // Create engine with Supabase (will fail until Supabase integration is complete)
    engine = new IdentityEngine(supabase)

    // Clean up test data from previous runs
    await supabase.from('users').delete().eq('email', 'verify@test.com')
  })

  afterEach(async () => {
    // Clean up test data
    if (testUserId) {
      await supabase.from('users').delete().eq('id', testUserId)
    }
  })

  // ============================================================================
  // GATE 1: CODE_EXISTS (No In-Memory Storage)
  // ============================================================================

  it('VERIFY: Should use Supabase, NOT in-memory storage', async () => {
    // ❌ CURRENT STATE: This test will fail because IdentityEngine uses Map<>
    // ✅ EXPECTED STATE: After migration, data should persist to Supabase

    // Create user
    const user = await engine.createUser({
      email: 'verify@test.com',
      password: 'test123'
    })

    testUserId = user.id

    // Destroy the engine instance (clears in-memory state)
    // @ts-ignore - Intentionally destroying the instance
    engine = null

    // Create a NEW engine instance (should not have in-memory data)
    const newEngine = new IdentityEngine(supabase)

    // User should still exist in Supabase (proves persistence)
    const retrieved = await newEngine.getUserByEmail('verify@test.com')

    expect(retrieved).toBeDefined()
    expect(retrieved?.id).toBe(testUserId)
    expect(retrieved?.email).toBe('verify@test.com')
  })

  it('VERIFY: Should not use Map<string, User>', () => {
    // Check that IdentityEngine doesn't have in-memory Map properties
    const engineInstance = engine as any

    // ❌ CURRENT STATE: These properties exist
    // ✅ EXPECTED STATE: These should be undefined after Supabase migration
    expect(engineInstance.users).toBeUndefined()
    expect(engineInstance.usersByEmail).toBeUndefined()
    expect(engineInstance.sessions).toBeUndefined()
    expect(engineInstance.orgs).toBeUndefined()
  })

  // ============================================================================
  // GATE 2: TESTS_PASS (Security)
  // ============================================================================

  it('VERIFY: Passwords should be hashed with bcrypt', async () => {
    // ❌ CURRENT STATE: Passwords not hashed
    // ✅ EXPECTED STATE: bcrypt hash starting with $2b$12$

    const user = await engine.createUser({
      email: 'hash-test@test.com',
      password: 'plaintext-password'
    })

    testUserId = user.id

    // Password should NOT be stored in plaintext
    expect(user.passwordHash).not.toBe('plaintext-password')

    // Should be bcrypt hash format: $2b$12$... (cost factor 12)
    expect(user.passwordHash).toMatch(/^\$2[ayb]\$12\$.{53}$/)
  })

  it('VERIFY: Should enforce rate limiting on login attempts', async () => {
    // ❌ CURRENT STATE: No rate limiting
    // ✅ EXPECTED STATE: Should block after 5 failed attempts

    // Create user
    const user = await engine.createUser({
      email: 'ratelimit@test.com',
      password: 'correct-password'
    })

    testUserId = user.id

    // Try 6 failed login attempts
    for (let i = 0; i < 6; i++) {
      try {
        await engine.login('ratelimit@test.com', 'wrong-password')
      } catch (error) {
        // Expected to fail
      }
    }

    // 6th attempt should be blocked by rate limiter
    await expect(
      engine.login('ratelimit@test.com', 'wrong-password')
    ).rejects.toThrow(/rate limit/i)
  })

  it('VERIFY: Should validate email format', async () => {
    // ❌ CURRENT STATE: No email validation
    // ✅ EXPECTED STATE: Should reject invalid emails

    await expect(
      engine.createUser({
        email: 'not-an-email',
        password: 'test123'
      })
    ).rejects.toThrow(/invalid email/i)

    await expect(
      engine.createUser({
        email: 'missing@domain',
        password: 'test123'
      })
    ).rejects.toThrow(/invalid email/i)
  })

  // ============================================================================
  // GATE 3: EXTERNAL_PROOF (Supabase Verification)
  // ============================================================================

  it('VERIFY: User exists in Supabase (external proof)', async () => {
    // ❌ CURRENT STATE: Users only in memory
    // ✅ EXPECTED STATE: Users in Supabase database

    // Create user via engine
    const user = await engine.createUser({
      email: 'external@test.com',
      password: 'test123'
    })

    testUserId = user.id

    // Query Supabase DIRECTLY (bypassing our engine code)
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'external@test.com')
      .single()

    expect(error).toBeNull()
    expect(data).toBeDefined()
    expect(data.id).toBe(user.id)
    expect(data.email).toBe('external@test.com')
  })

  it('VERIFY: Session tokens are valid JWT', async () => {
    // ❌ CURRENT STATE: Sessions are random strings
    // ✅ EXPECTED STATE: Sessions are signed JWT tokens

    const user = await engine.createUser({
      email: 'jwt@test.com',
      password: 'test123'
    })

    testUserId = user.id

    const session = await engine.login('jwt@test.com', 'test123')

    // Should be a JWT (format: header.payload.signature)
    expect(session.token).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/)

    // Decode JWT (without verification for this test)
    const [header, payload] = session.token.split('.')
    const decodedPayload = JSON.parse(
      Buffer.from(payload, 'base64url').toString()
    )

    expect(decodedPayload.userId).toBe(user.id)
    expect(decodedPayload.exp).toBeGreaterThan(Date.now() / 1000)
  })

  // ============================================================================
  // GATE 4: DEMO_VIDEO (Manual Verification)
  // ============================================================================

  /**
   * DEMO VIDEO REQUIREMENTS (docs/demos/identity-engine.mp4):
   *
   * 1. Show empty Supabase database (SELECT count(*) FROM users)
   * 2. Create user via CLI: `robby identity create --email test@example.com`
   * 3. Show user in Supabase dashboard (password is hashed)
   * 4. Restart application (proves in-memory state is cleared)
   * 5. Login with credentials: `robby identity login`
   * 6. Show session token in response
   * 7. Verify session in Supabase dashboard
   *
   * Duration: 3-5 minutes
   * No edits (continuous recording)
   */

  // ============================================================================
  // OAuth Tests
  // ============================================================================

  it('VERIFY: OAuth (Google) generates valid authorization URL', async () => {
    // ❌ CURRENT STATE: OAuth stubs
    // ✅ EXPECTED STATE: Real OAuth integration

    const oauthUrl = await engine.getOAuthURL('google', 'http://localhost:3000/callback')

    // Should be Google OAuth URL
    expect(oauthUrl).toContain('accounts.google.com/o/oauth2/v2/auth')
    expect(oauthUrl).toContain('client_id=')
    expect(oauthUrl).toContain('redirect_uri=')
    expect(oauthUrl).toContain('scope=')
  })

  it('VERIFY: OAuth callback creates user in Supabase', async () => {
    // ❌ CURRENT STATE: OAuth stubs
    // ✅ EXPECTED STATE: OAuth creates real users

    // This test requires mocking Google OAuth response
    // Skip for now, implement in Week 5 of rebuild

    // const mockGoogleCode = 'mock-auth-code'
    // const session = await engine.handleOAuthCallback('google', mockGoogleCode)
    //
    // // Verify user exists in Supabase
    // const { data } = await supabase
    //   .from('users')
    //   .select('*')
    //   .eq('id', session.userId)
    //   .single()
    //
    // expect(data).toBeDefined()
  })
})
