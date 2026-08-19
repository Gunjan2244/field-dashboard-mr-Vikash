export default function KpiCard({
  label,
  value,
  delta,
}: {
  label: string;
  value: string | number;
  delta?: number; // percent change vs previous period
}) {
  const showDelta = delta !== undefined && Number.isFinite(delta);
  const isPositive = (delta ?? 0) >= 0;

  return (
    <div className="card" style={{ padding: 'var(--space-4)', flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-ink-soft)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
        <span style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--color-ink)' }}>{value}</span>
        {showDelta && (
          <span
            className={`badge ${isPositive ? 'badge-positive' : 'badge-negative'}`}
            style={{ textTransform: 'none' }}
          >
            {isPositive ? '+' : ''}
            {delta!.toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
}
