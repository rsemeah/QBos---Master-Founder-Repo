'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BuildSession, getBuildSession } from '../../../lib/api';

interface BuildCompletePageProps {
  params: { id: string };
}

export default function BuildCompletePage({ params }: BuildCompletePageProps) {
  const [session, setSession] = useState<BuildSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getBuildSession(params.id)
      .then((data) => setSession(data))
      .catch((err: Error) => setError(err.message));
  }, [params.id]);

  return (
    <main style={{ fontFamily: 'system-ui', padding: '3rem', maxWidth: '960px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <Link href={`/build/${params.id}`} style={{ color: '#3b82f6', textDecoration: 'none' }}>
          ← Back to progress
        </Link>
        <h1 style={{ marginTop: '1rem', fontSize: '2rem' }}>Build complete</h1>
        <p style={{ color: '#64748b' }}>Session ID: {params.id}</p>
      </header>

      {error && (
        <div style={{ padding: '1rem', borderRadius: '12px', backgroundColor: '#fee2e2', color: '#b91c1c' }}>
          {error}
        </div>
      )}

      <section
        style={{
          backgroundColor: '#eff6ff',
          borderRadius: '16px',
          padding: '2rem',
          border: '1px solid #bfdbfe',
          display: 'grid',
          gap: '1.5rem',
        }}
      >
        <div>
          <h2 style={{ marginTop: 0 }}>Your app is ready</h2>
          <p style={{ color: '#1e3a8a' }}>
            Share the links below with your team or open them to review the deployment.
          </p>
        </div>

        <div style={{ display: 'grid', gap: '1rem' }}>
          <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Repository</div>
            <div style={{ fontWeight: 600 }}>
              {session?.github_repo_url ?? 'Repository will appear once access is granted.'}
            </div>
          </div>
          <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Deployment</div>
            <div style={{ fontWeight: 600 }}>
              {session?.vercel_deployment_url ?? 'Deployment link will appear when ready.'}
            </div>
          </div>
        </div>
      </section>

      <section style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <Link
          href="/dashboard"
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '999px',
            border: '1px solid #cbd5f5',
            color: '#1e3a8a',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          Back to dashboard
        </Link>
        <Link
          href="/build"
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '999px',
            backgroundColor: '#1d4ed8',
            color: 'white',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          Continue with Rob
        </Link>
      </section>
    </main>
  );
}
