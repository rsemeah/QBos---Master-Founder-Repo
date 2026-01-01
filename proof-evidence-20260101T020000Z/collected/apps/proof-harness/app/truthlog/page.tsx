'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Receipt {
  id: string;
  session_id: string;
  type: string;
  details: Record<string, any>;
  caused_by_message_id?: string;
  caused_by_rule?: string;
  caused_by_constraint?: string;
  created_at: string;
}

interface RobSession {
  id: string;
  app_name?: string;
  current_state: string;
  progress_percent: number;
  created_at: string;
}

export default function TruthLogPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [sessions, setSessions] = useState<RobSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>('all');
  const [selectedEngines, setSelectedEngines] = useState<string[]>(['rob']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const ENGINE_PREFIXES = ['rob', 'silent', 'identity', 'charter', 'config', 'paywall', 'execution', 'notifications'];

  useEffect(() => {
    fetchSessions();
    fetchReceipts();
  }, [selectedSession, selectedEngines]);

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/rob/sessions');
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      }
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    }
  };

  const fetchReceipts = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (selectedSession !== 'all') {
        params.append('session_id', selectedSession);
      }
      if (selectedEngines.length > 0) {
        params.append('engines', selectedEngines.join(','));
      }

      const response = await fetch(`/api/truthlog?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch receipts');
      }

      const data = await response.json();
      setReceipts(data.receipts || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleEngine = (engine: string) => {
    setSelectedEngines(prev =>
      prev.includes(engine)
        ? prev.filter(e => e !== engine)
        : [...prev, engine]
    );
  };

  const getReceiptColor = (type: string) => {
    if (type.startsWith('rob.')) return 'bg-purple-100 text-purple-800 border-purple-300';
    if (type.startsWith('silent.')) return 'bg-blue-100 text-blue-800 border-blue-300';
    if (type.startsWith('identity.')) return 'bg-green-100 text-green-800 border-green-300';
    if (type.startsWith('charter.')) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <Link href="/" className="text-blue-600 hover:text-blue-800">
              ← Back to Home
            </Link>
          </div>
          <h1 className="text-4xl font-bold mb-2">📜 TruthLog</h1>
          <p className="text-gray-600">
            Immutable audit trail of all operations across Rob and QBos engines.
            Everything that happens is receipted here - the source of truth.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Filters</h2>

          {/* Session Filter */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session
            </label>
            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Sessions</option>
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.app_name || 'Untitled'} - {session.current_state} ({formatTimestamp(session.created_at)})
                </option>
              ))}
            </select>
          </div>

          {/* Engine Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Engines
            </label>
            <div className="flex flex-wrap gap-2">
              {ENGINE_PREFIXES.map((engine) => (
                <button
                  key={engine}
                  onClick={() => toggleEngine(engine)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    selectedEngines.includes(engine)
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                  }`}
                >
                  {engine}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl font-bold text-blue-600">{receipts.length}</div>
            <div className="text-sm text-gray-600">Total Receipts</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl font-bold text-purple-600">
              {receipts.filter(r => r.type.startsWith('rob.')).length}
            </div>
            <div className="text-sm text-gray-600">Rob Operations</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl font-bold text-green-600">
              {new Set(receipts.map(r => r.session_id)).size}
            </div>
            <div className="text-sm text-gray-600">Active Sessions</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl font-bold text-orange-600">
              {receipts.filter(r => r.type.includes('error')).length}
            </div>
            <div className="text-sm text-gray-600">Errors</div>
          </div>
        </div>

        {/* Receipts Timeline */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Receipt Timeline</h2>

          {loading && (
            <div className="text-center py-8 text-gray-500">
              Loading receipts...
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              Error: {error}
            </div>
          )}

          {!loading && !error && receipts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No receipts found. Start using Rob to see operations appear here.
            </div>
          )}

          {!loading && !error && receipts.length > 0 && (
            <div className="space-y-4">
              {receipts.map((receipt, index) => (
                <div
                  key={receipt.id}
                  className="border-l-4 border-blue-500 pl-4 py-2 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`inline-block px-3 py-1 text-xs font-semibold rounded-full border ${getReceiptColor(receipt.type)}`}
                        >
                          {receipt.type}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(receipt.created_at)}
                        </span>
                      </div>

                      {/* Receipt Details */}
                      <div className="text-sm text-gray-700 mb-2">
                        {Object.keys(receipt.details).length > 0 && (
                          <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                            {JSON.stringify(receipt.details, null, 2)}
                          </pre>
                        )}
                      </div>

                      {/* Causality Chain */}
                      <div className="text-xs text-gray-500 space-y-1">
                        {receipt.caused_by_message_id && (
                          <div>Caused by message: {receipt.caused_by_message_id.slice(0, 8)}...</div>
                        )}
                        {receipt.caused_by_rule && (
                          <div>Rule: {receipt.caused_by_rule}</div>
                        )}
                        {receipt.caused_by_constraint && (
                          <div>Constraint: {receipt.caused_by_constraint}</div>
                        )}
                      </div>
                    </div>

                    {/* Receipt ID */}
                    <div className="text-xs text-gray-400 font-mono ml-4">
                      {receipt.id.slice(0, 8)}...
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            💡 What is TruthLog?
          </h3>
          <p className="text-blue-800 mb-4">
            TruthLog is the immutable audit trail of everything that happens in QBos.
            Every operation - from Rob building an app to engines coordinating - creates a receipt.
          </p>
          <ul className="list-disc list-inside space-y-1 text-blue-800">
            <li><strong>Receipts:</strong> Immutable records (append-only, never deleted)</li>
            <li><strong>Causality:</strong> Each receipt shows what caused it (message, rule, constraint)</li>
            <li><strong>Transparency:</strong> Users see simple messages, TruthLog shows technical details</li>
            <li><strong>Compliance:</strong> GDPR-ready audit trail for all data operations</li>
            <li><strong>Debugging:</strong> Trace any issue back to its root cause</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
