import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { getEntries, getProjects } from '../../lib/api';
import { isEditable } from '../../lib/dates';
import { DailyEntry, Project } from '../../lib/types';

export default function History() {
  const { user } = useAuth();
  const [range, setRange] = useState(30);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState('all');
  const [rows, setRows] = useState<DailyEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.districtId) return;
    getProjects({ districtId: user.districtId }).then(setProjects).catch(() => setProjects([]));
  }, [user?.districtId]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - range);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    getEntries({ userId: user.id, since: cutoffStr })
      .then((data) => !cancelled && setRows(data))
      .catch(() => !cancelled && setRows([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [user, range]);

  const projectById = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);

  const filteredRows = projectId === 'all' ? rows : rows.filter((r) => r.projectId === projectId);

  // When filtering to a single project we can show its exact dynamic columns.
  // With "all projects" selected, entries may come from different projects
  // with different metric schemas, so we just show a compact summary instead.
  const activeProject = projectId === 'all' ? null : (projectById.get(projectId) ?? null);

  const selectStyle: React.CSSProperties = { height: 32, borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-strong)', padding: '0 var(--space-2)', fontSize: 'var(--text-sm)' };

  return (
    <>
      <PageHeader
        title="My History"
        subtitle="Past submitted entries"
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)} style={selectStyle}>
              <option value="all">All projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <select value={range} onChange={(e) => setRange(Number(e.target.value))} style={selectStyle}>
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
        }
      />
      <div style={{ padding: 'var(--space-5)' }}>
        <div className="card" style={{ overflow: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Project</th>
                {activeProject
                  ? activeProject.metricFields.map((m) => <th key={m.key}>{m.label}</th>)
                  : <th>Metrics</th>}
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r) => (
                <tr key={r.id}>
                  <td>{r.date}</td>
                  <td>{projectById.get(r.projectId)?.name ?? '—'}</td>
                  {activeProject ? (
                    activeProject.metricFields.map((m) => <td key={m.key}>{r.metrics[m.key] ?? 0}</td>)
                  ) : (
                    <td style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-faint)' }}>
                      {Object.entries(r.metrics).map(([k, v]) => `${k}: ${v}`).join(', ') || '—'}
                    </td>
                  )}
                  <td>
                    <span className={`badge ${isEditable(r.date) ? 'badge-positive' : 'badge-neutral'}`}>
                      {isEditable(r.date) ? 'Editable' : 'Locked'}
                    </span>
                  </td>
                </tr>
              ))}
              {!loading && filteredRows.length === 0 && (
                <tr>
                  <td colSpan={(activeProject?.metricFields.length ?? 1) + 3} style={{ textAlign: 'center', color: 'var(--color-ink-faint)', padding: 'var(--space-5)' }}>
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
