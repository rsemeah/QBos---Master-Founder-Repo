'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { createBuildSession } from '../../lib/api';

const EXAMPLES = [
  'A morning routine habit tracker for parents.',
  'A shared grocery list with push notifications.',
  'A simple budgeting tracker with weekly summaries.',
];

export default function NewBuildPage() {
  const [idea, setIdea] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClientComponentClient();

  const remaining = Math.max(0, 10 - idea.trim().length);

  function handleExample(example: string) {
    setIdea(example);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (idea.trim().length < 10) return;
    setSubmitting(true);
    setError(null);

    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      router.push('/login?redirectTo=/build/new');
      return;
    }

    try {
      const session = await createBuildSession(idea);
      router.push(`/build/${session.id}`);
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <main style={{ fontFamily: 'system-ui', padding: '3rem', maxWidth: '900px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <Link href="/dashboard" style={{ color: '#3b82f6', textDecoration: 'none' }}>
          ← Back to dashboard
        </Link>
        <h1 style={{ marginTop: '1rem', fontSize: '2.2rem' }}>Start a new build</h1>
        <p style={{ color: '#64748b' }}>
          Describe your idea in a sentence or two. Rob will ask follow-up questions and prepare the build.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '2rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 12px 24px rgba(15, 23, 42, 0.08)',
          display: 'grid',
          gap: '1.5rem',
        }}
      >
        <label style={{ display: 'grid', gap: '0.75rem', fontWeight: 600 }}>
          Your idea
          <textarea
            value={idea}
            onChange={(event) => setIdea(event.target.value)}
            rows={6}
            placeholder="Example: A simple habit tracker for grandparents managing daily routines."
            style={{
              width: '100%',
              padding: '1rem',
              borderRadius: '12px',
              border: '1px solid #cbd5f5',
              fontSize: '1rem',
              resize: 'vertical',
            }}
          />
        </label>

        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.9rem' }}>
          <span>{remaining > 0 ? `${remaining} more characters to start` : 'Looks good'}</span>
          <span>{idea.trim().length} characters</span>
        </div>

        {error && (
          <div style={{ padding: '0.85rem', borderRadius: '12px', backgroundColor: '#fee2e2', color: '#b91c1c' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => handleExample(example)}
              style={{
                border: '1px solid #cbd5f5',
                borderRadius: '999px',
                padding: '0.4rem 0.9rem',
                backgroundColor: '#f8fafc',
                cursor: 'pointer',
              }}
            >
              {example}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            type="submit"
            disabled={submitting || idea.trim().length < 10}
            style={{
              padding: '0.85rem 1.75rem',
              borderRadius: '999px',
              border: 'none',
              backgroundColor: idea.trim().length < 10 ? '#cbd5f5' : '#1d4ed8',
              color: 'white',
              fontWeight: 600,
              cursor: idea.trim().length < 10 ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? 'Starting...' : 'Start build'}
          </button>
          <Link
            href="/build"
            style={{
              alignSelf: 'center',
              color: '#2563eb',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Skip to Rob chat
          </Link>
        </div>
      </form>
    </main>
  );
}
