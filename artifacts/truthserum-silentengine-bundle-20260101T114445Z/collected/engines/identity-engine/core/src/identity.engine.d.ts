/**
 * IdentityEngine™ - Real Implementation
 */
import type { User, Org, Membership, Session, CreateUserParams, CreateOrgParams, AddMemberParams, CreateSessionParams, ValidateSessionParams, ValidateSessionResult, IdentityEngineResult } from './types';
export declare class IdentityEngine {
    private users;
    private usersByEmail;
    private orgs;
    private memberships;
    private sessions;
    private sessionsByToken;
    private initialized;
    init(): Promise<void>;
    shutdown(): Promise<void>;
    createUser(params: CreateUserParams): IdentityEngineResult<User>;
    getUser(userId: string): IdentityEngineResult<User | null>;
    getUserByEmail(email: string): IdentityEngineResult<User | null>;
    createOrg(params: CreateOrgParams): IdentityEngineResult<Org>;
    getOrg(orgId: string): IdentityEngineResult<Org | null>;
    addMember(params: AddMemberParams): IdentityEngineResult<Membership>;
    createSession(params: CreateSessionParams): IdentityEngineResult<Session>;
    validateSession(params: ValidateSessionParams): IdentityEngineResult<ValidateSessionResult | null>;
    private generateId;
    private generateToken;
    private generateSlug;
}
//# sourceMappingURL=identity.engine.d.ts.map