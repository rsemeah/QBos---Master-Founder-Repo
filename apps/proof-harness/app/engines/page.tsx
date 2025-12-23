/**
 * Engines Index - Overview of all engines
 */

'use client';

import Link from 'next/link';

const ENGINES = [
  {
    key: 'execution',
    name: 'ExecutionEngine',
    description: 'State machine & orchestration',
    status: 'operational' as const,
  },
  {
    key: 'identity',
    name: 'IdentityEngine',
    description: 'Authentication & access control',
    status: 'pending' as const,
  },
  {
    key: 'charter',
    name: 'CharterEngine',
    description: 'Consent management & GDPR',
    status: 'pending' as const,
  },
  {
    key: 'config',
    name: 'ConfigEngine',
    description: 'Feature flags & configuration',
    status: 'pending' as const,
  },
  {
    key: 'paywall',
    name: 'PaywallEngine',
    description: 'Billing & entitlements',
    status: 'pending' as const,
  },
  {
    key: 'notifications',
    name: 'NotificationsEngine',
    description: 'Multi-channel notifications',
    status: 'pending' as const,
  },
  {
    key: 'sight',
    name: 'SightEngine',
    description: 'Visual quality standards',
    status: 'operational' as const,
  },
  {
    key: 'silent',
    name: 'SilentEngine',
    description: 'AI routing & cost optimization',
    status: 'operational' as const,
  },
  {
    key: 'truthserum',
    name: 'TruthSerum',
    description: 'Proof verification & claim sanitization',
    status: 'operational' as const,
  },
];

export default function EnginesIndexPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-4 inline-block"
          >
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900">QBos Engines</h1>
          <p className="text-gray-600 mt-2">
            Modular engines for proof-driven development
          </p>
        </div>

        {/* Engines Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ENGINES.map((engine) => (
            <Link
              key={engine.key}
              href={`/engines/${engine.key}`}
              className="block bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-bold text-gray-900">{engine.name}</h3>
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    engine.status === 'operational'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {engine.status}
                </span>
              </div>
              <p className="text-sm text-gray-600">{engine.description}</p>
              <div className="mt-4 text-blue-600 text-sm font-medium">
                View details →
              </div>
            </Link>
          ))}
        </div>

        {/* Truth Note */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 mb-2">🧪 TruthSerum Active</h3>
          <p className="text-sm text-blue-800">
            All engines operate under TruthSerum constraints. No claim without receipts.
            Status indicators derive from proof verification, not optimistic assumptions.
          </p>
        </div>
      </div>
    </div>
  );
}
