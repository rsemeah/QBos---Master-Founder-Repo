"use strict";
/**
 * IdentityEngine™ - Real Implementation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentityEngine = void 0;
class IdentityEngine {
    users = new Map();
    usersByEmail = new Map();
    orgs = new Map();
    memberships = new Map();
    sessions = new Map();
    sessionsByToken = new Map();
    initialized = false;
    async init() {
        if (this.initialized)
            return;
        this.initialized = true;
    }
    async shutdown() {
        this.initialized = false;
    }
    createUser(params) {
        if (!this.initialized) {
            return { ok: false, error: 'IdentityEngine not initialized' };
        }
        if (this.usersByEmail.has(params.email)) {
            return { ok: false, error: 'Email already exists' };
        }
        const user = {
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
        return { ok: true, data: user };
    }
    getUser(userId) {
        return { ok: true, data: this.users.get(userId) || null };
    }
    getUserByEmail(email) {
        return { ok: true, data: this.usersByEmail.get(email) || null };
    }
    createOrg(params) {
        if (!this.initialized) {
            return { ok: false, error: 'IdentityEngine not initialized' };
        }
        const org = {
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
    getOrg(orgId) {
        return { ok: true, data: this.orgs.get(orgId) || null };
    }
    addMember(params) {
        if (!this.initialized) {
            return { ok: false, error: 'IdentityEngine not initialized' };
        }
        if (!this.users.has(params.userId)) {
            return { ok: false, error: 'User not found' };
        }
        if (!this.orgs.has(params.orgId)) {
            return { ok: false, error: 'Org not found' };
        }
        const membership = {
            id: this.generateId(),
            userId: params.userId,
            orgId: params.orgId,
            role: params.role,
            createdAt: new Date().toISOString(),
        };
        this.memberships.set(membership.id, membership);
        return { ok: true, data: membership };
    }
    createSession(params) {
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
        const session = {
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
    validateSession(params) {
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
    generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    generateToken() {
        return Buffer.from(`${Date.now()}-${Math.random()}`).toString('base64');
    }
    generateSlug(name) {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }
}
exports.IdentityEngine = IdentityEngine;
//# sourceMappingURL=identity.engine.js.map