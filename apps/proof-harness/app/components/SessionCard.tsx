import Link from 'next/link';
import BuildStateIndicator from './BuildStateIndicator';
import ReadinessTierBadge from './ReadinessTierBadge';

interface SessionCardProps {
  session: {
    id: string;
    idea_description: string;
    current_state?: string | null;
    readiness_tier?: string | null;
    created_at?: string | null;
  };
}

export default function SessionCard({ session }: SessionCardProps) {
  return (
    <Link
      href={`/build/${session.id}`}
      style={{
        display: 'block',
        textDecoration: 'none',
        color: 'inherit',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '1.5rem',
        backgroundColor: 'white',
        boxShadow: '0 8px 16px rgba(15, 23, 42, 0.06)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{session.idea_description}</h3>
          <p style={{ margin: '0.5rem 0 0', color: '#64748b', fontSize: '0.9rem' }}>
            Session ID: {session.id}
          </p>
          {session.created_at && (
            <p style={{ margin: '0.5rem 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
              Created {new Date(session.created_at).toLocaleString()}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
          <BuildStateIndicator state={session.current_state} />
          <ReadinessTierBadge tier={session.readiness_tier} />
        </div>
      </div>
    </Link>
  );
}
