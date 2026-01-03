export interface User {
    id: string;
    email: string;
    emailVerified: boolean;
    displayName: string | null;
    avatarUrl: string | null;
    metadata: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
}
export interface Org {
    id: string;
    name: string;
    slug: string;
    metadata: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
}
export interface Membership {
    id: string;
    userId: string;
    orgId: string;
    role: string;
    createdAt: string;
}
export interface Session {
    id: string;
    userId: string;
    orgId: string | null;
    token: string;
    expiresAt: string;
    createdAt: string;
}
export interface Role {
    id: string;
    orgId: string;
    name: string;
    permissions: string[];
    createdAt: string;
}
export interface IdentityEngineResult<T = unknown> {
    ok: boolean;
    data?: T;
    error?: string;
}
export interface CreateUserParams {
    email: string;
    displayName?: string;
}
export interface CreateOrgParams {
    name: string;
}
export interface AddMemberParams {
    orgId: string;
    userId: string;
    role: string;
}
export interface CreateSessionParams {
    userId: string;
    orgId?: string;
}
export interface ValidateSessionParams {
    token: string;
}
export interface ValidateSessionResult {
    user: User;
    org: Org | null;
    session: Session;
}
//# sourceMappingURL=types.d.ts.map