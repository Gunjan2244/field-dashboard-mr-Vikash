import { useMemo, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { dailyEntries, isEditable } from '../../lib/mockData';
import { METRIC_FIELDS } from '../../lib/types';

export default function History() {
  const { user } = useAuth();
  const [range, setRange] = useState(30);

  const rows = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - range);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    return dailyEntries
      .filter((e) => e.userId === user!.id && e.date >= cutoffStr)
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [user, range]);

  return (
    <>
      <PageHeader
        title="My History"
        subtitle="Past submitted entries"
        actions={
          <select value={range} onChange={(e) => setRange(Number(e.target.value))} style={{ height: 32, borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-strong)', padding: '0 var(--space-2)', fontSize: 'var(--text-sm)' }}>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        }
      />
      <div style={{ padding: 'var(--space-5)' }}>
        <div className="card" style={{ overflow: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                {METRIC_FIELDS.map((m) => (
                  <th key={m.key as string}>{m.label}</th>
                ))}
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.date}</td>
                  {METRIC_FIELDS.map((m) => (
                    <td key={m.key as string}>{r[m.key] as number}</td>
                  ))}
                  <td>
                    <span className={`badge ${isEditable(r.date) ? 'badge-positive' : 'badge-neutral'}`}>
                      {isEditable(r.date) ? 'Editable' : 'Locked'}
                    </span>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={METRIC_FIELDS.length + 2} style={{ textAlign: 'center', color: 'var(--color-ink-faint)', padding: 'var(--space-5)' }}>
                    No entries in this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
