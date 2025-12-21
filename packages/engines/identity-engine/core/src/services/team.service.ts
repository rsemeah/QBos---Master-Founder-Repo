/**
 * TeamService
 *
 * Team and membership management for IdentityEngine.
 * Handles teams, team members, and team-level permissions.
 */

import type { EventBus } from '@qbos/events';
import type {
  Team,
  CreateTeamParams,
  UpdateTeamParams,
  TeamStatus,
  TeamMember,
  AddTeamMemberParams,
  TeamMemberRole,
  IdentityEngineResult,
  TeamCreatedEvent,
  TeamMemberAddedEvent,
  TeamMemberRemovedEvent,
} from '../types';

export class TeamService {
  constructor(private eventBus: EventBus) {}

  // =============================================================================
  // TEAM MANAGEMENT
  // =============================================================================

  /**
   * Creates a new team.
   *
   * Emits: identity.team.created
   *
   * @param params - Team creation parameters
   * @returns Created team object
   */
  async createTeam(params: CreateTeamParams): Promise<IdentityEngineResult<Team>> {
    try {
      // Validate slug format
      if (!this.isValidSlug(params.slug)) {
        return {
          ok: false,
          error: {
            code: 'INVALID_SLUG',
            message: 'Slug must be lowercase alphanumeric with hyphens only',
            details: { slug: params.slug },
          },
        };
      }

      // Check if slug already exists
      const existing = await this.getTeamBySlug(params.slug);
      if (existing.ok && existing.data) {
        return {
          ok: false,
          error: {
            code: 'TEAM_SLUG_EXISTS',
            message: 'Team with this slug already exists',
            details: { slug: params.slug },
          },
        };
      }

      // Create team object
      const now = new Date().toISOString();
      const team: Team = {
        id: this.generateTeamId(),
        name: params.name,
        slug: params.slug.toLowerCase(),
        description: params.description || null,
        avatarUrl: params.avatarUrl || null,
        ownerId: params.ownerId,
        status: 'active',
        metadata: params.metadata || {},
        createdAt: now,
        updatedAt: now,
      };

      // Store team
      await this.storeTeam(team);

      // Auto-add owner as team member
      await this.addTeamMember({
        teamId: team.id,
        userId: params.ownerId,
        role: 'owner',
      });

      // Emit team created event (non-blocking)
      this.emitTeamCreated(team);

      return {
        ok: true,
        data: team,
      };
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'CREATE_TEAM_FAILED',
          message: error.message,
        },
      };
    }
  }

  /**
   * Gets team by ID.
   *
   * @param teamId - Team ID
   * @returns Team object or error
   */
  async getTeamById(teamId: string): Promise<IdentityEngineResult<Team>> {
    try {
      const team = await this.fetchTeamById(teamId);

      if (!team) {
        return {
          ok: false,
          error: {
            code: 'TEAM_NOT_FOUND',
            message: 'Team not found',
            details: { teamId },
          },
        };
      }

      return {
        ok: true,
        data: team,
      };
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'GET_TEAM_FAILED',
          message: error.message,
        },
      };
    }
  }

  /**
   * Gets team by slug.
   *
   * @param slug - Team slug
   * @returns Team object or error
   */
  async getTeamBySlug(slug: string): Promise<IdentityEngineResult<Team>> {
    try {
      const team = await this.fetchTeamBySlug(slug.toLowerCase());

      if (!team) {
        return {
          ok: false,
          error: {
            code: 'TEAM_NOT_FOUND',
            message: 'Team not found',
            details: { slug },
          },
        };
      }

      return {
        ok: true,
        data: team,
      };
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'GET_TEAM_FAILED',
          message: error.message,
        },
      };
    }
  }

  /**
   * Updates team information.
   *
   * @param teamId - Team ID
   * @param params - Update parameters
   * @returns Updated team object
   */
  async updateTeam(
    teamId: string,
    params: UpdateTeamParams
  ): Promise<IdentityEngineResult<Team>> {
    try {
      const result = await this.getTeamById(teamId);
      if (!result.ok || !result.data) {
        return result;
      }

      const team = result.data;

      // Validate slug if provided
      if (params.slug && !this.isValidSlug(params.slug)) {
        return {
          ok: false,
          error: {
            code: 'INVALID_SLUG',
            message: 'Slug must be lowercase alphanumeric with hyphens only',
            details: { slug: params.slug },
          },
        };
      }

      // Apply updates
      const updatedTeam: Team = {
        ...team,
        name: params.name !== undefined ? params.name : team.name,
        slug: params.slug !== undefined ? params.slug.toLowerCase() : team.slug,
        description: params.description !== undefined ? params.description : team.description,
        avatarUrl: params.avatarUrl !== undefined ? params.avatarUrl : team.avatarUrl,
        status: params.status !== undefined ? params.status : team.status,
        metadata:
          params.metadata !== undefined ? { ...team.metadata, ...params.metadata } : team.metadata,
        updatedAt: new Date().toISOString(),
      };

      // Store updated team
      await this.storeTeam(updatedTeam);

      return {
        ok: true,
        data: updatedTeam,
      };
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'UPDATE_TEAM_FAILED',
          message: error.message,
        },
      };
    }
  }

  /**
   * Deletes a team (soft delete by default).
   *
   * @param teamId - Team ID
   * @param hardDelete - If true, permanently delete team
   * @returns Success result
   */
  async deleteTeam(teamId: string, hardDelete = false): Promise<IdentityEngineResult<void>> {
    try {
      const result = await this.getTeamById(teamId);
      if (!result.ok || !result.data) {
        return {
        ok: false,
        error: result.error,
      };
      }

      if (hardDelete) {
        // Permanently delete team
        await this.removeTeam(teamId);
      } else {
        // Soft delete (set status to deleted)
        await this.updateTeam(teamId, { status: 'deleted' });
      }

      return {
        ok: true,
      };
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'DELETE_TEAM_FAILED',
          message: error.message,
        },
      };
    }
  }

  /**
   * Lists teams with optional filtering.
   *
   * @param options - Filtering options
   * @returns List of teams
   */
  async listTeams(options?: {
    ownerId?: string;
    status?: TeamStatus;
  }): Promise<IdentityEngineResult<Team[]>> {
    try {
      const teams = await this.fetchTeams({
        ownerId: options?.ownerId,
        status: options?.status,
      });

      return {
        ok: true,
        data: teams,
      };
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'LIST_TEAMS_FAILED',
          message: error.message,
        },
      };
    }
  }

  // =============================================================================
  // TEAM MEMBERSHIP
  // =============================================================================

  /**
   * Adds a member to a team.
   *
   * Emits: identity.team.member.added
   *
   * @param params - Team member parameters
   * @returns Team member object
   */
  async addTeamMember(params: AddTeamMemberParams): Promise<IdentityEngineResult<TeamMember>> {
    try {
      // Verify team exists
      const teamResult = await this.getTeamById(params.teamId);
      if (!teamResult.ok || !teamResult.data) {
        return {
        ok: false,
        error: teamResult.error,
      };
      }

      // Check if user is already a member
      const existing = await this.getTeamMember(params.teamId, params.userId);
      if (existing) {
        return {
          ok: false,
          error: {
            code: 'ALREADY_TEAM_MEMBER',
            message: 'User is already a member of this team',
            details: { teamId: params.teamId, userId: params.userId },
          },
        };
      }

      // Create team member
      const now = new Date().toISOString();
      const teamMember: TeamMember = {
        id: this.generateTeamMemberId(),
        teamId: params.teamId,
        userId: params.userId,
        role: params.role,
        invitedBy: params.invitedBy || null,
        joinedAt: now,
        metadata: params.metadata || {},
      };

      // Store team member
      await this.storeTeamMember(teamMember);

      // Emit team member added event (non-blocking)
      this.emitTeamMemberAdded(teamMember);

      return {
        ok: true,
        data: teamMember,
      };
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'ADD_TEAM_MEMBER_FAILED',
          message: error.message,
        },
      };
    }
  }

  /**
   * Removes a member from a team.
   *
   * Emits: identity.team.member.removed
   *
   * @param teamId - Team ID
   * @param userId - User ID
   * @param removedBy - User who removed the member
   * @returns Success result
   */
  async removeTeamMember(
    teamId: string,
    userId: string,
    removedBy?: string
  ): Promise<IdentityEngineResult<void>> {
    try {
      const teamMember = await this.getTeamMember(teamId, userId);

      if (!teamMember) {
        return {
          ok: false,
          error: {
            code: 'NOT_TEAM_MEMBER',
            message: 'User is not a member of this team',
            details: { teamId, userId },
          },
        };
      }

      // Prevent removing the owner
      if (teamMember.role === 'owner') {
        return {
          ok: false,
          error: {
            code: 'CANNOT_REMOVE_OWNER',
            message: 'Cannot remove team owner',
            details: { teamId, userId },
          },
        };
      }

      // Remove team member
      await this.removeTeamMemberById(teamMember.id);

      // Emit team member removed event (non-blocking)
      this.emitTeamMemberRemoved(teamId, userId, removedBy || null);

      return {
        ok: true,
      };
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'REMOVE_TEAM_MEMBER_FAILED',
          message: error.message,
        },
      };
    }
  }

  /**
   * Gets all members of a team.
   *
   * @param teamId - Team ID
   * @returns List of team members
   */
  async getTeamMembers(teamId: string): Promise<IdentityEngineResult<TeamMember[]>> {
    try {
      const members = await this.fetchTeamMembers(teamId);

      return {
        ok: true,
        data: members,
      };
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'GET_TEAM_MEMBERS_FAILED',
          message: error.message,
        },
      };
    }
  }

  /**
   * Gets all teams a user is a member of.
   *
   * @param userId - User ID
   * @returns List of teams
   */
  async getUserTeams(userId: string): Promise<IdentityEngineResult<Team[]>> {
    try {
      const teams = await this.fetchUserTeams(userId);

      return {
        ok: true,
        data: teams,
      };
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'GET_USER_TEAMS_FAILED',
          message: error.message,
        },
      };
    }
  }

  /**
   * Updates a team member's role.
   *
   * @param teamId - Team ID
   * @param userId - User ID
   * @param newRole - New role
   * @returns Updated team member
   */
  async updateTeamMemberRole(
    teamId: string,
    userId: string,
    newRole: TeamMemberRole
  ): Promise<IdentityEngineResult<TeamMember>> {
    try {
      const teamMember = await this.getTeamMember(teamId, userId);

      if (!teamMember) {
        return {
          ok: false,
          error: {
            code: 'NOT_TEAM_MEMBER',
            message: 'User is not a member of this team',
            details: { teamId, userId },
          },
        };
      }

      // Prevent changing owner role
      if (teamMember.role === 'owner') {
        return {
          ok: false,
          error: {
            code: 'CANNOT_CHANGE_OWNER_ROLE',
            message: 'Cannot change team owner role',
            details: { teamId, userId },
          },
        };
      }

      // Update role
      const updatedMember: TeamMember = {
        ...teamMember,
        role: newRole,
      };

      await this.storeTeamMember(updatedMember);

      return {
        ok: true,
        data: updatedMember,
      };
    } catch (error: any) {
      return {
        ok: false,
        error: {
          code: 'UPDATE_TEAM_MEMBER_ROLE_FAILED',
          message: error.message,
        },
      };
    }
  }

  // =============================================================================
  // PRIVATE HELPER METHODS
  // =============================================================================

  private isValidSlug(slug: string): boolean {
    const slugRegex = /^[a-z0-9-]+$/;
    return slugRegex.test(slug);
  }

  private generateTeamId(): string {
    return `team_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  private generateTeamMemberId(): string {
    return `team_member_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  private async storeTeam(team: Team): Promise<void> {
    console.log('[IdentityEngine] Store team:', team.id);
  }

  private async fetchTeamById(teamId: string): Promise<Team | null> {
    console.log('[IdentityEngine] Fetch team by ID:', teamId);
    return null;
  }

  private async fetchTeamBySlug(slug: string): Promise<Team | null> {
    console.log('[IdentityEngine] Fetch team by slug:', slug);
    return null;
  }

  private async fetchTeams(options: {
    ownerId?: string;
    status?: TeamStatus;
  }): Promise<Team[]> {
    console.log('[IdentityEngine] Fetch teams:', options);
    return [];
  }

  private async removeTeam(teamId: string): Promise<void> {
    console.log('[IdentityEngine] Remove team:', teamId);
  }

  private async storeTeamMember(teamMember: TeamMember): Promise<void> {
    console.log('[IdentityEngine] Store team member:', teamMember.id);
  }

  private async getTeamMember(teamId: string, userId: string): Promise<TeamMember | null> {
    console.log('[IdentityEngine] Get team member:', teamId, userId);
    return null;
  }

  private async fetchTeamMembers(teamId: string): Promise<TeamMember[]> {
    console.log('[IdentityEngine] Fetch team members:', teamId);
    return [];
  }

  private async fetchUserTeams(userId: string): Promise<Team[]> {
    console.log('[IdentityEngine] Fetch user teams:', userId);
    return [];
  }

  private async removeTeamMemberById(memberId: string): Promise<void> {
    console.log('[IdentityEngine] Remove team member:', memberId);
  }

  private emitTeamCreated(team: Team): void {
    const payload: TeamCreatedEvent = {
      teamId: team.id,
      name: team.name,
      ownerId: team.ownerId,
      timestamp: new Date().toISOString(),
    };

    setImmediate(() => {
      this.eventBus.emit('identity.team.created', payload).catch((error) => {
        console.error('[IdentityEngine] Failed to emit team.created event:', error);
      });
    });
  }

  private emitTeamMemberAdded(teamMember: TeamMember): void {
    const payload: TeamMemberAddedEvent = {
      teamId: teamMember.teamId,
      userId: teamMember.userId,
      role: teamMember.role,
      invitedBy: teamMember.invitedBy,
      timestamp: new Date().toISOString(),
    };

    setImmediate(() => {
      this.eventBus.emit('identity.team.member.added', payload).catch((error) => {
        console.error('[IdentityEngine] Failed to emit team.member.added event:', error);
      });
    });
  }

  private emitTeamMemberRemoved(
    teamId: string,
    userId: string,
    removedBy: string | null
  ): void {
    const payload: TeamMemberRemovedEvent = {
      teamId,
      userId,
      removedBy,
      timestamp: new Date().toISOString(),
    };

    setImmediate(() => {
      this.eventBus.emit('identity.team.member.removed', payload).catch((error) => {
        console.error('[IdentityEngine] Failed to emit team.member.removed event:', error);
      });
    });
  }
}
