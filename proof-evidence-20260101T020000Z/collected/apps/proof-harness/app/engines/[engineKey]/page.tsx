'use client';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useEffect, useState } from 'react';

const VALID_ENGINE_KEYS = [
  'execution',
  'identity',
  'charter',
  'config',
  'paywall',
  'notifications',
  'sight',
  'silent',
  'rob',
  'truthserum',
] as const;

type EngineKey = typeof VALID_ENGINE_KEYS[number];

interface EngineMetadata {
  name: string;
  description: string;
  status: 'operational' | 'pending' | 'unknown';
  capabilities: string[];
  apiEndpoints: string[];
}

const ENGINE_METADATA: Record<EngineKey, EngineMetadata> = {
  silent: {
    name: 'SilentEngine™',
    description: 'AI routing & orchestration with cost optimization',
    status: 'operational',
    capabilities: [
      'Multi-provider AI routing',
      'Cost-aware model selection',
      'Latency optimization',
      'Fallback handling',
    ],
    apiEndpoints: ['/api/ai/invoke'],
  },
  sight: {
    name: 'SightEngine™',
    description: 'Visual quality standards and validation',
    status: 'operational',
    capabilities: [
      'Asset quality validation',
      'Tier-based standards',
      'Prompt generation',
      'Anti-AI artifact detection',
    ],
    apiEndpoints: ['/api/sight/track'],
  },
  charter: {
    name: 'CharterEngine™',
    description: 'Consent management & GDPR compliance',
    status: 'pending',
    capabilities: [
      'Granular consent tracking',
      'GDPR compliance',
      'Audit logging',
      'Revocation workflows',
    ],
    apiEndpoints: ['/api/charter/consent/accept'],
  },
  identity: {
    name: 'IdentityEngine™',
    description: 'Authentication & role-based access control',
    status: 'pending',
    capabilities: [
      'Session management',
      'Role hierarchy',
      'Multi-factor auth',
      'Access auditing',
    ],
    apiEndpoints: ['/api/identity/session/create'],
  },
  config: {
    name: 'ConfigEngine™',
    description: 'Feature flags & environment configuration',
    status: 'pending',
    capabilities: [
      'Feature flag evaluation',
      'Environment-aware configs',
      'A/B testing support',
      'Real-time updates',
    ],
    apiEndpoints: ['/api/config/evaluate'],
  },
  paywall: {
    name: 'PaywallEngine™',
    description: 'Entitlements & subscription management',
    status: 'pending',
    capabilities: [
      'Tier-based entitlements',
      'Usage metering',
      'Subscription lifecycle',
      'Quota enforcement',
    ],
    apiEndpoints: ['/api/paywall/entitlements'],
  },
  notifications: {
    name: 'NotificationsEngine™',
    description: 'Email/SMS queue & delivery tracking',
    status: 'pending',
    capabilities: [
      'Multi-channel delivery',
      'Template management',
      'Retry logic',
      'Delivery tracking',
    ],
    apiEndpoints: ['/api/notifications/enqueue'],
  },
  execution: {
    name: 'ExecutionEngine™',
    description: 'Workflow orchestration & task scheduling',
    status: 'unknown',
    capabilities: [
      'Workflow state machine',
      'Async task execution',
      'Retry policies',
      'Event-driven triggers',
    ],
    apiEndpoints: [],
  },
  truthserum: {
    name: 'TruthSerum™',
    description: 'Proof verification & claim sanitization',
    status: 'operational',
    capabilities: [
      'Intent evaluation against receipts',
      'Claim sanitization (no lies)',
      'Missing proof detection',
      'State computation (Verified/Unknown/Blocked)',
    ],
    apiEndpoints: ['/api/truth/evaluate', '/api/receipts'],
  },
  rob: {
    name: 'RobEngine™',
    description: 'Rob the QuietBuilder - AI-powered code generation assistant',
    status: 'operational',
    capabilities: [
      'AI code generation (OpenAI GPT-4)',
      'Conversational app building',
      'CharterEngine consent enforcement',
      'State machine management (13 states)',
      'Session persistence',
      'GitHub repository creation',
      'Receipt emission for all operations',
      'Multi-AI provider support',
    ],
    apiEndpoints: ['/api/rob/init', '/api/rob/message', '/api/github/create-repo'],
  },
};

