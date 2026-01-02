'use client';

import { useState } from 'react';

export default function DemoPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState('Hello from QBos V3 Public Demo');

  const runDemo = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      const data = await response.json();
      
      if (data.ok) {
        setResult(data.claim);
      } else {
        setError(data.error || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '40px 20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <h1 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '16px' }}>
        QBos V3 Public Demo
      </h1>
      
      <p style={{ fontSize: '18px', color: '#666', marginBottom: '32px' }}>
        Live demonstration of 8-engine coordination with verifiable receipts.
        Every action is tracked, timestamped, and validated by TruthSerum.
      </p>

      <div style={{ 
        background: '#f5f5f5', 
        padding: '24px', 
        borderRadius: '8px',
        marginBottom: '24px',
      }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
          Your Message:
        </label>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '16px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            marginBottom: '16px',
          }}
          placeholder="Enter a message to send to the AI..."
        />
        
        <button
          onClick={runDemo}
          disabled={loading}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: '500',
            color: 'white',
            background: loading ? '#999' : '#0070f3',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Running Demo...' : 'Run Demo'}
        </button>
      </div>

      {error && (
        <div style={{
          padding: '16px',
          background: '#fee',
          border: '1px solid #fcc',
          borderRadius: '4px',
          marginBottom: '24px',
          color: '#c00',
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
            ✅ Demo Complete - Claim Generated
          </h2>

          <div style={{
            background: '#efe',
            border: '2px solid #0a0',
            borderRadius: '8px',
            padding: '24px',
            marginBottom: '24px',
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>
              Verifiable Claim
            </h3>
            <p style={{ marginBottom: '8px' }}>
              <strong>Timestamp:</strong> {result.timestamp}
            </p>
            <p style={{ marginBottom: '8px' }}>
              <strong>Claim:</strong> {result.claim}
            </p>
            <p style={{ marginBottom: '16px' }}>
              <strong>Response:</strong> {result.response}
            </p>

            <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
              Proof (TruthSerum Validated)
            </h4>
            <div style={{ 
              background: 'white', 
              padding: '16px', 
              borderRadius: '4px',
              fontSize: '14px',
            }}>
              <p>✅ TruthSerum Valid: {result.proof.truthSerumValid ? 'YES' : 'NO'}</p>
              <p>✅ Ordering Valid: {result.proof.orderingValid ? 'YES' : 'NO'}</p>
              <p>📊 Engines Invoked: {result.proof.enginesInvoked.join(', ')}</p>
              <p>🔒 Gates Checked: {result.proof.gatesChecked.join(', ')}</p>
              <p>📝 Total Receipts: {result.proof.totalReceipts}</p>
              <p>✓ Verified Receipts: {result.proof.verifiedReceipts}</p>
              <p>🔗 Engine Interactions: {result.proof.interactions}</p>
            </div>
          </div>

          <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px' }}>
            Receipt Audit Trail ({result.receipts.length} receipts)
          </h3>
          <div style={{
            maxHeight: '400px',
            overflow: 'auto',
            border: '1px solid #ddd',
            borderRadius: '4px',
            background: '#fafafa',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#e5e5e5', position: 'sticky', top: 0 }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                    Actor
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                    Action
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                    Outcome
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.receipts.map((receipt: any, i: number) => (
                  <tr key={receipt.id} style={{ 
                    borderBottom: '1px solid #eee',
                    background: i % 2 === 0 ? 'white' : '#f9f9f9',
                  }}>
                    <td style={{ padding: '12px', fontSize: '13px' }}>{receipt.actor}</td>
                    <td style={{ padding: '12px', fontSize: '13px' }}>{receipt.action}</td>
                    <td style={{ padding: '12px', fontSize: '13px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: receipt.outcome === 'success' ? '#d4edda' : '#f8d7da',
                        color: receipt.outcome === 'success' ? '#155724' : '#721c24',
                        fontSize: '12px',
                      }}>
                        {receipt.outcome}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '13px', color: '#666' }}>
                      {new Date(receipt.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '24px', padding: '16px', background: '#f0f8ff', borderRadius: '4px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
              🔍 How to Verify
            </h4>
            <p style={{ fontSize: '14px', lineHeight: '1.6' }}>
              1. Each receipt has a unique ID and timestamp<br/>
              2. Receipts form parent/child chains showing causality<br/>
              3. TruthSerum validator enforces ordering: gates BEFORE actions<br/>
              4. All receipts are immutable - no retroactive changes<br/>
              5. Proof can be independently verified by examining receipt chains
            </p>
          </div>
        </div>
      )}

      <div style={{ marginTop: '40px', padding: '24px', background: '#f9f9f9', borderRadius: '8px' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
          What This Demonstrates
        </h3>
        <ul style={{ lineHeight: '1.8', fontSize: '16px' }}>
          <li><strong>8 Engines:</strong> Identity, Charter, Config, Paywall, Silent (AI), Sight, Notifications, Execution (Rob)</li>
          <li><strong>Orchestrated Flow:</strong> Engines coordinate through central EngineOrchestrator</li>
          <li><strong>Receipt System:</strong> Every action produces immutable, timestamped receipt</li>
          <li><strong>TruthSerum Validation:</strong> Ordering enforced, claims verified against receipts</li>
          <li><strong>Rob Integration:</strong> ExecutionEngine (Rob) observes flows in read-only mode</li>
        </ul>
      </div>
    </div>
  );
}
