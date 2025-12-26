/**
 * New Build Page - Idea input form
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { startBuild } from '../../lib/api';
import Link from 'next/link';

const EXAMPLE_PROMPTS = [
  'A todo list app with categories and priorities',
  'A blog where I can write and publish articles',
  'A dashboard to track my fitness goals',
  'A landing page for my consulting business',
];

export default function NewBuildPage() {
  const router = useRouter();
  const [ideaDescription, setIdeaDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (ideaDescription.trim().length < 10) {
      setError('Please describe your idea with at least 10 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await startBuild(ideaDescription);
      router.push(`/build/${response.session.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to start build');
      setLoading(false);
    }
  };

  const handleExampleClick = (example: string) => {
    setIdeaDescription(example);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/dashboard" className="text-sm text-blue-600 hover:text-blue-700">
            ← Back to Dashboard
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            What do you want to build?
          </h1>
          <p className="text-lg text-gray-600">
            Describe your app idea in plain English. Be specific about what you want it to do.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
                {error}
              </div>
            )}

            <div className="mb-6">
              <label htmlFor="idea" className="block text-sm font-medium text-gray-700 mb-2">
                Your Idea
              </label>
              <textarea
                id="idea"
                value={ideaDescription}
                onChange={(e) => setIdeaDescription(e.target.value)}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Example: I want a todo list app where I can organize tasks by project, set priorities, and mark them complete..."
                required
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500">
                  {ideaDescription.length} characters (minimum 10)
                </span>
                {ideaDescription.length >= 10 && (
                  <span className="text-xs text-green-600">✓ Ready to build</span>
                )}
              </div>
            </div>

            {/* Example Prompts */}
            <div className="mb-8">
              <p className="text-sm font-medium text-gray-700 mb-3">
                Need inspiration? Try these examples:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {EXAMPLE_PROMPTS.map((example, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleExampleClick(example)}
                    className="text-left p-3 text-sm bg-gray-50 hover:bg-gray-100 rounded-md border border-gray-200 transition-colors"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || ideaDescription.trim().length < 10}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg"
            >
              {loading ? 'Starting build...' : 'Start Building'}
            </button>
          </form>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>💡 Tip: The more specific you are, the better your app will match your vision</p>
        </div>
      </main>
    </div>
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
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewBuildPage() {
  const [idea, setIdea] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClientComponentClient();
  const router = useRouter();

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
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (idea.trim().length < 10) return;
    setSubmitting(true);

    // TODO: wire to /api/build/start when session creation is ready.
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
        <Link href="/dashboard" style={{ color: '#3b82f6', textDecoration: 'none' }}>
          ← Back to dashboard
        </Link>
        <h1 style={{ marginTop: '1rem', fontSize: '2.2rem' }}>Start a new build</h1>
        <p style={{ color: '#64748b' }}>
          Describe your idea in a sentence or two. Rob will ask follow-up questions and prepare the build.
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
