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
    </span>
  );
}
