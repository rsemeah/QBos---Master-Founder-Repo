# IdentityEngine™

**Identity and Access Management for QuietBuild OS**

IdentityEngine™ provides comprehensive identity and access management (IAM) capabilities for QuietBuild OS. It handles user authentication, role-based access control (RBAC), team management, and session lifecycle management through an event-driven architecture.

## Features

- **User Management** - Create, read, update, delete users with metadata support
- **Role-Based Access Control (RBAC)** - Flexible roles, permissions, and role assignments
- **Team/Organization Management** - Multi-tenant team structure with member roles
- **Session Lifecycle** - Secure session creation, validation, refresh, and expiration
- **Permission Checking** - Fine-grained permission validation
- **Event-Driven** - Emits events for all identity operations
- **Product-Agnostic** - Generic identity layer, not tied to specific products

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     IdentityEngine™                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Listens:                     Emits:                        │
│  (none - foundational)        • identity.user.*             │
│                               • identity.role.*             │
│                               • identity.team.*             │
│                               • identity.session.*          │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  Services:                                                   │
│  • UserService        → User CRUD, authentication           │
│  • RoleService        → RBAC, permissions                   │
│  • TeamService        → Teams, memberships                  │
│  • SessionService     → Session lifecycle                   │
└─────────────────────────────────────────────────────────────┘
```

## Installation

```bash
pnpm install @qbos/identity-engine-core
```

## Quick Start

### 1. Basic Setup

```typescript
import { IdentityEngine } from '@qbos/identity-engine-core';
import { InMemoryEventBus } from '@qbos/events';

// Create event bus
const eventBus = new InMemoryEventBus();

// Initialize IdentityEngine
const identityEngine = new IdentityEngine({
  enabled: true,
  sessionExpirationSeconds: 7 * 24 * 60 * 60, // 7 days
  maxSessionsPerUser: 5,
  requireEmailVerification: false,
  systemRoles: ['admin', 'user', 'guest'],
  defaultUserRole: 'user',
}, eventBus);

// Initialize
await identityEngine.init();
```

### 2. User Management

```typescript
// Create user
const createResult = await identityEngine.users.createUser({
  email: 'alice@example.com',
  displayName: 'Alice Johnson',
  metadata: {
    department: 'Engineering',
    location: 'San Francisco',
  },
});

if (createResult.ok) {
  const user = createResult.data;
  console.log('User created:', user.id);
}

// Get user by ID
const getUserResult = await identityEngine.users.getUserById(user.id);

// Get user by email
const getByEmailResult = await identityEngine.users.getUserByEmail('alice@example.com');

// Update user
const updateResult = await identityEngine.users.updateUser(user.id, {
  displayName: 'Alice M. Johnson',
  emailVerified: true,
});

// List users
const listResult = await identityEngine.users.listUsers({
  limit: 50,
  offset: 0,
  status: 'active',
});

// Delete user (soft delete)
await identityEngine.users.deleteUser(user.id);

// Hard delete
await identityEngine.users.deleteUser(user.id, true);
```

### 3. Role Management

```typescript
// Create role
const roleResult = await identityEngine.roles.createRole({
  name: 'moderator',
  description: 'Content moderator role',
  permissions: [
    'content:read',
    'content:moderate',
    'users:read',
  ],
});

const role = roleResult.data;

// Assign role to user
const assignResult = await identityEngine.roles.assignRole({
  userId: user.id,
  roleId: role.id,
  grantedBy: 'admin_user_id',
});

// Check user permissions
const permissionResult = await identityEngine.roles.checkPermission({
  userId: user.id,
  permission: 'content:moderate',
});

if (permissionResult.data?.allowed) {
  console.log('User has permission');
}

// Get user roles
const userRolesResult = await identityEngine.roles.getUserRoles(user.id);

// Revoke role
await identityEngine.roles.revokeRole(user.id, role.id, 'admin_user_id');

// List all roles
const rolesResult = await identityEngine.roles.listRoles();
```

### 4. Team Management

```typescript
// Create team
const teamResult = await identityEngine.teams.createTeam({
  name: 'Engineering Team',
  slug: 'engineering',
  description: 'Core engineering team',
  ownerId: user.id,
});

const team = teamResult.data;

// Add team member
const memberResult = await identityEngine.teams.addTeamMember({
  teamId: team.id,
  userId: 'another_user_id',
  role: 'member',
  invitedBy: user.id,
});

// Get team members
const membersResult = await identityEngine.teams.getTeamMembers(team.id);

