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
