// Rob API Client - Constitutional Integration
// NO MOCKS. Real API calls only.

export interface RobSession {
  id: string;
  state: string;
  progress: number;
  readiness: string;
  consent_granted: boolean;
}

export interface RobMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface RobReceipt {
  id: string;
  type: string;
  details: Record<string, any>;
  timestamp: string;
}

class RobClient {
  private baseUrl = '/api/rob';

  async initSession(templateId: string = 'minimal-vertical-slice'): Promise<{
    session: RobSession;
    messages: RobMessage[];
  }> {
    const res = await fetch(`${this.baseUrl}/init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ template_id: templateId }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to initialize session');
    }

    return res.json();
  }

  async sendMessage(sessionId: string, message: string): Promise<{
    response: string;
    session: RobSession;
    system_message?: string;
  }> {
    const res = await fetch(`${this.baseUrl}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, message }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to send message');
    }

    return res.json();
  }

  // Add receipt querying when backend supports it
  async getReceipts(sessionId: string): Promise<RobReceipt[]> {
    // TODO: Implement when /api/rob/receipts exists
    return [];
  }
}

export const robClient = new RobClient();
