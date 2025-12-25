'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewBuildPage() {
  const [idea, setIdea] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!idea.trim()) return;
    setSubmitting(true);

    // Temporary handoff to Rob chat while build session wiring is completed.
    router.push('/build');
  }

  return (
    <main style={{ fontFamily: 'system-ui', padding: '3rem', maxWidth: '900px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <Link href="/" style={{ color: '#3b82f6', textDecoration: 'none' }}>
          ← Back to Dashboard
        </Link>
        <h1 style={{ marginTop: '1rem', fontSize: '2rem' }}>Start a New Build</h1>
        <p style={{ color: '#6b7280', maxWidth: '640px' }}>
          Describe what you want to build. We1ll use this to prepare your session and route you to Rob.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: '0 12px 24px rgba(15, 23, 42, 0.08)',
          border: '1px solid #e5e7eb',
        }}
      >
        <label htmlFor="idea" style={{ display: 'block', fontWeight: 600, marginBottom: '0.75rem' }}>
          App idea
        </label>
        <textarea
          id="idea"
          value={idea}
          onChange={(event) => setIdea(event.target.value)}
          placeholder="Example: I want a simple habit tracker for my morning routine."
          rows={6}
          style={{
            width: '100%',
            padding: '1rem',
            borderRadius: '12px',
            border: '1px solid #d1d5db',
            fontSize: '1rem',
            resize: 'vertical',
          }}
        />
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
          <button
            type="submit"
            disabled={!idea.trim() || submitting}
            style={{
              padding: '0.85rem 1.75rem',
              backgroundColor: !idea.trim() || submitting ? '#d1d5db' : '#2563eb',
              color: 'white',
              borderRadius: '999px',
              border: 'none',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: !idea.trim() || submitting ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? 'Routing to Rob...' : 'Start build'}
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

      <section style={{ marginTop: '2.5rem' }}>
        <h2 style={{ fontSize: '1.25rem' }}>What happens next?</h2>
        <ol style={{ color: '#6b7280', paddingLeft: '1.25rem', lineHeight: 1.8 }}>
          <li>Rob reviews your idea and asks follow-up questions.</li>
          <li>You confirm the plan and approve the build.</li>
          <li>The system prepares your repository and deployment.</li>
        </ol>
      </section>
    </main>
  );
}
