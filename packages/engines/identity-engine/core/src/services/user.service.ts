/**
 * UserService
 *
 * User management operations for IdentityEngine.
 * Handles user CRUD, validation, and lifecycle events.
 */

import type { EventBus } from '@qbos/events';
import type {
  User,
  CreateUserParams,
  UpdateUserParams,
  UserStatus,
  IdentityEngineResult,
  UserCreatedEvent,
  UserUpdatedEvent,
  UserDeletedEvent,
} from '../types';

export class UserService {
  constructor(private eventBus: EventBus) {}

  /**
   * Creates a new user in the identity system.
   *
   * Emits: identity.user.created
   *
   * @param params - User creation parameters
   * @returns Created user object
   */
  async createUser(params: CreateUserParams): Promise<IdentityEngineResult<User>> {
    try {
      // Validate email format
      if (!this.isValidEmail(params.email)) {
        return {
          ok: false,
          error: {
            code: 'INVALID_EMAIL',
            message: 'Invalid email format',
            details: { email: params.email },
          },
        };
      }

      // Check if user already exists
      const existing = await this.getUserByEmail(params.email);
      if (existing.ok && existing.data) {
        return {
          ok: false,
          error: {
            code: 'USER_ALREADY_EXISTS',
            message: 'User with this email already exists',
            details: { email: params.email },
          },
        };
      }

      // Create user object
      const now = new Date().toISOString();
      const user: User = {
        id: this.generateUserId(),
        email: params.email.toLowerCase().trim(),
        emailVerified: false,
        displayName: params.displayName || null,
        avatarUrl: params.avatarUrl || null,
        status: 'active',
        metadata: params.metadata || {},
        createdAt: now,
        updatedAt: now,
        lastLoginAt: null,
      };

      // Store user (would call database in real implementation)
      await this.storeUser(user);

      // Emit user created event (non-blocking)
      this.emitUserCreated(user);

      return {
        ok: true,
        data: user,
      };
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'CREATE_USER_FAILED',
          message: error.message,
        },
      };
    }
  }

  /**
   * Gets user by ID.
   *
   * @param userId - User ID
   * @returns User object or error
   */
  async getUserById(userId: string): Promise<IdentityEngineResult<User>> {
    try {
      const user = await this.fetchUserById(userId);

      if (!user) {
        return {
          ok: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
            details: { userId },
          },
        };
      }

      return {
        ok: true,
        data: user,
      };
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'GET_USER_FAILED',
          message: error.message,
        },
      };
    }
  }

  /**
   * Gets user by email.
   *
   * @param email - User email
   * @returns User object or error
   */
  async getUserByEmail(email: string): Promise<IdentityEngineResult<User>> {
    try {
      const user = await this.fetchUserByEmail(email.toLowerCase().trim());

      if (!user) {
        return {
          ok: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
            details: { email },
          },
        };
      }

      return {
        ok: true,
        data: user,
      };
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'GET_USER_FAILED',
          message: error.message,
        },
      };
    }
  }

  /**
   * Updates user information.
   *
   * Emits: identity.user.updated
   *
   * @param userId - User ID
   * @param params - Update parameters
   * @returns Updated user object
   */
  async updateUser(
    userId: string,
    params: UpdateUserParams
  ): Promise<IdentityEngineResult<User>> {
    try {
      const result = await this.getUserById(userId);
      if (!result.ok || !result.data) {
        return result;
      }

      const user = result.data;

      // Apply updates
      const updatedUser: User = {
        ...user,
        displayName: params.displayName !== undefined ? params.displayName : user.displayName,
        avatarUrl: params.avatarUrl !== undefined ? params.avatarUrl : user.avatarUrl,
        emailVerified:
          params.emailVerified !== undefined ? params.emailVerified : user.emailVerified,
        status: params.status !== undefined ? params.status : user.status,
        metadata:
          params.metadata !== undefined ? { ...user.metadata, ...params.metadata } : user.metadata,
        updatedAt: new Date().toISOString(),
      };

      // Store updated user
      await this.storeUser(updatedUser);

      // Emit user updated event (non-blocking)
      this.emitUserUpdated(userId, params);

      return {
        ok: true,
        data: updatedUser,
      };
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'UPDATE_USER_FAILED',
          message: error.message,
        },
      };
    }
  }

  /**
   * Deletes user (soft delete by default).
   *
   * Emits: identity.user.deleted
   *
   * @param userId - User ID
   * @param hardDelete - If true, permanently delete user
   * @returns Success result
   */
  async deleteUser(userId: string, hardDelete = false): Promise<IdentityEngineResult<void>> {
    try {
      const result = await this.getUserById(userId);
      if (!result.ok || !result.data) {
        return {
        ok: false,
        error: result.error,
      };
      }

      if (hardDelete) {
        // Permanently delete user
        await this.removeUser(userId);
      } else {
        // Soft delete (set status to deleted)
        await this.updateUser(userId, { status: 'deleted' });
      }

      // Emit user deleted event (non-blocking)
      this.emitUserDeleted(userId);

      return {
        ok: true,
      };
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'DELETE_USER_FAILED',
          message: error.message,
        },
      };
    }
  }

  /**
   * Lists users with pagination.
   *
   * @param options - Pagination and filtering options
   * @returns List of users
   */
  async listUsers(options?: {
    limit?: number;
    offset?: number;
    status?: UserStatus;
  }): Promise<IdentityEngineResult<User[]>> {
    try {
      const users = await this.fetchUsers({
        limit: options?.limit || 50,
        offset: options?.offset || 0,
        status: options?.status,
      });

      return {
        ok: true,
        data: users,
      };
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'LIST_USERS_FAILED',
          message: error.message,
        },
      };
    }
  }

  /**
   * Records user login activity.
   *
   * @param userId - User ID
   */
  async recordLogin(userId: string): Promise<IdentityEngineResult<void>> {
    try {
      await this.updateUser(userId, {
        metadata: { lastLoginAt: new Date().toISOString() },
      });

      return {
        ok: true,
      };
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'RECORD_LOGIN_FAILED',
          message: error.message,
        },
      };
    }
  }

  // =============================================================================
  // PRIVATE HELPER METHODS
  // =============================================================================

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  private async storeUser(user: User): Promise<void> {
    // In production, this would call the database
    // For now, this is a stub that simulates storage
    console.log('[IdentityEngine] Store user:', user.id);
  }

  private async fetchUserById(userId: string): Promise<User | null> {
    // In production, this would query the database
    // For now, return null (user not found)
    console.log('[IdentityEngine] Fetch user by ID:', userId);
    return null;
  }

  private async fetchUserByEmail(email: string): Promise<User | null> {
    // In production, this would query the database
    // For now, return null (user not found)
    console.log('[IdentityEngine] Fetch user by email:', email);
    return null;
  }

  private async fetchUsers(options: {
    limit: number;
    offset: number;
    status?: UserStatus;
  }): Promise<User[]> {
    // In production, this would query the database
    // For now, return empty array
    console.log('[IdentityEngine] Fetch users:', options);
    return [];
  }

  private async removeUser(userId: string): Promise<void> {
    // In production, this would delete from database
    console.log('[IdentityEngine] Remove user:', userId);
  }

  private emitUserCreated(user: User): void {
    const payload: UserCreatedEvent = {
      userId: user.id,
      email: user.email,
      displayName: user.displayName,
      timestamp: new Date().toISOString(),
    };

    setImmediate(() => {
      this.eventBus.emit('identity.user.created', payload).catch((error) => {
        console.error('[IdentityEngine] Failed to emit user.created event:', error);
      });
    });
  }

  private emitUserUpdated(userId: string, changes: UpdateUserParams): void {
    const payload: UserUpdatedEvent = {
      userId,
      changes,
      timestamp: new Date().toISOString(),
    };

    setImmediate(() => {
      this.eventBus.emit('identity.user.updated', payload).catch((error) => {
        console.error('[IdentityEngine] Failed to emit user.updated event:', error);
      });
    });
  }

  private emitUserDeleted(userId: string): void {
    const payload: UserDeletedEvent = {
      userId,
      timestamp: new Date().toISOString(),
    };

    setImmediate(() => {
      this.eventBus.emit('identity.user.deleted', payload).catch((error) => {
        console.error('[IdentityEngine] Failed to emit user.deleted event:', error);
      });
    });
  }
}
