export default function Home() {
  return (
    <main style={{ fontFamily: 'system-ui', padding: '3rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>🎯 QuietBuild OS - Proof Harness</h1>
      <p style={{ fontSize: '1.1rem', color: '#666' }}>
        Engine validation and API testing platform
      </p>

      <h2>Available Engines</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
        {[
          { name: 'SilentEngine™', status: 'operational', desc: 'AI routing & orchestration' },
          { name: 'SightEngine™', status: 'operational', desc: 'Visual quality standards' },
          { name: 'SafetyEngine™', status: 'pending', desc: 'Content moderation' },
          { name: 'CharterEngine™', status: 'pending', desc: 'Consent & GDPR' },
          { name: 'IdentityEngine™', status: 'pending', desc: 'Auth & RBAC' },
          { name: 'ConfigEngine™', status: 'pending', desc: 'Feature flags' },
          { name: 'PaywallEngine™', status: 'pending', desc: 'Entitlements' },
          { name: 'NotificationsEngine™', status: 'pending', desc: 'Email/SMS queue' },
        ].map((engine) => (
          <div
            key={engine.name}
            style={{
              border: '1px solid #ddd',
              padding: '1rem',
              borderRadius: '8px',
              backgroundColor: engine.status === 'operational' ? '#f0f9ff' : '#f9fafb',
            }}
          >
            <h3 style={{ margin: '0 0 0.5rem 0' }}>{engine.name}</h3>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#666' }}>{engine.desc}</p>
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
          </div>
        ))}
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
