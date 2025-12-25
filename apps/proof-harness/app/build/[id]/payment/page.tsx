import Link from 'next/link';

interface BuildPaymentPageProps {
  params: { id: string };
}

export default function BuildPaymentPage({ params }: BuildPaymentPageProps) {
  return (
    <main style={{ fontFamily: 'system-ui', padding: '3rem', maxWidth: '720px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <Link href={`/build/${params.id}`} style={{ color: '#3b82f6', textDecoration: 'none' }}>
          ← Back to progress
        </Link>
        <h1 style={{ marginTop: '1rem', fontSize: '2rem' }}>Complete payment</h1>
        <p style={{ color: '#64748b' }}>
          Session ID: <strong>{params.id}</strong>
        </p>
      </header>

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
        <div>
          <h2 style={{ marginTop: 0 }}>Payment setup</h2>
          <p style={{ color: '#64748b' }}>
            Stripe Elements integration will live here. For now, complete payment via the admin flow and return
            to this page.
          </p>
        </div>

        <button
          type="button"
          onClick={() => alert('Payment placeholder: integrate Stripe Elements here.')}
          style={{
            padding: '0.85rem 1.75rem',
            borderRadius: '999px',
            border: 'none',
            backgroundColor: '#1d4ed8',
            color: 'white',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Simulate payment
        </button>
      </section>
    </main>
  );
}
