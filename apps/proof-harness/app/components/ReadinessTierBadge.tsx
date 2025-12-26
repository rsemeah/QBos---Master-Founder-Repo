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
