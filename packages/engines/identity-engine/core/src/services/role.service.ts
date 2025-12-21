/**
 * RoleService
 *
 * Role-based access control (RBAC) operations for IdentityEngine.
 * Handles roles, permissions, and role assignments.
 */

import type { EventBus } from '@qbos/events';
import type {
  Role,
  CreateRoleParams,
  UpdateRoleParams,
  UserRole,
  AssignRoleParams,
  Permission,
  CreatePermissionParams,
  CheckPermissionParams,
  CheckPermissionResult,
  IdentityEngineResult,
  RoleAssignedEvent,
  RoleRevokedEvent,
} from '../types';

export class RoleService {
  constructor(
    private eventBus: EventBus,
    public readonly systemRoles: string[]
  ) {}

  // =============================================================================
  // ROLE MANAGEMENT
  // =============================================================================

  /**
   * Creates a new role.
   *
   * @param params - Role creation parameters
   * @returns Created role object
   */
  async createRole(params: CreateRoleParams): Promise<IdentityEngineResult<Role>> {
    try {
      // Validate role name format
      if (!this.isValidRoleName(params.name)) {
        return {
          ok: false,
          error: {
            code: 'INVALID_ROLE_NAME',
            message: 'Role name must be alphanumeric with underscores only',
            details: { name: params.name },
          },
        };
      }

      // Check if role already exists
      const existing = await this.getRoleByName(params.name);
      if (existing.ok && existing.data) {
        return {
          ok: false,
          error: {
            code: 'ROLE_ALREADY_EXISTS',
            message: 'Role with this name already exists',
            details: { name: params.name },
          },
        };
      }

      // Create role object
      const now = new Date().toISOString();
      const role: Role = {
        id: this.generateRoleId(),
        name: params.name.toLowerCase(),
        description: params.description || null,
        permissions: params.permissions || [],
        isSystem: false,
        metadata: params.metadata || {},
        createdAt: now,
        updatedAt: now,
      };

      // Store role
      await this.storeRole(role);

      return {
        ok: true,
        data: role,
      };
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'CREATE_ROLE_FAILED',
          message: error.message,
        },
      };
    }
  }

  /**
   * Gets role by ID.
   *
   * @param roleId - Role ID
   * @returns Role object or error
   */
  async getRoleById(roleId: string): Promise<IdentityEngineResult<Role>> {
    try {
      const role = await this.fetchRoleById(roleId);

      if (!role) {
        return {
          ok: false,
          error: {
            code: 'ROLE_NOT_FOUND',
            message: 'Role not found',
            details: { roleId },
          },
        };
      }

      return {
        ok: true,
        data: role,
      };
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'GET_ROLE_FAILED',
          message: error.message,
        },
      };
    }
  }

  /**
   * Gets role by name.
   *
   * @param name - Role name
   * @returns Role object or error
   */
  async getRoleByName(name: string): Promise<IdentityEngineResult<Role>> {
    try {
      const role = await this.fetchRoleByName(name.toLowerCase());

      if (!role) {
        return {
          ok: false,
          error: {
            code: 'ROLE_NOT_FOUND',
            message: 'Role not found',
            details: { name },
          },
        };
      }

      return {
        ok: true,
        data: role,
      };
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'GET_ROLE_FAILED',
          message: error.message,
        },
      };
    }
  }

  /**
   * Updates role information.
   *
   * @param roleId - Role ID
   * @param params - Update parameters
   * @returns Updated role object
   */
  async updateRole(
    roleId: string,
    params: UpdateRoleParams
  ): Promise<IdentityEngineResult<Role>> {
    try {
      const result = await this.getRoleById(roleId);
      if (!result.ok || !result.data) {
        return result;
      }

      const role = result.data;

      // Prevent modification of system roles
      if (role.isSystem) {
        return {
          ok: false,
          error: {
            code: 'SYSTEM_ROLE_IMMUTABLE',
            message: 'System roles cannot be modified',
            details: { roleId, roleName: role.name },
          },
        };
      }

      // Apply updates
      const updatedRole: Role = {
        ...role,
        description: params.description !== undefined ? params.description : role.description,
        permissions: params.permissions !== undefined ? params.permissions : role.permissions,
        metadata:
          params.metadata !== undefined ? { ...role.metadata, ...params.metadata } : role.metadata,
        updatedAt: new Date().toISOString(),
      };

      // Store updated role
      await this.storeRole(updatedRole);

      return {
        ok: true,
        data: updatedRole,
      };
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'UPDATE_ROLE_FAILED',
          message: error.message,
        },
      };
    }
  }

  /**
   * Deletes a role.
   *
   * @param roleId - Role ID
   * @returns Success result
   */
  async deleteRole(roleId: string): Promise<IdentityEngineResult<void>> {
    try {
      const result = await this.getRoleById(roleId);
      if (!result.ok || !result.data) {
        return {
        ok: false,
        error: result.error,
      };
      }

      const role = result.data;

      // Prevent deletion of system roles
      if (role.isSystem) {
        return {
          ok: false,
          error: {
            code: 'SYSTEM_ROLE_IMMUTABLE',
            message: 'System roles cannot be deleted',
            details: { roleId, roleName: role.name },
          },
        };
      }

      // Remove role
      await this.removeRole(roleId);

      return {
        ok: true,
      };
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'DELETE_ROLE_FAILED',
          message: error.message,
        },
      };
    }
  }

  /**
   * Lists all roles.
   *
   * @returns List of roles
   */
  async listRoles(): Promise<IdentityEngineResult<Role[]>> {
    try {
      const roles = await this.fetchRoles();

      return {
        ok: true,
        data: roles,
      };
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'LIST_ROLES_FAILED',
          message: error.message,
        },
      };
    }
  }

  // =============================================================================
  // ROLE ASSIGNMENT
  // =============================================================================

  /**
   * Assigns a role to a user.
   *
   * Emits: identity.role.assigned
   *
   * @param params - Role assignment parameters
   * @returns User role assignment
   */
  async assignRole(params: AssignRoleParams): Promise<IdentityEngineResult<UserRole>> {
    try {
      // Verify role exists
      const roleResult = await this.getRoleById(params.roleId);
      if (!roleResult.ok || !roleResult.data) {
        return {
        ok: false,
        error: roleResult.error,
      };
      }

      const role = roleResult.data;

      // Check if user already has this role
      const existing = await this.getUserRole(params.userId, params.roleId);
      if (existing) {
        return {
          ok: false,
          error: {
            code: 'ROLE_ALREADY_ASSIGNED',
            message: 'User already has this role',
            details: { userId: params.userId, roleId: params.roleId },
          },
        };
      }

      // Create user role assignment
      const now = new Date().toISOString();
      const userRole: UserRole = {
        id: this.generateUserRoleId(),
        userId: params.userId,
        roleId: params.roleId,
        roleName: role.name,
        grantedBy: params.grantedBy || null,
        grantedAt: now,
        expiresAt: params.expiresAt || null,
        metadata: params.metadata || {},
      };

      // Store assignment
      await this.storeUserRole(userRole);

      // Emit role assigned event (non-blocking)
      this.emitRoleAssigned(userRole);

      return {
        ok: true,
        data: userRole,
      };
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'ASSIGN_ROLE_FAILED',
          message: error.message,
        },
      };
    }
  }

  /**
   * Revokes a role from a user.
   *
   * Emits: identity.role.revoked
   *
   * @param userId - User ID
   * @param roleId - Role ID
   * @param revokedBy - User who revoked the role
   * @returns Success result
   */
  async revokeRole(
    userId: string,
    roleId: string,
    revokedBy?: string
  ): Promise<IdentityEngineResult<void>> {
    try {
      const userRole = await this.getUserRole(userId, roleId);

      if (!userRole) {
        return {
          ok: false,
          error: {
            code: 'ROLE_NOT_ASSIGNED',
            message: 'User does not have this role',
            details: { userId, roleId },
          },
        };
      }

      // Remove assignment
      await this.removeUserRole(userRole.id);

      // Emit role revoked event (non-blocking)
      this.emitRoleRevoked(userId, roleId, userRole.roleName, revokedBy || null);

      return {
        ok: true,
      };
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'REVOKE_ROLE_FAILED',
          message: error.message,
        },
      };
    }
  }

  /**
   * Gets all roles assigned to a user.
   *
   * @param userId - User ID
   * @returns List of user role assignments
   */
  async getUserRoles(userId: string): Promise<IdentityEngineResult<UserRole[]>> {
    try {
      const userRoles = await this.fetchUserRoles(userId);

      return {
        ok: true,
        data: userRoles,
      };
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'GET_USER_ROLES_FAILED',
          message: error.message,
        },
      };
    }
  }

  // =============================================================================
  // PERMISSION MANAGEMENT
  // =============================================================================

  /**
   * Creates a new permission.
   *
   * @param params - Permission creation parameters
   * @returns Created permission
   */
  async createPermission(params: CreatePermissionParams): Promise<IdentityEngineResult<Permission>> {
    try {
      const now = new Date().toISOString();
      const permission: Permission = {
        id: this.generatePermissionId(),
        name: params.name,
        resource: params.resource,
        action: params.action,
        description: params.description || null,
        metadata: params.metadata || {},
        createdAt: now,
      };

      await this.storePermission(permission);

      return {
        ok: true,
        data: permission,
      };
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'CREATE_PERMISSION_FAILED',
          message: error.message,
        },
      };
    }
  }

  /**
   * Checks if a user has a specific permission.
   *
   * @param params - Permission check parameters
   * @returns Check result with allowed boolean
   */
  async checkPermission(params: CheckPermissionParams): Promise<IdentityEngineResult<CheckPermissionResult>> {
    try {
      // Get user's roles
      const rolesResult = await this.getUserRoles(params.userId);
      if (!rolesResult.ok || !rolesResult.data) {
        return {
          ok: true,
          data: {
            allowed: false,
            reason: 'User has no roles',
          },
        };
      }

      const userRoles = rolesResult.data;

      // Check if any role has the permission
      for (const userRole of userRoles) {
        const roleResult = await this.getRoleById(userRole.roleId);
        if (roleResult.ok && roleResult.data) {
          const role = roleResult.data;

          if (role.permissions.includes(params.permission)) {
            return {
              ok: true,
              data: {
                allowed: true,
                roles: [role.name],
              },
            };
          }
        }
      }

      return {
        ok: true,
        data: {
          allowed: false,
          reason: 'No role with required permission',
        },
      };
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'CHECK_PERMISSION_FAILED',
          message: error.message,
        },
      };
    }
  }

  // =============================================================================
  // PRIVATE HELPER METHODS
  // =============================================================================

  private isValidRoleName(name: string): boolean {
    const roleNameRegex = /^[a-z0-9_]+$/;
    return roleNameRegex.test(name);
  }

  private generateRoleId(): string {
    return `role_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  private generateUserRoleId(): string {
    return `user_role_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  private generatePermissionId(): string {
    return `perm_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  private async storeRole(role: Role): Promise<void> {
    console.log('[IdentityEngine] Store role:', role.id);
  }

  private async fetchRoleById(roleId: string): Promise<Role | null> {
    console.log('[IdentityEngine] Fetch role by ID:', roleId);
    return null;
  }

  private async fetchRoleByName(name: string): Promise<Role | null> {
    console.log('[IdentityEngine] Fetch role by name:', name);
    return null;
  }

  private async fetchRoles(): Promise<Role[]> {
    console.log('[IdentityEngine] Fetch all roles');
    return [];
  }

  private async removeRole(roleId: string): Promise<void> {
    console.log('[IdentityEngine] Remove role:', roleId);
  }

  private async storeUserRole(userRole: UserRole): Promise<void> {
    console.log('[IdentityEngine] Store user role:', userRole.id);
  }

  private async getUserRole(userId: string, roleId: string): Promise<UserRole | null> {
    console.log('[IdentityEngine] Get user role:', userId, roleId);
    return null;
  }

  private async fetchUserRoles(userId: string): Promise<UserRole[]> {
    console.log('[IdentityEngine] Fetch user roles:', userId);
    return [];
  }

  private async removeUserRole(userRoleId: string): Promise<void> {
    console.log('[IdentityEngine] Remove user role:', userRoleId);
  }

  private async storePermission(permission: Permission): Promise<void> {
    console.log('[IdentityEngine] Store permission:', permission.id);
  }

  private emitRoleAssigned(userRole: UserRole): void {
    const payload: RoleAssignedEvent = {
      userId: userRole.userId,
      roleId: userRole.roleId,
      roleName: userRole.roleName,
      grantedBy: userRole.grantedBy,
      timestamp: new Date().toISOString(),
    };

    setImmediate(() => {
      this.eventBus.emit('identity.role.assigned', payload).catch((error) => {
        console.error('[IdentityEngine] Failed to emit role.assigned event:', error);
      });
    });
  }

  private emitRoleRevoked(
    userId: string,
    roleId: string,
    roleName: string,
    revokedBy: string | null
  ): void {
    const payload: RoleRevokedEvent = {
      userId,
      roleId,
      roleName,
      revokedBy,
      timestamp: new Date().toISOString(),
    };

    setImmediate(() => {
      this.eventBus.emit('identity.role.revoked', payload).catch((error) => {
        console.error('[IdentityEngine] Failed to emit role.revoked event:', error);
      });
    });
  }
}
