/**
 * BuildStateIndicator - Visual indicator for build state
 * Maps technical state to user-friendly text with color coding
 */

interface BuildStateIndicatorProps {
  state: string;
  className?: string;
}

const STATE_CONFIG: Record<string, { label: string; color: string; emoji: string }> = {
  IDEA_CAPTURE: { label: 'Capturing idea...', color: 'text-gray-600', emoji: '💡' },
  TEMPLATE_MATCH: { label: 'Finding template...', color: 'text-blue-600', emoji: '🔍' },
  CONFIG_QUESTIONS: { label: 'Configuring...', color: 'text-blue-600', emoji: '⚙️' },
  PAYMENT_REQUIRED: { label: 'Payment required', color: 'text-yellow-600', emoji: '💳' },
  PAYMENT_PROCESSING: { label: 'Processing payment...', color: 'text-yellow-600', emoji: '⏳' },
  CODE_GENERATING: { label: 'Generating code...', color: 'text-purple-600', emoji: '⚡' },
  CODE_DEPLOYING: { label: 'Deploying app...', color: 'text-purple-600', emoji: '🚀' },
  ACCESS_GRANTING: { label: 'Granting access...', color: 'text-green-600', emoji: '🔑' },
  COMPLETE: { label: 'Complete!', color: 'text-green-600', emoji: '✅' },
  FAILED: { label: 'Failed', color: 'text-red-600', emoji: '❌' },
};

export function BuildStateIndicator({ state, className = '' }: BuildStateIndicatorProps) {
  const config = STATE_CONFIG[state] || { label: state, color: 'text-gray-600', emoji: '❓' };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-xl">{config.emoji}</span>
      <span className={`font-medium ${config.color}`}>{config.label}</span>
    </div>
const STATE_LABELS: Record<string, { label: string; color: string }> = {
  IDEA_CAPTURE: { label: 'Idea captured', color: '#2563eb' },
  TEMPLATE_MATCH: { label: 'Template matched', color: '#7c3aed' },
  CONFIG_QUESTIONS: { label: 'Config questions', color: '#0ea5e9' },
  PAYMENT_REQUIRED: { label: 'Payment required', color: '#f59e0b' },
  PAYMENT_PROCESSING: { label: 'Payment processing', color: '#f97316' },
  CODE_GENERATING: { label: 'Code generating', color: '#06b6d4' },
  CODE_DEPLOYING: { label: 'Deploying', color: '#14b8a6' },
  ACCESS_GRANTING: { label: 'Granting access', color: '#10b981' },
  COMPLETE: { label: 'Complete', color: '#22c55e' },
  FAILED: { label: 'Failed', color: '#ef4444' },
};

interface BuildStateIndicatorProps {
  state?: string | null;
}

export default function BuildStateIndicator({ state }: BuildStateIndicatorProps) {
  const resolved = state ? STATE_LABELS[state] : undefined;
  const label = resolved?.label ?? 'Unknown';
  const color = resolved?.color ?? '#6b7280';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding: '0.25rem 0.75rem',
        borderRadius: '999px',
        backgroundColor: color,
        color: 'white',
        fontSize: '0.85rem',
        fontWeight: 600,
      }}
    >
      <span
        style={{
          width: '0.4rem',
          height: '0.4rem',
          borderRadius: '999px',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
        }}
      />
      {label}
    </span>
  );
}
