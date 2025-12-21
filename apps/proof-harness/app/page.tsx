export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>QBos Proof Harness</h1>
      <p>Minimal API verification endpoints for QuietBuild OS</p>

      <h2>Available Endpoints:</h2>
      <ul>
        <li>
          <strong>GET /api/health</strong> - Health check and system info
        </li>
        <li>
          <strong>POST /api/sight/track</strong> - Track SightEngine events
        </li>
        <li>
          <strong>POST /api/charter/consent/accept</strong> - Accept consent (stubbed)
        </li>
        <li>
          <strong>POST /api/ai/invoke</strong> - Invoke AI with safety checks
        </li>
      </ul>

      <h2>Documentation:</h2>
      <p>See <code>docs/proof/PROOF_GATES.md</code> for curl examples and validation steps.</p>
    </main>
  )
}
