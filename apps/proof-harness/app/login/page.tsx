'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') ?? '/dashboard';
  const supabase = createClientComponentClient();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push(redirectTo);
  }

  return (
    <main style={{ fontFamily: 'system-ui', padding: '3rem', maxWidth: '520px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem' }}>Welcome back</h1>
        <p style={{ color: '#64748b' }}>Sign in to continue your builds.</p>
      </header>

      <form
        onSubmit={handleSubmit}
        style={{
          display: 'grid',
          gap: '1.25rem',
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 12px 24px rgba(15, 23, 42, 0.08)',
        }}
      >
        <label style={{ display: 'grid', gap: '0.5rem' }}>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            style={{ padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5f5' }}
          />
        </label>
        <label style={{ display: 'grid', gap: '0.5rem' }}>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            style={{ padding: '0.75rem', borderRadius: '10px', border: '1px solid #cbd5f5' }}
          />
        </label>

        {error && (
          <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.75rem', borderRadius: '10px' }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '0.85rem',
            borderRadius: '999px',
            border: 'none',
            backgroundColor: '#1d4ed8',
            color: 'white',
            fontWeight: 600,
            cursor: loading ? 'wait' : 'pointer',
          }}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <p style={{ marginTop: '1.5rem', color: '#64748b' }}>
        Need an account?{' '}
        <Link href="/signup" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>
          Create one
        </Link>
      </p>
    </main>
  );
}
