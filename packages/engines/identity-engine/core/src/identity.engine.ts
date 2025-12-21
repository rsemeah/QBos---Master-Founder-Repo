/**
 * IdentityEngine™
 *
 * Identity and access management engine for QuietBuild OS.
 *
 * Provides:
 * - User management (CRUD, authentication)
 * - Role-based access control (RBAC)
 * - Team/organization management
 * - Session lifecycle management
 * - Permission checking
 *
 * Event-driven architecture:
 * - Emits: identity.user.*, identity.role.*, identity.team.*, identity.session.*
 * - Listens: (none - foundational engine)
 */

import type { EventBus } from '@qbos/events';
import type { IdentityEngineConfig } from './types';
import { UserService } from './services/user.service';
import { RoleService } from './services/role.service';
import { TeamService } from './services/team.service';
import { SessionService } from './services/session.service';

export class IdentityEngine {
  private config: IdentityEngineConfig;
  private eventBus: EventBus;
  private initialized: boolean = false;

  // Services
  public readonly users: UserService;
  public readonly roles: RoleService;
  public readonly teams: TeamService;
  public readonly sessions: SessionService;

  constructor(config: Partial<IdentityEngineConfig>, eventBus: EventBus) {
    this.eventBus = eventBus;

    // Merge with defaults
    this.config = {
      enabled: config.enabled !== undefined ? config.enabled : true,
      sessionExpirationSeconds: config.sessionExpirationSeconds || 7 * 24 * 60 * 60, // 7 days
      maxSessionsPerUser: config.maxSessionsPerUser || 5,
      requireEmailVerification: config.requireEmailVerification !== undefined
        ? config.requireEmailVerification
        : false,
      systemRoles: config.systemRoles || ['admin', 'user', 'guest'],
      defaultUserRole: config.defaultUserRole,
      validateMetadata: config.validateMetadata,
    };

    // Initialize services
    this.users = new UserService(this.eventBus);
    this.roles = new RoleService(this.eventBus, this.config.systemRoles);
    this.teams = new TeamService(this.eventBus);
    this.sessions = new SessionService(
      this.eventBus,
      this.config.sessionExpirationSeconds,
      this.config.maxSessionsPerUser
    );
  }

  /**
   * Initializes the IdentityEngine.
   *
   * - Validates configuration
   * - Sets up event subscriptions (if needed)
   * - Creates system roles
   */
  async init(): Promise<void> {
    if (this.initialized) {
      throw new Error('IdentityEngine already initialized');
    }

    if (!this.config.enabled) {
      console.log('[IdentityEngine] Engine is disabled');
      return;
    }

    console.log('[IdentityEngine] Initializing...');

    // Validate configuration
    this.validateConfig();

    // Create system roles if they don't exist
    await this.ensureSystemRoles();

    this.initialized = true;
    console.log('[IdentityEngine] Initialized successfully');
  }

  /**
   * Shuts down the IdentityEngine gracefully.
   *
   * - Cleans up resources
   * - Flushes pending events
   */
  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    console.log('[IdentityEngine] Shutting down...');

    // Cleanup expired sessions
    const cleanedCount = await this.sessions.cleanupExpiredSessions();
    console.log(`[IdentityEngine] Cleaned up ${cleanedCount} expired sessions`);

    this.initialized = false;
    console.log('[IdentityEngine] Shutdown complete');
  }

  /**
   * Health check for the engine.
   *
   * @returns Health status
   */
  async healthCheck(): Promise<{ ok: boolean; message?: string }> {
    if (!this.config.enabled) {
      return {
        ok: false,
        message: 'Engine is disabled',
      };
    }

    if (!this.initialized) {
      return {
        ok: false,
        message: 'Engine not initialized',
      };
    }

    return {
      ok: true,
    };
  }

  /**
   * Gets the current configuration.
   *
   * @returns Engine configuration
   */
  getConfig(): Readonly<IdentityEngineConfig> {
    return { ...this.config };
  }

  // =============================================================================
  // PRIVATE HELPER METHODS
  // =============================================================================

  private validateConfig(): void {
    if (this.config.sessionExpirationSeconds < 60) {
      throw new Error('sessionExpirationSeconds must be at least 60 seconds');
    }

    if (this.config.maxSessionsPerUser < 1) {
      throw new Error('maxSessionsPerUser must be at least 1');
    }

    if (this.config.systemRoles.length === 0) {
      throw new Error('systemRoles must contain at least one role');
    }

    console.log('[IdentityEngine] Configuration validated');
  }

  private async ensureSystemRoles(): Promise<void> {
    console.log('[IdentityEngine] Ensuring system roles exist...');

    for (const roleName of this.config.systemRoles) {
      const result = await this.roles.getRoleByName(roleName);

      if (!result.ok) {
        // Role doesn't exist, create it
        const createResult = await this.roles.createRole({
          name: roleName,
          description: `System role: ${roleName}`,
          permissions: this.getDefaultPermissionsForRole(roleName),
        });

        if (createResult.ok) {
          console.log(`[IdentityEngine] Created system role: ${roleName}`);
        } else {
          console.warn(
            `[IdentityEngine] Failed to create system role ${roleName}:`,
            createResult.error?.message
          );
        }
      }
    }
  }

  private getDefaultPermissionsForRole(roleName: string): string[] {
    // Default permissions for system roles
    switch (roleName) {
      case 'admin':
        return [
          'users:read',
          'users:write',
          'users:delete',
          'roles:read',
          'roles:write',
          'roles:delete',
          'teams:read',
          'teams:write',
          'teams:delete',
          'system:admin',
        ];
      case 'user':
        return ['users:read', 'teams:read'];
      case 'guest':
        return [];
      default:
        return [];
    }
  }
}

export type { IdentityEngineConfig };
