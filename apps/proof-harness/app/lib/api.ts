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
