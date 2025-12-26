/**
 * Dashboard Page - User's build sessions list
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { SessionCard } from '../components/SessionCard';
import { getUserSessions, BuildSession } from '../lib/api';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [sessions, setSessions] = useState<BuildSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, [supabase]);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getUserSessions();
      setSessions(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">QuietBuild OS</h1>
          <div className="flex items-center gap-4">
            {user && (
              <span className="text-sm text-gray-600">{user.email}</span>
            )}
            <button
              onClick={handleLogout}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Your Builds</h2>
            <p className="text-gray-600 mt-1">Manage and track your app builds</p>
          </div>
          <Link
            href="/build/new"
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 font-medium"
          >
            + Start New Build
          </Link>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading your builds...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && sessions.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <div className="text-6xl mb-4">🚀</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No builds yet</h3>
            <p className="text-gray-600 mb-6">Start your first app build to get started</p>
            <Link
              href="/build/new"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 font-medium"
            >
              Start Building
            </Link>
          </div>
        )}

        {/* Sessions Grid */}
        {!loading && sessions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        )}
      </main>
    </div>
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