export default function EnginePage({ params }: { params: { engineKey: string } }) {
  const engineKey = params.engineKey as EngineKey;
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  if (!VALID_ENGINE_KEYS.includes(engineKey as any)) {
    notFound();
  }

  const engine = ENGINE_METADATA[engineKey];

  useEffect(() => {
    fetchEngineReceipts();
  }, [engineKey]);

  async function fetchEngineReceipts() {
    try {
      const response = await fetch('/api/receipts');
      const data = await response.json();
      
      // Filter receipts relevant to this engine
      const engineReceiptTypes = getEngineReceiptTypes(engineKey);
      const filtered = (data.receipts || []).filter((r: any) =>
        engineReceiptTypes.some(type => r.type.startsWith(type))
      );
      
      setReceipts(filtered);
    } catch (error) {
      console.error('Failed to fetch receipts:', error);
    } finally {
      setLoading(false);
    }
  }

  function getEngineReceiptTypes(key: string): string[] {
    const typeMap: Record<string, string[]> = {
      execution: ['session.', 'state.'],
      identity: ['identity.'],
      charter: ['charter.'],
      config: ['config.'],
      paywall: ['billing.'],
      notifications: ['notification.'],
      sight: ['preview.', 'visual.'],
      silent: ['silent.', 'ai.'],
      rob: ['rob.'],
      truthserum: ['claim.', 'truth.'],
    };
    return typeMap[key] || [];
  }

  return (
    <main style={{ fontFamily: 'system-ui', padding: '3rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
        <Link
          href="/engines"
          style={{
            display: 'inline-block',
            color: '#3b82f6',
            textDecoration: 'none',
          }}
        >
          ← Back to Engines
        </Link>
        <Link
          href="/rob"
          style={{
            display: 'inline-block',
            color: '#3b82f6',
            textDecoration: 'none',
          }}
        >
          Rob Builder →
        </Link>
      </div>

      <div
        style={{
          border: '2px solid #3b82f6',
          borderRadius: '12px',
          padding: '2rem',
          backgroundColor: '#f0f9ff',
        }}
      >
        <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2.5rem' }}>{engine.name}</h1>
        <p style={{ fontSize: '1.2rem', color: '#666', margin: '0 0 2rem 0' }}>
          {engine.description}
        </p>

        {/* Status Badge */}
        <div style={{ marginBottom: '2rem' }}>
          <span
            style={{
              fontSize: '0.9rem',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              backgroundColor:
                engine.status === 'operational'
                  ? '#22c55e'
                  : engine.status === 'pending'
                  ? '#f59e0b'
                  : '#6b7280',
              color: 'white',
              fontWeight: 'bold',
              textTransform: 'uppercase',
            }}
          >
            Status: {engine.status}
          </span>
        </div>

        {/* What's Proven */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#22c55e' }}>
            ✅ What's Proven (from receipts)
          </h2>
          {loading ? (
            <p style={{ color: '#666' }}>Loading receipts...</p>
          ) : receipts.length > 0 ? (
            <div>
              <p style={{ color: '#333', marginBottom: '1rem' }}>
                Found {receipts.length} receipt(s) for this engine:
              </p>
              <ul style={{ lineHeight: '1.8', color: '#333' }}>
                {receipts.slice(0, 5).map((receipt, idx) => (
                  <li key={idx}>
                    <code style={{ backgroundColor: '#e5e7eb', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                      {receipt.type}
                    </code>
                    {' - '}
                    {new Date(receipt.createdAt).toLocaleString()}
                  </li>
                ))}
              </ul>
              {receipts.length > 5 && (
                <p style={{ color: '#666', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                  ... and {receipts.length - 5} more
                </p>
              )}
            </div>
          ) : (
            <p style={{ color: '#ef4444' }}>
              No receipts found for this engine. Status: <strong>Unknown</strong>
            </p>
          )}
          
          {engine.status === 'operational' && (
            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: '6px' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Core Capabilities</h3>
              <ul style={{ lineHeight: '1.8', color: '#333' }}>
                {engine.capabilities.map((cap, idx) => (
                  <li key={idx}>{cap}</li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* What's Unknown */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#f59e0b' }}>
            ⚠️ What's Unknown
          </h2>
          {engine.status === 'operational' ? (
            <ul style={{ lineHeight: '1.8', color: '#333' }}>
              <li>Production load testing results</li>
              <li>Cross-engine integration receipts</li>
              <li>Performance benchmarks under scale</li>
            </ul>
          ) : engine.status === 'pending' ? (
            <ul style={{ lineHeight: '1.8', color: '#333' }}>
              <li>API endpoints not yet validated</li>
              <li>Database migrations not confirmed</li>
              <li>Integration test coverage incomplete</li>
            </ul>
          ) : (
            <ul style={{ lineHeight: '1.8', color: '#333' }}>
              <li>Implementation status not confirmed</li>
              <li>API surface not defined</li>
              <li>Integration patterns not established</li>
            </ul>
          )}
        </section>

        {/* API Endpoints */}
        {engine.apiEndpoints.length > 0 && (
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>🔗 API Endpoints</h2>
            <ul style={{ lineHeight: '1.8', fontFamily: 'monospace', color: '#333' }}>
              {engine.apiEndpoints.map((endpoint, idx) => (
                <li key={idx}>
                  <code
                    style={{
                      backgroundColor: '#e5e7eb',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                    }}
                  >
                    {endpoint}
                  </code>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Next Actions */}
        <section
          style={{
            backgroundColor: '#eff6ff',
            border: '1px solid #3b82f6',
            borderRadius: '8px',
            padding: '1.5rem',
          }}
        >
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>🎯 Next Actions</h2>
          {engine.status === 'operational' ? (
            <ul style={{ lineHeight: '1.8', color: '#333' }}>
              <li>Run integration tests via proof-harness</li>
              <li>Generate performance benchmarks</li>
              <li>Document cross-engine dependencies</li>
            </ul>
          ) : engine.status === 'pending' ? (
            <ul style={{ lineHeight: '1.8', color: '#333' }}>
              <li>Complete API endpoint implementation</li>
              <li>Run database migrations</li>
              <li>Write integration tests</li>
              <li>Validate against proof-harness</li>
            </ul>
          ) : (
            <ul style={{ lineHeight: '1.8', color: '#333' }}>
              <li>Confirm implementation status</li>
              <li>Define API surface</li>
              <li>Create proof-harness validation</li>
              <li>Document integration patterns</li>
            </ul>
          )}
        </section>
      </div>

      {/* Related Links */}
      <div style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
        <h3 style={{ marginBottom: '1rem' }}>Related Resources</h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link
            href="/"
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '6px',
              fontSize: '0.9rem',
            }}
          >
            All Engines
          </Link>
          <Link
            href="/api/health"
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#10b981',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '6px',
              fontSize: '0.9rem',
            }}
          >
            Health Check
          </Link>
        </div>
      </div>
    </main>
  );
}
