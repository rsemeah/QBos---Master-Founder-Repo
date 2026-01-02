/**
 * SessionCard - Reusable session display card
 * Used in dashboard to show build sessions
 */

import Link from 'next/link';
import { BuildStateIndicator } from './BuildStateIndicator';
import { ReadinessTierBadge } from './ReadinessTierBadge';

interface SessionCardProps {
  session: {
    id: string;
    idea_description: string;
    current_state: string;
    readiness_tier: string;
    created_at: string;
    template_id?: string;
    config?: Record<string, any>;
  };
}

export function SessionCard({ session }: SessionCardProps) {
  const appName = session.config?.app_name || 'Untitled App';
  const createdDate = new Date(session.created_at).toLocaleDateString();

  return (
    <Link
      href={`/build/${session.id}`}
      className="block p-6 bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">{appName}</h3>
        <ReadinessTierBadge tier={session.readiness_tier} />
      </div>

      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{session.idea_description}</p>

      <div className="flex items-center justify-between">
        <BuildStateIndicator state={session.current_state} />
        <span className="text-xs text-gray-500">{createdDate}</span>
      </div>
    </Link>
  );
}
