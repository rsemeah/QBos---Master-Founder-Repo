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
