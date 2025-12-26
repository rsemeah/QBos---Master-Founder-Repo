'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import SessionCard from '../components/SessionCard';
import { BuildSession, getBuildSessions } from '../lib/api';

export default function DashboardPage() {
  const [sessions, setSessions] = useState<BuildSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    getBuildSessions()
      .then((data) => {
        if (isMounted) {
          setSessions(data);
          setLoading(false);
        }
      })
      .catch((err: Error) => {
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main style={{ fontFamily: 'system-ui', padding: '3rem', maxWidth: '1100px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem' }}>Your builds</h1>
          <p style={{ color: '#64748b' }}>Track progress, payments, and handoff links.</p>
        </div>
        <Link
          href="/build/new"
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '999px',
            backgroundColor: '#1d4ed8',
            color: 'white',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          Start new build
        </Link>
      </header>

      {loading && (
        <div style={{ padding: '2rem', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
          Loading your sessions...
        </div>
      )}

      {error && (
        <div style={{ padding: '1rem', borderRadius: '12px', backgroundColor: '#fee2e2', color: '#b91c1c' }}>
          {error}
        </div>
      )}

      {!loading && !error && sessions.length === 0 && (
        <div style={{ padding: '2rem', borderRadius: '16px', border: '1px dashed #cbd5f5', textAlign: 'center' }}>
          <h2 style={{ marginTop: 0 }}>No builds yet</h2>
          <p style={{ color: '#64748b' }}>Start a build to see progress and deployment links here.</p>
          <Link
            href="/build/new"
            style={{
              display: 'inline-block',
              marginTop: '1rem',
              padding: '0.75rem 1.5rem',
              borderRadius: '999px',
              backgroundColor: '#2563eb',
              color: 'white',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Start your first build
          </Link>
        </div>
      )}

      {!loading && !error && sessions.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {sessions.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
        </div>
      )}
    </main>
  );
}
