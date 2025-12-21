/**
 * IdentityEngine Types
 *
 * Complete type definitions for the IdentityEngine.
 * Product-agnostic identity and access management.
 */

// =============================================================================
// USER TYPES
// =============================================================================

export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  displayName: string | null;
  avatarUrl: string | null;
  status: UserStatus;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

export type UserStatus = 'active' | 'suspended' | 'deleted';

export interface CreateUserParams {
  email: string;
  displayName?: string;
  avatarUrl?: string;
  metadata?: Record<string, any>;
}

export interface UpdateUserParams {
  displayName?: string;
  avatarUrl?: string;
  emailVerified?: boolean;
  status?: UserStatus;
  metadata?: Record<string, any>;
}

// =============================================================================
// ROLE TYPES
// =============================================================================

export interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  isSystem: boolean;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleParams {
  name: string;
  description?: string;
  permissions?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateRoleParams {
  description?: string;
  permissions?: string[];
  metadata?: Record<string, any>;
}

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  roleName: string;
  grantedBy: string | null;
  grantedAt: string;
  expiresAt: string | null;
  metadata: Record<string, any>;
}

export interface AssignRoleParams {
  userId: string;
  roleId: string;
  grantedBy?: string;
  expiresAt?: string;
  metadata?: Record<string, any>;
}

// =============================================================================
// TEAM TYPES
// =============================================================================

export interface Team {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  avatarUrl: string | null;
  ownerId: string;
  status: TeamStatus;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export type TeamStatus = 'active' | 'suspended' | 'deleted';

export interface CreateTeamParams {
  name: string;
  slug: string;
  description?: string;
  avatarUrl?: string;
  ownerId: string;
  metadata?: Record<string, any>;
}

export interface UpdateTeamParams {
  name?: string;
  slug?: string;
  description?: string;
  avatarUrl?: string;
  status?: TeamStatus;
  metadata?: Record<string, any>;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: TeamMemberRole;
  invitedBy: string | null;
  joinedAt: string;
  metadata: Record<string, any>;
}

export type TeamMemberRole = 'owner' | 'admin' | 'member' | 'guest';

export interface AddTeamMemberParams {
  teamId: string;
  userId: string;
  role: TeamMemberRole;
  invitedBy?: string;
  metadata?: Record<string, any>;
}

// =============================================================================
// SESSION TYPES
// =============================================================================

export interface Session {
  id: string;
  userId: string;
  token: string;
  ipAddress: string | null;
  userAgent: string | null;
  expiresAt: string;
  metadata: Record<string, any>;
  createdAt: string;
  lastActivityAt: string;
}

export interface CreateSessionParams {
  userId: string;
  token: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: string;
  metadata?: Record<string, any>;
}

export interface RefreshSessionParams {
  sessionId: string;
  expiresAt: string;
}

// =============================================================================
// PERMISSION TYPES
// =============================================================================

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: PermissionAction;
  description: string | null;
  metadata: Record<string, any>;
  createdAt: string;
}

export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'execute' | 'admin';

export interface CreatePermissionParams {
  name: string;
  resource: string;
  action: PermissionAction;
  description?: string;
  metadata?: Record<string, any>;
}

export interface CheckPermissionParams {
  userId: string;
  permission: string;
}

export interface CheckPermissionResult {
  allowed: boolean;
  reason?: string;
  roles?: string[];
}

// =============================================================================
// ENGINE CONFIGURATION
// =============================================================================

export interface IdentityEngineConfig {
  /**
   * Enable/disable the engine
   */
  enabled: boolean;

  /**
   * Session expiration time in seconds (default: 7 days)
   */
  sessionExpirationSeconds: number;

  /**
   * Maximum sessions per user (default: 5)
   */
  maxSessionsPerUser: number;

  /**
   * Email verification required for login
   */
  requireEmailVerification: boolean;

  /**
   * System roles that cannot be deleted
   */
  systemRoles: string[];

  /**
   * Auto-assign role to new users
   */
  defaultUserRole?: string;

  /**
   * Custom metadata validation
   */
  validateMetadata?: (metadata: Record<string, any>) => boolean;
}

// =============================================================================
// ENGINE RESULT TYPES
// =============================================================================

export interface IdentityEngineResult<T = any> {
  ok: boolean;
  data?: T;
  error?: IdentityEngineError;
}

export interface IdentityEngineError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// =============================================================================
// EVENT PAYLOAD TYPES
// =============================================================================

export interface UserCreatedEvent {
  userId: string;
  email: string;
  displayName: string | null;
  timestamp: string;
}

export interface UserUpdatedEvent {
  userId: string;
  changes: Partial<UpdateUserParams>;
  timestamp: string;
}

export interface UserDeletedEvent {
  userId: string;
  timestamp: string;
}

export interface RoleAssignedEvent {
  userId: string;
  roleId: string;
  roleName: string;
  grantedBy: string | null;
  timestamp: string;
}

export interface RoleRevokedEvent {
  userId: string;
  roleId: string;
  roleName: string;
  revokedBy: string | null;
  timestamp: string;
}

export interface TeamCreatedEvent {
  teamId: string;
  name: string;
  ownerId: string;
  timestamp: string;
}

export interface TeamMemberAddedEvent {
  teamId: string;
  userId: string;
  role: TeamMemberRole;
  invitedBy: string | null;
  timestamp: string;
}

export interface TeamMemberRemovedEvent {
  teamId: string;
  userId: string;
  removedBy: string | null;
  timestamp: string;
}

export interface SessionCreatedEvent {
  sessionId: string;
  userId: string;
  ipAddress: string | null;
  timestamp: string;
}

export interface SessionExpiredEvent {
  sessionId: string;
  userId: string;
  timestamp: string;
}
