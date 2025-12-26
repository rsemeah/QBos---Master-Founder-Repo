/**
 * ReadinessTierBadge - Badge showing readiness tier with tooltip
 * DRAFT → SHAPED → VIABLE → READY → ACCESSIBLE
 */

interface ReadinessTierBadgeProps {
  tier: string;
  className?: string;
}

const TIER_CONFIG: Record<string, { label: string; color: string; description: string }> = {
  DRAFT: {
    label: 'Draft',
    color: 'bg-gray-100 text-gray-800 border-gray-300',
    description: 'Initial state - idea captured',
  },
  SHAPED: {
    label: 'Shaped',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    description: 'Template matched and configured',
  },
  VIABLE: {
    label: 'Viable',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    description: 'Payment verified, ready to build',
  },
  READY: {
    label: 'Ready',
    color: 'bg-purple-100 text-purple-800 border-purple-300',
    description: 'Code generated and deployed',
  },
  ACCESSIBLE: {
    label: 'Accessible',
    color: 'bg-green-100 text-green-800 border-green-300',
    description: 'Access granted to repo and deployment',
  },
};

export function ReadinessTierBadge({ tier, className = '' }: ReadinessTierBadgeProps) {
  const config = TIER_CONFIG[tier] || TIER_CONFIG.DRAFT;

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${config.color} ${className}`}
      title={config.description}
    >
      {config.label}
const TIER_LABELS: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Draft', color: '#94a3b8' },
  SHAPED: { label: 'Shaped', color: '#f97316' },
  VIABLE: { label: 'Viable', color: '#8b5cf6' },
  READY: { label: 'Ready', color: '#0ea5e9' },
  ACCESSIBLE: { label: 'Accessible', color: '#22c55e' },
};

interface ReadinessTierBadgeProps {
  tier?: string | null;
}

export default function ReadinessTierBadge({ tier }: ReadinessTierBadgeProps) {
  const resolved = tier ? TIER_LABELS[tier] : undefined;
  const label = resolved?.label ?? 'Unknown';
  const color = resolved?.color ?? '#6b7280';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.25rem 0.75rem',
        borderRadius: '999px',
        backgroundColor: color,
        color: 'white',
        fontSize: '0.85rem',
        fontWeight: 600,
      }}
    >
      {label}
    </span>
  );
}
