/**
 * Tests for IdentityEngine
 */

import { IdentityEngine } from '../identity.engine';

describe('IdentityEngine', () => {
  let engine: IdentityEngine;

  beforeEach(async () => {
    engine = new IdentityEngine();
    await engine.init();
  });

  afterEach(async () => {
    await engine.shutdown();
  });

  describe('createUser', () => {
    it('should create new user', () => {
      const result = engine.createUser({
        email: 'test@example.com',
        displayName: 'Test User',
      });

      expect(result.ok).toBe(true);
      expect(result.data?.email).toBe('test@example.com');
      expect(result.data?.displayName).toBe('Test User');
      expect(result.data?.emailVerified).toBe(false);
      expect(result.data?.id).toBeDefined();
    });

    it('should fail when email already exists', () => {
      engine.createUser({ email: 'duplicate@example.com' });

      const result = engine.createUser({ email: 'duplicate@example.com' });

      expect(result.ok).toBe(false);
      expect(result.error).toContain('already exists');
    });

    it('should fail when not initialized', async () => {
      const uninitEngine = new IdentityEngine();

      const result = uninitEngine.createUser({ email: 'test@example.com' });

      expect(result.ok).toBe(false);
      expect(result.error).toContain('not initialized');
    });
  });

  describe('getUser', () => {
    it('should return user by ID', () => {
      const created = engine.createUser({ email: 'test@example.com' });
      const userId = created.data!.id;

      const result = engine.getUser(userId);

      expect(result.ok).toBe(true);
      expect(result.data?.id).toBe(userId);
      expect(result.data?.email).toBe('test@example.com');
    });

    it('should return null for non-existent user', () => {
      const result = engine.getUser('non-existent-id');

      expect(result.ok).toBe(true);
      expect(result.data).toBeNull();
    });
  });

  describe('getUserByEmail', () => {
    it('should return user by email', () => {
      engine.createUser({ email: 'find@example.com' });

      const result = engine.getUserByEmail('find@example.com');

      expect(result.ok).toBe(true);
      expect(result.data?.email).toBe('find@example.com');
    });

    it('should return null when email not found', () => {
      const result = engine.getUserByEmail('notfound@example.com');

      expect(result.ok).toBe(true);
      expect(result.data).toBeNull();
    });
  });

  describe('createOrg', () => {
    it('should create organization', () => {
      const result = engine.createOrg({
        name: 'Acme Corp',
      });

      expect(result.ok).toBe(true);
      expect(result.data?.name).toBe('Acme Corp');
      expect(result.data?.slug).toBeDefined();
      expect(result.data?.id).toBeDefined();
    });

    it('should generate slug from name', () => {
      const result = engine.createOrg({
        name: 'My Test Organization',
      });

      expect(result.ok).toBe(true);
      expect(result.data?.slug).toBe('my-test-organization');
    });
  });

  describe('getOrg', () => {
    it('should return organization by ID', () => {
      const created = engine.createOrg({ name: 'Test Org' });
      const orgId = created.data!.id;

      const result = engine.getOrg(orgId);

      expect(result.ok).toBe(true);
      expect(result.data?.id).toBe(orgId);
      expect(result.data?.name).toBe('Test Org');
    });

    it('should return null for non-existent org', () => {
      const result = engine.getOrg('non-existent-id');

      expect(result.ok).toBe(true);
      expect(result.data).toBeNull();
    });
  });

  describe('addMember', () => {
    it('should add member to organization', () => {
      const user = engine.createUser({ email: 'member@example.com' });
      const org = engine.createOrg({ name: 'Test Org' });

      const result = engine.addMember({
        userId: user.data!.id,
        orgId: org.data!.id,
        role: 'member',
      });

      expect(result.ok).toBe(true);
      expect(result.data?.userId).toBe(user.data!.id);
      expect(result.data?.orgId).toBe(org.data!.id);
      expect(result.data?.role).toBe('member');
    });

    it('should fail when user does not exist', () => {
      const org = engine.createOrg({ name: 'Test Org' });

      const result = engine.addMember({
        userId: 'fake-user-id',
        orgId: org.data!.id,
        role: 'member',
      });

      expect(result.ok).toBe(false);
      expect(result.error).toContain('User not found');
    });

    it('should fail when org does not exist', () => {
      const user = engine.createUser({ email: 'test@example.com' });

      const result = engine.addMember({
        userId: user.data!.id,
        orgId: 'fake-org-id',
        role: 'member',
      });

      expect(result.ok).toBe(false);
      expect(result.error).toContain('Org not found');
    });
  });

  describe('createSession', () => {
    it('should create user session', () => {
      const user = engine.createUser({ email: 'test@example.com' });

      const result = engine.createSession({
        userId: user.data!.id,
      });

      expect(result.ok).toBe(true);
      expect(result.data?.userId).toBe(user.data!.id);
      expect(result.data?.token).toBeDefined();
      expect(result.data?.expiresAt).toBeDefined();
    });

    it('should create org-scoped session', () => {
      const user = engine.createUser({ email: 'test@example.com' });
      const org = engine.createOrg({ name: 'Test Org' });

      const result = engine.createSession({
        userId: user.data!.id,
        orgId: org.data!.id,
      });

      expect(result.ok).toBe(true);
      expect(result.data?.userId).toBe(user.data!.id);
      expect(result.data?.orgId).toBe(org.data!.id);
    });

    it('should fail when user does not exist', () => {
      const result = engine.createSession({
        userId: 'fake-user-id',
      });

      expect(result.ok).toBe(false);
      expect(result.error).toContain('User not found');
    });
  });

  describe('validateSession', () => {
    it('should validate valid session', () => {
      const user = engine.createUser({ email: 'test@example.com' });
      const session = engine.createSession({ userId: user.data!.id });

      const result = engine.validateSession({
        token: session.data!.token,
      });

      expect(result.ok).toBe(true);
      expect(result.data?.user.id).toBe(user.data!.id);
      expect(result.data?.session.id).toBe(session.data!.id);
    });

    it('should return null for invalid token', () => {
      const result = engine.validateSession({
        token: 'invalid-token',
      });

      expect(result.ok).toBe(true);
      expect(result.data).toBeNull();
    });

    it('should return null for expired session', async () => {
      const user = engine.createUser({ email: 'test@example.com' });
      const session = engine.createSession({ userId: user.data!.id });

      // Manually expire session
      const sessionData = session.data!;
      sessionData.expiresAt = new Date(Date.now() - 1000).toISOString();

      const result = engine.validateSession({
        token: session.data!.token,
      });

      expect(result.ok).toBe(true);
      expect(result.data).toBeNull();
    });

    it('should include org in validation result', () => {
      const user = engine.createUser({ email: 'test@example.com' });
      const org = engine.createOrg({ name: 'Test Org' });
      const session = engine.createSession({
        userId: user.data!.id,
        orgId: org.data!.id,
      });

      const result = engine.validateSession({
        token: session.data!.token,
      });

      expect(result.ok).toBe(true);
      expect(result.data?.org?.id).toBe(org.data!.id);
    });
  });
});
