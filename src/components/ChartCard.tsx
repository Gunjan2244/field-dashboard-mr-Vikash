import { ReactNode } from 'react';

export default function ChartCard({ title, subtitle, children, height = 260 }: { title: string; subtitle?: string; children: ReactNode; height?: number }) {
  return (
    <div className="card" style={{ padding: 'var(--space-4)', flex: 1, minWidth: 0 }}>
      <div style={{ marginBottom: 'var(--space-3)' }}>
        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-ink)' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-faint)', marginTop: 2 }}>{subtitle}</div>}
      </div>
      <div style={{ height }}>{children}</div>
    </div>
  );
}
