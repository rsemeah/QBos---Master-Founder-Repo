/**
 * @qbos/identity-engine-core - IdentityEngine™ Core Package
 *
 * Identity and access management for QuietBuild OS.
 *
 * Usage:
 *
 * ```typescript
 * import { IdentityEngine } from '@qbos/identity-engine-core';
 * import { InMemoryEventBus } from '@qbos/events';
 *
 * const eventBus = new InMemoryEventBus();
 * const identityEngine = new IdentityEngine({
 *   enabled: true,
 *   sessionExpirationSeconds: 7 * 24 * 60 * 60, // 7 days
 *   maxSessionsPerUser: 5,
 * }, eventBus);
 *
 * await identityEngine.init();
 *
 * // User management
 * const user = await identityEngine.users.createUser({
 *   email: 'user@example.com',
 *   displayName: 'John Doe',
 * });
 *
 * // Role management
 * const role = await identityEngine.roles.createRole({
 *   name: 'moderator',
 *   permissions: ['content:moderate', 'users:read'],
 * });
 *
 * await identityEngine.roles.assignRole({
 *   userId: user.data.id,
 *   roleId: role.data.id,
 * });
 *
 * // Team management
 * const team = await identityEngine.teams.createTeam({
 *   name: 'Engineering',
 *   slug: 'engineering',
 *   ownerId: user.data.id,
 * });
 *
 * // Session management
 * const session = await identityEngine.sessions.createSession({
 *   userId: user.data.id,
 *   token: 'session-token',
 *   expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
 * });
 * ```
 */

// Main engine class
export { IdentityEngine } from './identity.engine';
export type { IdentityEngineConfig } from './identity.engine';

// All types
export type {
  // User types
  User,
  UserStatus,
  CreateUserParams,
  UpdateUserParams,

  // Role types
  Role,
  CreateRoleParams,
  UpdateRoleParams,
  UserRole,
  AssignRoleParams,

  // Team types
  Team,
  TeamStatus,
  CreateTeamParams,
  UpdateTeamParams,
  TeamMember,
  TeamMemberRole,
  AddTeamMemberParams,

  // Session types
  Session,
  CreateSessionParams,
  RefreshSessionParams,

  // Permission types
  Permission,
  PermissionAction,
  CreatePermissionParams,
  CheckPermissionParams,
  CheckPermissionResult,

  // Result types
  IdentityEngineResult,
  IdentityEngineError,

  // Event payload types
  UserCreatedEvent,
  UserUpdatedEvent,
  UserDeletedEvent,
  RoleAssignedEvent,
  RoleRevokedEvent,
  TeamCreatedEvent,
  TeamMemberAddedEvent,
  TeamMemberRemovedEvent,
  SessionCreatedEvent,
  SessionExpiredEvent,
} from './types';

// Services (for advanced use cases)
export { UserService } from './services/user.service';
export { RoleService } from './services/role.service';
export { TeamService } from './services/team.service';
export { SessionService } from './services/session.service';