// Update member role
await identityEngine.teams.updateTeamMemberRole(
  team.id,
  'another_user_id',
  'admin'
);

// Remove member
await identityEngine.teams.removeTeamMember(
  team.id,
  'another_user_id',
  user.id
);

// Get user's teams
const userTeamsResult = await identityEngine.teams.getUserTeams(user.id);

// Update team
await identityEngine.teams.updateTeam(team.id, {
  description: 'Updated description',
});

// Delete team
await identityEngine.teams.deleteTeam(team.id);
```

### 5. Session Management

```typescript
// Create session
const sessionResult = await identityEngine.sessions.createSession({
  userId: user.id,
  token: generateSecureToken(), // Your token generation logic
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0...',
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
});

const session = sessionResult.data;

// Validate session
const validateResult = await identityEngine.sessions.validateSession(session.token);

if (validateResult.ok) {
  console.log('Session is valid');
}

// Refresh session
await identityEngine.sessions.refreshSession({
  sessionId: session.id,
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
});

// Get user sessions
const userSessions = await identityEngine.sessions.getUserSessions(user.id);

// Delete session (logout)
await identityEngine.sessions.deleteSession(session.id);

// Delete all user sessions (logout all devices)
await identityEngine.sessions.deleteUserSessions(user.id);

// Cleanup expired sessions (run periodically)
const cleanedCount = await identityEngine.sessions.cleanupExpiredSessions();
console.log(`Cleaned up ${cleanedCount} expired sessions`);
```

## Configuration

### IdentityEngineConfig

```typescript
interface IdentityEngineConfig {
  /**
   * Enable/disable the engine
   * @default true
   */
  enabled: boolean;

  /**
   * Session expiration time in seconds
   * @default 604800 (7 days)
   */
  sessionExpirationSeconds: number;

  /**
   * Maximum sessions per user
   * @default 5
   */
  maxSessionsPerUser: number;

  /**
   * Email verification required for login
   * @default false
   */
  requireEmailVerification: boolean;

  /**
   * System roles that cannot be deleted
   * @default ['admin', 'user', 'guest']
   */
  systemRoles: string[];

  /**
   * Auto-assign role to new users
   * @default undefined
   */
  defaultUserRole?: string;

  /**
   * Custom metadata validation function
   * @default undefined
   */
  validateMetadata?: (metadata: Record<string, any>) => boolean;
}
```

## Events

### Events Emitted

IdentityEngine emits the following events:

#### User Events

- **`identity.user.created`** - User created
  ```typescript
  {
    userId: string;
    email: string;
    displayName: string | null;
    timestamp: string;
  }
  ```

- **`identity.user.updated`** - User updated
  ```typescript
  {
    userId: string;
    changes: Partial<UpdateUserParams>;
    timestamp: string;
  }
  ```

- **`identity.user.deleted`** - User deleted
  ```typescript
  {
    userId: string;
    timestamp: string;
  }
  ```

#### Role Events

- **`identity.role.assigned`** - Role assigned to user
  ```typescript
  {
    userId: string;
    roleId: string;
    roleName: string;
    grantedBy: string | null;
    timestamp: string;
  }
  ```

- **`identity.role.revoked`** - Role revoked from user
  ```typescript
  {
    userId: string;
    roleId: string;
    roleName: string;
    revokedBy: string | null;
    timestamp: string;
  }
  ```

#### Team Events

- **`identity.team.created`** - Team created
  ```typescript
  {
    teamId: string;
    name: string;
    ownerId: string;
    timestamp: string;
  }
  ```

- **`identity.team.member.added`** - Member added to team
  ```typescript
  {
    teamId: string;
    userId: string;
    role: TeamMemberRole;
    invitedBy: string | null;
    timestamp: string;
  }
  ```

- **`identity.team.member.removed`** - Member removed from team
  ```typescript
  {
    teamId: string;
    userId: string;
    removedBy: string | null;
    timestamp: string;
  }
  ```

#### Session Events

- **`identity.session.created`** - Session created
  ```typescript
  {
    sessionId: string;
    userId: string;
    ipAddress: string | null;
    timestamp: string;
  }
  ```

- **`identity.session.expired`** - Session expired
  ```typescript
  {
    sessionId: string;
    userId: string;
    timestamp: string;
  }
  ```

### Subscribing to Events

```typescript
// Subscribe to user creation events
eventBus.on('identity.user.created', async (event) => {
  console.log('New user created:', event.userId);

  // Example: Send welcome email
  // await sendWelcomeEmail(event.email);

  // Example: Assign default role
  // await identityEngine.roles.assignRole({
  //   userId: event.userId,
  //   roleId: 'default_role_id',
  // });
});

