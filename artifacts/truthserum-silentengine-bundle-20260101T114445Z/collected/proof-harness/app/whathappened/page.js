"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = WhatHappenedPage;
const react_1 = require("react");
const link_1 = __importDefault(require("next/link"));
function WhatHappenedPage() {
    const [events, setEvents] = (0, react_1.useState)([]);
    const [sessions, setSessions] = (0, react_1.useState)([]);
    const [selectedSession, setSelectedSession] = (0, react_1.useState)('all');
    const [loading, setLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        fetchSessions();
        fetchTimeline();
    }, [selectedSession]);
    const fetchSessions = async () => {
        try {
            const response = await fetch('/api/rob/sessions');
            if (response.ok) {
                const data = await response.json();
                setSessions(data.sessions || []);
            }
        }
        catch (err) {
            console.error('Failed to fetch sessions:', err);
        }
    };
    const fetchTimeline = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (selectedSession !== 'all') {
                params.append('session_id', selectedSession);
            }
            const response = await fetch(`/api/whathappened?${params}`);
            if (response.ok) {
                const data = await response.json();
                setEvents(data.events || []);
            }
        }
        catch (err) {
            console.error('Failed to fetch timeline:', err);
        }
        finally {
            setLoading(false);
        }
    };
    const getEventIcon = (type) => {
        switch (type) {
            case 'session': return '🚀';
            case 'message': return '💬';
            case 'state': return '🔄';
            case 'code': return '💻';
            case 'engine': return '⚙️';
            case 'error': return '❌';
            default: return '📝';
        }
    };
    const getEventColor = (type) => {
        switch (type) {
            case 'session': return 'bg-green-100 border-green-300 text-green-800';
            case 'message': return 'bg-blue-100 border-blue-300 text-blue-800';
            case 'state': return 'bg-purple-100 border-purple-300 text-purple-800';
            case 'code': return 'bg-indigo-100 border-indigo-300 text-indigo-800';
            case 'engine': return 'bg-orange-100 border-orange-300 text-orange-800';
            case 'error': return 'bg-red-100 border-red-300 text-red-800';
            default: return 'bg-gray-100 border-gray-300 text-gray-800';
        }
    };
    const formatTimestamp = (timestamp) => {
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
    const formatDuration = (start, end) => {
        const ms = new Date(end).getTime() - new Date(start).getTime();
        if (ms < 1000)
            return `${ms}ms`;
        if (ms < 60000)
            return `${(ms / 1000).toFixed(1)}s`;
        return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
    };
    return (<div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <link_1.default href="/" className="text-blue-600 hover:text-blue-800">
              ← Back to Home
            </link_1.default>
          </div>
          <h1 className="text-4xl font-bold mb-2">📖 What Happened</h1>
          <p className="text-gray-600">
            Human-readable timeline of everything Rob and QBos engines did.
            This shows the story behind your app's creation - no technical jargon.
          </p>
        </div>

        {/* Session Filter */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            View Session
          </label>
          <select value={selectedSession} onChange={(e) => setSelectedSession(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="all">All Sessions (Combined)</option>
            {sessions.map((session) => (<option key={session.id} value={session.id}>
                {session.app_name || 'Untitled'} - {session.current_state}
              </option>))}
          </select>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300"></div>

          {loading && (<div className="text-center py-8 text-gray-500">
              Loading timeline...
            </div>)}

          {!loading && events.length === 0 && (<div className="text-center py-8 text-gray-500">
              No events yet. Start using Rob to see what happens!
            </div>)}

          {!loading && events.length > 0 && (<div className="space-y-6">
              {events.map((event, index) => (<div key={event.id} className="relative pl-20">
                  {/* Timeline dot */}
                  <div className={`absolute left-6 w-5 h-5 rounded-full border-4 border-white ${getEventColor(event.type)} flex items-center justify-center text-xs`}>
                    {getEventIcon(event.type)}
                  </div>

                  {/* Event card */}
                  <div className={`bg-white rounded-lg shadow-md p-4 border-l-4 ${getEventColor(event.type)}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {event.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {event.description}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-xs text-gray-500 font-mono">
                          {formatTimestamp(event.timestamp)}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {event.engine}
                        </div>
                      </div>
                    </div>

                    {/* Metadata */}
                    {event.metadata && Object.keys(event.metadata).length > 0 && (<div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {Object.entries(event.metadata).map(([key, value]) => (<div key={key}>
                              <span className="text-gray-500">{key}:</span>{' '}
                              <span className="font-medium text-gray-700">
                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                              </span>
                            </div>))}
                        </div>
                      </div>)}
                  </div>
                </div>))}
            </div>)}
        </div>

        {/* Summary Stats */}
        {events.length > 0 && (<div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Session Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {events.filter(e => e.type === 'message').length}
                </div>
                <div className="text-sm text-gray-600">Messages</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {events.filter(e => e.type === 'state').length}
                </div>
                <div className="text-sm text-gray-600">State Changes</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-indigo-600">
                  {events.filter(e => e.type === 'code').length}
                </div>
                <div className="text-sm text-gray-600">Code Generated</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {events.filter(e => e.type === 'engine').length}
                </div>
                <div className="text-sm text-gray-600">Engine Calls</div>
              </div>
            </div>
          </div>)}

        {/* Help Text */}
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-900 mb-2">
            💡 What is "What Happened"?
          </h3>
          <p className="text-green-800 mb-4">
            This page tells the human-readable story of your app's creation.
            While TruthLog shows raw technical receipts, this page explains what actually happened.
          </p>
          <ul className="list-disc list-inside space-y-1 text-green-800">
            <li><strong>Simple Language:</strong> No technical jargon - explains in plain English</li>
            <li><strong>Timeline:</strong> Chronological view of all operations</li>
            <li><strong>Context:</strong> See why things happened, not just what happened</li>
            <li><strong>Behind the Scenes:</strong> Rob's "quiet" work is visible here</li>
          </ul>
        </div>
      </div>
    </div>);
}
//# sourceMappingURL=page.js.map