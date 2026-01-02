/**
 * StateStore - Session persistence abstraction
 */

import type { BuildSession } from './types';

export class StateStore {
  private sessions: Map<string, BuildSession> = new Map();

  saveSession(session: BuildSession): void {
    this.sessions.set(session.id, { ...session });
  }

  getSession(sessionId: string): BuildSession | null {
    const session = this.sessions.get(sessionId);
    return session ? { ...session } : null;
  }

  hasSession(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }

  deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  getAllSessions(): BuildSession[] {
    return Array.from(this.sessions.values()).map((s) => ({ ...s }));
  }
}