// Subscribe to role assignments
eventBus.on('identity.role.assigned', async (event) => {
  console.log(`Role ${event.roleName} assigned to user ${event.userId}`);
});

// Subscribe to session creation
eventBus.on('identity.session.created', async (event) => {
  console.log('New session:', event.sessionId);

  // Example: Log login activity
  // await auditLog.record({
  //   action: 'login',
  //   userId: event.userId,
  //   ipAddress: event.ipAddress,
  //   timestamp: event.timestamp,
  // });
});
```

## API Reference

### IdentityEngine

Main engine class that provides access to all services.

#### Methods

- `async init(): Promise<void>` - Initialize the engine
- `async shutdown(): Promise<void>` - Shutdown gracefully
- `async healthCheck(): Promise<{ ok: boolean; message?: string }>` - Health check
- `getConfig(): Readonly<IdentityEngineConfig>` - Get current configuration

#### Properties

- `users: UserService` - User management service
- `roles: RoleService` - Role and permission management
- `teams: TeamService` - Team management
- `sessions: SessionService` - Session lifecycle management

### UserService

See code for full API documentation.

### RoleService

See code for full API documentation.

### TeamService

See code for full API documentation.

### SessionService

See code for full API documentation.

## Error Handling

All service methods return `IdentityEngineResult<T>`:

```typescript
interface IdentityEngineResult<T = any> {
  ok: boolean;
  data?: T;
  error?: IdentityEngineError;
}

interface IdentityEngineError {
  code: string;
  message: string;
  details?: Record<string, any>;
}
```

Example error handling:

```typescript
const result = await identityEngine.users.createUser({
  email: 'invalid-email',
});

if (!result.ok) {
  console.error('Error code:', result.error?.code);
  console.error('Error message:', result.error?.message);
  console.error('Error details:', result.error?.details);

  switch (result.error?.code) {
    case 'INVALID_EMAIL':
      // Handle invalid email
      break;
    case 'USER_ALREADY_EXISTS':
      // Handle duplicate user
      break;
    default:
      // Handle generic error
  }
}
```

## Database Schema

See `packages/engines/identity-engine/supabase/README.md` for complete database schema documentation.

## Best Practices

### 1. Email Validation

Always validate email addresses before creating users:

```typescript
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
```

### 2. Password Hashing

IdentityEngine does NOT handle passwords directly. Use a dedicated authentication provider (Supabase Auth, Auth0, etc.) for password management.

### 3. Permission Naming Convention

Use the format `resource:action`:

```typescript
const permissions = [
  'users:read',
  'users:write',
  'users:delete',
  'content:read',
  'content:write',
  'content:moderate',
];
```

### 4. Session Token Generation

Use cryptographically secure random tokens:

```typescript
import { randomBytes } from 'crypto';

function generateSecureToken(): string {
  return randomBytes(32).toString('base64url');
}
```

### 5. Session Cleanup

Run periodic cleanup of expired sessions:

```typescript
// Run every hour
setInterval(async () => {
  const count = await identityEngine.sessions.cleanupExpiredSessions();
  console.log(`Cleaned up ${count} expired sessions`);
}, 60 * 60 * 1000);
```

## Examples

### Complete Authentication Flow

```typescript
// 1. Create user
const userResult = await identityEngine.users.createUser({
  email: 'bob@example.com',
  displayName: 'Bob Smith',
});

const user = userResult.data!;

// 2. Assign default role
await identityEngine.roles.assignRole({
  userId: user.id,
  roleId: 'user_role_id',
});

// 3. Create session
const sessionResult = await identityEngine.sessions.createSession({
  userId: user.id,
  token: generateSecureToken(),
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
});

const session = sessionResult.data!;

// 4. Validate session on subsequent requests
const validateResult = await identityEngine.sessions.validateSession(session.token);

if (validateResult.ok) {
  // Session valid, proceed with request
  console.log('Authenticated user:', validateResult.data!.userId);
}
```

### Team-Based Access Control

```typescript
// Check if user is team admin
const membersResult = await identityEngine.teams.getTeamMembers(teamId);
const member = membersResult.data!.find(m => m.userId === userId);

if (member && (member.role === 'owner' || member.role === 'admin')) {
  // User is team admin, allow operation
  console.log('User is team admin');
}
```

## License

MIT

## Support

For issues and questions, see the main QuietBuild OS repository.
