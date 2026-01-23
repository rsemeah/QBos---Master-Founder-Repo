/**
 * IdentityEngine™ - Real Implementation
 * Now with TruthSerum receipt emission
 */

import { ReceiptWriter } from '@qbos/truthserum';
import type {
  User,
  Org,
  Membership,
  Session,
  CreateUserParams,
  CreateOrgParams,
  AddMemberParams,
  CreateSessionParams,
  ValidateSessionParams,
  ValidateSessionResult,
  IdentityEngineResult,
} from './types';

export class IdentityEngine {
  private users: Map<string, User> = new Map();
  private usersByEmail: Map<string, User> = new Map();
  private orgs: Map<string, Org> = new Map();
  private memberships: Map<string, Membership> = new Map();
  private sessions: Map<string, Session> = new Map();
  private sessionsByToken: Map<string, Session> = new Map();
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;
  }

  async shutdown(): Promise<void> {
    this.initialized = false;
  }

  async createUser(params: CreateUserParams): Promise<IdentityEngineResult<User>> {
    if (!this.initialized) {
      return { ok: false, error: 'IdentityEngine not initialized' };
    }

    if (this.usersByEmail.has(params.email)) {
      return { ok: false, error: 'Email already exists' };
    }

    const user: User = {
      id: this.generateId(),
      email: params.email,
      emailVerified: false,
      displayName: params.displayName || null,
      avatarUrl: null,
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.users.set(user.id, user);
    this.usersByEmail.set(user.email, user);

    // Emit TruthSerum receipt
    await ReceiptWriter.writeReceipt({
      sessionId: user.id,
      type: 'identity.user.created',
      details: {
        user_id: user.id,
        email: params.email,
        email_verified: user.emailVerified
      }
    });

    return { ok: true, data: user };
  }

  getUser(userId: string): IdentityEngineResult<User | null> {
    return { ok: true, data: this.users.get(userId) || null };
  }

  getUserByEmail(email: string): IdentityEngineResult<User | null> {
    return { ok: true, data: this.usersByEmail.get(email) || null };
  }

  createOrg(params: CreateOrgParams): IdentityEngineResult<Org> {
    if (!this.initialized) {
      return { ok: false, error: 'IdentityEngine not initialized' };
    }

    const org: Org = {
      id: this.generateId(),
      name: params.name,
      slug: this.generateSlug(params.name),
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.orgs.set(org.id, org);

    return { ok: true, data: org };
  }

  getOrg(orgId: string): IdentityEngineResult<Org | null> {
    return { ok: true, data: this.orgs.get(orgId) || null };
  }

  addMember(params: AddMemberParams): IdentityEngineResult<Membership> {
    if (!this.initialized) {
      return { ok: false, error: 'IdentityEngine not initialized' };
    }

    if (!this.users.has(params.userId)) {
      return { ok: false, error: 'User not found' };
    }

    if (!this.orgs.has(params.orgId)) {
      return { ok: false, error: 'Org not found' };
    }

    const membership: Membership = {
      id: this.generateId(),
      userId: params.userId,
      orgId: params.orgId,
      role: params.role,
      createdAt: new Date().toISOString(),
    };

    this.memberships.set(membership.id, membership);

    return { ok: true, data: membership };
  }

  createSession(params: CreateSessionParams): IdentityEngineResult<Session> {
    if (!this.initialized) {
      return { ok: false, error: 'IdentityEngine not initialized' };
    }

    if (!this.users.has(params.userId)) {
      return { ok: false, error: 'User not found' };
    }

    if (params.orgId && !this.orgs.has(params.orgId)) {
      return { ok: false, error: 'Org not found' };
    }

    const token = this.generateToken();
    const session: Session = {
      id: this.generateId(),
      userId: params.userId,
      orgId: params.orgId || null,
      token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
      createdAt: new Date().toISOString(),
    };

    this.sessions.set(session.id, session);
    this.sessionsByToken.set(token, session);

    return { ok: true, data: session };
  }

  validateSession(params: ValidateSessionParams): IdentityEngineResult<ValidateSessionResult | null> {
    if (!this.initialized) {
      return { ok: false, error: 'IdentityEngine not initialized' };
    }

    const session = this.sessionsByToken.get(params.token);
    if (!session) {
      return { ok: true, data: null };
    }

    if (new Date(session.expiresAt) < new Date()) {
      return { ok: true, data: null };
    }

    const user = this.users.get(session.userId);
    if (!user) {
      return { ok: true, data: null };
    }

    const org = session.orgId ? this.orgs.get(session.orgId) || null : null;

    return {
      ok: true,
      data: {
        user,
        org,
        session,
      },
    };
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateToken(): string {
    return Buffer.from(`${Date.now()}-${Math.random()}`).toString('base64');
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
