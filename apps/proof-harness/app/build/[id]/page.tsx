'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import BuildStateIndicator from '../../components/BuildStateIndicator';
import ReadinessTierBadge from '../../components/ReadinessTierBadge';
import { BuildSession, getBuildSession } from '../../lib/api';

interface BuildStatusPageProps {
  params: { id: string };
}

const STATE_ORDER = [
  'IDEA_CAPTURE',
  'TEMPLATE_MATCH',
  'CONFIG_QUESTIONS',
  'PAYMENT_REQUIRED',
  'PAYMENT_PROCESSING',
  'CODE_GENERATING',
  'CODE_DEPLOYING',
  'ACCESS_GRANTING',
  'COMPLETE',
];

export default function BuildStatusPage({ params }: BuildStatusPageProps) {
  const [session, setSession] = useState<BuildSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const fetchSession = async () => {
      try {
        const data = await getBuildSession(params.id);
        setSession(data);
        setLoading(false);
      } catch (err) {
        setError((err as Error).message);
        setLoading(false);
      }
    };

    fetchSession();
    interval = setInterval(fetchSession, 3000);

    return () => clearInterval(interval);
  }, [params.id]);

  const currentIndex = session?.current_state
    ? STATE_ORDER.indexOf(session.current_state)
    : -1;

  return (
    <main style={{ fontFamily: 'system-ui', padding: '3rem', maxWidth: '960px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <Link href="/dashboard" style={{ color: '#3b82f6', textDecoration: 'none' }}>
          ← Back to dashboard
        </Link>
        <h1 style={{ marginTop: '1rem', fontSize: '2rem' }}>Build progress</h1>
        <p style={{ color: '#64748b' }}>Session ID: {params.id}</p>
      </header>

      {loading && (
        <div style={{ padding: '2rem', borderRadius: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
          Loading session details...
        </div>
      )}

      {error && (
        <div style={{ padding: '1rem', borderRadius: '12px', backgroundColor: '#fee2e2', color: '#b91c1c' }}>
          {error}
        </div>
      )}

      {!loading && !error && session && (
        <section
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
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ marginTop: 0 }}>{session.idea_description}</h2>
              {session.template_id && (
                <p style={{ color: '#64748b' }}>Template: {session.template_id}</p>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
              <BuildStateIndicator state={session.current_state} />
              <ReadinessTierBadge tier={session.readiness_tier} />
            </div>
          </div>

          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {STATE_ORDER.map((state, index) => {
              const isComplete = currentIndex >= index && currentIndex !== -1;
              const isCurrent = session.current_state === state;
              return (
                <div
                  key={state}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: isCurrent ? '#eef2ff' : isComplete ? '#ecfdf5' : '#f8fafc',
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{state.replace('_', ' ')}</span>
                  <span style={{ color: '#64748b' }}>{isCurrent ? 'Current' : isComplete ? 'Done' : 'Pending'}</span>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {session.current_state === 'PAYMENT_REQUIRED' && (
              <Link
                href={`/build/${session.id}/payment`}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '999px',
                  backgroundColor: '#1d4ed8',
                  color: 'white',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                Proceed to payment
              </Link>
            )}
            {(session.current_state === 'COMPLETE' || session.readiness_tier === 'ACCESSIBLE') && (
              <Link
                href={`/build/${session.id}/complete`}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '999px',
                  border: '1px solid #cbd5f5',
                  color: '#1e3a8a',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                View completion
              </Link>
            )}
            <Link
              href="/build"
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '999px',
                border: '1px solid #e2e8f0',
                color: '#475569',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              Continue with Rob
            </Link>
          </div>
        </section>
      )}
import Link from 'next/link';

interface BuildStatusPageProps {
  params: {
    id: string;
  };
}

const STATUS_STEPS = [
  { label: 'Idea captured', status: 'complete' },
  { label: 'Template matched', status: 'in-progress' },
  { label: 'Payment verified', status: 'pending' },
  { label: 'Build running', status: 'pending' },
  { label: 'Deployment ready', status: 'pending' },
];

export default function BuildStatusPage({ params }: BuildStatusPageProps) {
  return (
    <main style={{ fontFamily: 'system-ui', padding: '3rem', maxWidth: '960px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <Link href="/" style={{ color: '#3b82f6', textDecoration: 'none' }}>
          ← Back to Dashboard
        </Link>
        <h1 style={{ marginTop: '1rem', fontSize: '2rem' }}>Build Session</h1>
        <p style={{ color: '#6b7280' }}>
          Session ID: <span style={{ fontWeight: 600 }}>{params.id}</span>
        </p>
      </header>

      <section
        style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '2rem',
          border: '1px solid #e5e7eb',
          boxShadow: '0 10px 20px rgba(15, 23, 42, 0.08)',
        }}
      >
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Progress</h2>
        <div style={{ display: 'grid', gap: '1rem' }}>
          {STATUS_STEPS.map((step) => (
            <div
              key={step.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                backgroundColor: step.status === 'complete' ? '#ecfdf5' : '#f8fafc',
              }}
            >
              <span style={{ fontWeight: 600 }}>{step.label}</span>
              <span
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '999px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  backgroundColor:
                    step.status === 'complete'
                      ? '#22c55e'
                      : step.status === 'in-progress'
                      ? '#3b82f6'
                      : '#cbd5f5',
                  color: step.status === 'pending' ? '#1f2937' : 'white',
                }}
              >
                {step.status === 'complete' ? 'Complete' : step.status === 'in-progress' ? 'In progress' : 'Pending'}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <Link
          href="/build"
          style={{
            padding: '0.85rem 1.5rem',
            borderRadius: '999px',
            backgroundColor: '#1d4ed8',
            color: 'white',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          Continue in Rob chat
        </Link>
        <Link
          href={`/build/${params.id}/complete`}
          style={{
            padding: '0.85rem 1.5rem',
            borderRadius: '999px',
            border: '1px solid #cbd5f5',
            color: '#1e3a8a',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          View completion details
        </Link>
      </section>
    </main>
  );
}
