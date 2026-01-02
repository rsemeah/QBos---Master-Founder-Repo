'use client';

import Link from 'next/link';

const ENGINES = [
  { name: 'SilentEngine™', key: 'silent', status: 'operational', desc: 'AI routing & orchestration' },
  { name: 'SightEngine™', key: 'sight', status: 'operational', desc: 'Visual quality standards' },
  { name: 'RobEngine™', key: 'rob', status: 'operational', desc: 'Rob the QuietBuilder - AI code generation' },
  { name: 'ExecutionEngine™', key: 'execution', status: 'pending', desc: 'Workflow orchestration' },
  { name: 'CharterEngine™', key: 'charter', status: 'pending', desc: 'Consent & GDPR' },
  { name: 'IdentityEngine™', key: 'identity', status: 'pending', desc: 'Auth & RBAC' },
  { name: 'ConfigEngine™', key: 'config', status: 'pending', desc: 'Feature flags' },
  { name: 'PaywallEngine™', key: 'paywall', status: 'pending', desc: 'Entitlements' },
  { name: 'NotificationsEngine™', key: 'notifications', status: 'pending', desc: 'Email/SMS queue' },
];

export default function Home() {
  return (
    <main style={{ fontFamily: 'system-ui', padding: '3rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>🎯 QuietBuild OS - Proof Harness</h1>
      <p style={{ fontSize: '1.1rem', color: '#666' }}>
        Engine validation and API testing platform
      </p>

      {/* Rob QuietBuilder Card */}
      <div style={{ marginBottom: '2rem', padding: '2rem', border: '2px solid #3b82f6', borderRadius: '12px', backgroundColor: '#eff6ff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: '0 0 0.5rem 0', color: '#1e40af' }}>👷 Rob the QuietBuilder</h2>
            <p style={{ margin: 0, fontSize: '1rem', color: '#3730a3' }}>
              Your AI coding assistant with constitutional guarantees. Build real apps with receipts and truth.
            </p>
          </div>
          <Link
            href="/build"
            style={{
              padding: '1rem 2rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '1.1rem',
              whiteSpace: 'nowrap',
            }}
          >
            Start Building →
          </Link>
        </div>
      </div>

      <h2>Available Engines</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
        {ENGINES.map((engine) => (
          <Link
            key={engine.key}
            href={`/engines/${engine.key}`}
            style={{
              textDecoration: 'none',
              color: 'inherit',
              display: 'block',
              border: '2px solid transparent',
              borderRadius: '8px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#3b82f6';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'transparent';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div
              style={{
                border: '1px solid #ddd',
                padding: '1rem',
                borderRadius: '8px',
                backgroundColor: engine.status === 'operational' ? '#f0f9ff' : '#f9fafb',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <h3 style={{ margin: '0 0 0.5rem 0' }}>{engine.name}</h3>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#666', flex: 1 }}>{engine.desc}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    fontSize: '0.8rem',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    backgroundColor: engine.status === 'operational' ? '#22c55e' : '#f59e0b',
                    color: 'white',
                  }}
                >
                  {engine.status}
                </span>
                <span style={{ fontSize: '0.9rem', color: '#3b82f6', fontWeight: 'bold' }}>
                  Open Engine →
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <h2>📊 Transparency & Audit</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <Link
          href="/truthlog"
          style={{
            display: 'block',
            padding: '1.5rem',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            textDecoration: 'none',
            color: 'inherit',
            border: '2px solid transparent',
            transition: 'all 0.2s',
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📜</div>
          <h3 style={{ margin: '0.5rem 0', color: '#1e40af' }}>TruthLog</h3>
          <p style={{ fontSize: '0.9rem', color: '#6b7280', margin: 0 }}>
            Immutable audit trail. Every operation receipted - the source of truth.
          </p>
        </Link>

        <Link
          href="/whathappened"
          style={{
            display: 'block',
            padding: '1.5rem',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            textDecoration: 'none',
            color: 'inherit',
            border: '2px solid transparent',
            transition: 'all 0.2s',
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📖</div>
          <h3 style={{ margin: '0.5rem 0', color: '#1e40af' }}>What Happened</h3>
          <p style={{ fontSize: '0.9rem', color: '#6b7280', margin: 0 }}>
            Human-readable timeline. See Rob's "quiet" work behind the scenes.
          </p>
        </Link>
      </div>

      <h2>API Endpoints</h2>
      <ul style={{ lineHeight: '2' }}>
        <li><code>GET /api/health</code> - System health check</li>
        <li><code>POST /api/ai/invoke</code> - AI request routing</li>
        <li><code>POST /api/charter/consent/accept</code> - Accept user consent</li>
        <li><code>POST /api/identity/session/create</code> - Create auth session</li>
        <li><code>POST /api/config/evaluate</code> - Evaluate feature flag</li>
        <li><code>POST /api/paywall/entitlements</code> - Check entitlements</li>
        <li><code>POST /api/notifications/enqueue</code> - Queue notification</li>
        <li><code>POST /api/sight/track</code> - Track visual quality</li>
      </ul>

      <h2>Database</h2>
      <p>
        Status: {process.env.SUPABASE_URL ? (
          <span style={{ color: '#22c55e', fontWeight: 'bold' }}>✅ Connected</span>
        ) : (
          <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>⚠️ In-Memory Mode</span>
        )}
      </p>
    </main>
  );
}
