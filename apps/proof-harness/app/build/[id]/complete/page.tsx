import Link from 'next/link';

interface BuildCompletePageProps {
  params: {
    id: string;
  };
}

export default function BuildCompletePage({ params }: BuildCompletePageProps) {
  return (
    <main style={{ fontFamily: 'system-ui', padding: '3rem', maxWidth: '960px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <Link href="/" style={{ color: '#3b82f6', textDecoration: 'none' }}>
          ← Back to Dashboard
        </Link>
        <h1 style={{ marginTop: '1rem', fontSize: '2rem' }}>Build Complete</h1>
        <p style={{ color: '#6b7280' }}>
          Session ID: <span style={{ fontWeight: 600 }}>{params.id}</span>
        </p>
      </header>

      <section
        style={{
          backgroundColor: '#eff6ff',
          borderRadius: '16px',
          padding: '2rem',
          border: '1px solid #bfdbfe',
        }}
      >
        <h2 style={{ marginTop: 0 }}>Your app is ready to access</h2>
        <p style={{ color: '#1e3a8a', maxWidth: '600px' }}>
          Your build completed successfully. Share the links below with your team, or return to Rob to
          make adjustments.
        </p>
        <div style={{ display: 'grid', gap: '1rem', marginTop: '1.5rem' }}>
          <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Repository</div>
            <div style={{ fontWeight: 600 }}>https://github.com/your-org/build-{params.id}</div>
          </div>
          <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Deployment</div>
            <div style={{ fontWeight: 600 }}>https://build-{params.id}.vercel.app</div>
          </div>
        </div>
      </section>

      <section style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <Link
          href={`/build/${params.id}`}
          style={{
            padding: '0.85rem 1.5rem',
            borderRadius: '999px',
            border: '1px solid #cbd5f5',
            color: '#1e3a8a',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          View build progress
        </Link>
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
          Continue with Rob
        </Link>
      </section>
    </main>
  );
}
