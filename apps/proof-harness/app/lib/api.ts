/**
 * API Client - Type-safe API wrapper functions
 */

export interface BuildSession {
  id: string;
  user_id: string;
  idea_description: string;
  current_state: string;
  readiness_tier: string;
  template_id?: string;
  config?: Record<string, any>;
  github_repo_url?: string;
  vercel_deployment_url?: string;
  created_at: string;
  updated_at: string;
}

export interface StartBuildResponse {
  success: boolean;
  session: BuildSession;
  match: {
    template: any;
    confidence: string;
  };
}

export interface PaymentIntentResponse {
  success: boolean;
  clientSecret: string;
  paymentIntentId: string;
}

/**
 * Start a new build session
 */
export async function startBuild(ideaDescription: string): Promise<StartBuildResponse> {
  const res = await fetch('/api/build/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ideaDescription }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || 'Failed to start build');
  }

  return res.json();
}

/**
 * Get build session by ID
 */
export async function getBuildSession(sessionId: string): Promise<BuildSession> {
  const res = await fetch(`/api/build/session?session_id=${sessionId}`);

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || 'Failed to get session');
  }

  const data = await res.json();
  return data.session;
}

/**
 * Create payment intent
 */
export async function createPaymentIntent(sessionId: string): Promise<PaymentIntentResponse> {
  const res = await fetch('/api/build/payment/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || 'Failed to create payment intent');
  }

  return res.json();
}

/**
 * Get user's build sessions
 */
export async function getUserSessions(): Promise<BuildSession[]> {
  const res = await fetch('/api/build/sessions');

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || 'Failed to get sessions');
  }

  const data = await res.json();
  return data.sessions || [];
export interface BuildSession {
  id: string;
  idea_description: string;
  current_state?: string | null;
  readiness_tier?: string | null;
  template_id?: string | null;
  github_repo_url?: string | null;
  vercel_deployment_url?: string | null;
  created_at?: string | null;
}

async function apiFetch<T>(path: string): Promise<T> {
  const response = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    throw new Error(errorPayload.error ?? 'Request failed');
  }

  return response.json() as Promise<T>;
}

export async function getBuildSessions(): Promise<BuildSession[]> {
  const payload = await apiFetch<{ sessions: BuildSession[] }>('/api/build/sessions');
  return payload.sessions;
}

export async function getBuildSession(sessionId: string): Promise<BuildSession | null> {
  const payload = await apiFetch<{ session: BuildSession | null }>(`/api/build/sessions?id=${sessionId}`);
  return payload.session;
}

export async function createBuildSession(idea: string): Promise<BuildSession> {
  const response = await fetch('/api/build/start', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ idea }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? 'Failed to start build');
  }

  return data.session as BuildSession;
}
