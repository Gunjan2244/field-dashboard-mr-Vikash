import { useEffect, useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import PageHeader from '../../components/PageHeader';
import ChartCard from '../../components/ChartCard';
import KpiCard from '../../components/KpiCard';
import { useAuth } from '../../context/AuthContext';
import { getEntries, getProjects } from '../../lib/api';
import { DailyEntry, Project } from '../../lib/types';
import { Grain, aggregateByTime, filterByRange, rangeForGrain, currentPeriodRange, previousPeriodRange, sumEntries, percentChange } from '../../lib/aggregate';

export default function Stats() {
  const { user } = useAuth();
  const [grain, setGrain] = useState<Grain>('weekly');
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState('');
  const [metricKey, setMetricKey] = useState('');
  const [myEntries, setMyEntries] = useState<DailyEntry[]>([]);

  useEffect(() => {
    if (!user?.districtId) return;
    getProjects({ districtId: user.districtId })
      .then((list) => {
        setProjects(list);
        setProjectId((current) => current || list[0]?.id || '');
      })
      .catch(() => setProjects([]));
  }, [user?.districtId]);

  useEffect(() => {
    if (!user) return;
    getEntries({ userId: user.id }).then(setMyEntries).catch(() => setMyEntries([]));
  }, [user]);

  const project = useMemo(() => projects.find((p) => p.id === projectId) ?? null, [projects, projectId]);

  useEffect(() => {
    if (project && (!metricKey || !project.metricFields.some((m) => m.key === metricKey))) {
      setMetricKey(project.metricFields[0]?.key ?? '');
    }
  }, [project, metricKey]);

  const projectEntries = useMemo(() => myEntries.filter((e) => e.projectId === projectId), [myEntries, projectId]);

  const { start, end } = rangeForGrain(grain);
  const trendData = useMemo(() => aggregateByTime(filterByRange(projectEntries, start, end), grain), [projectEntries, start, end, grain]);

  const currentRange = currentPeriodRange(grain === 'all-time' ? 'monthly' : grain);
  const prevRange = previousPeriodRange(grain === 'all-time' ? 'monthly' : grain);
  const currentTotals = sumEntries(filterByRange(projectEntries, currentRange.start, currentRange.end));
  const prevTotals = sumEntries(filterByRange(projectEntries, prevRange.start, prevRange.end));
  const allTimeTotals = sumEntries(projectEntries);

  function formatBucketLabel(bucket: string) {
    if (grain === 'all-time') return 'All time';
    if (grain === 'monthly') {
      const [y, m] = bucket.split('-');
      return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
    }
    return new Date(bucket + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  }

  const selectStyle: React.CSSProperties = { height: 34, borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-strong)', padding: '0 var(--space-3)', fontSize: 'var(--text-sm)' };

  if (projects.length === 0) {
    return (
      <>
        <PageHeader title="My Stats" subtitle="Your activity over time" />
        <div style={{ padding: 'var(--space-5)' }}>
          <div className="card" style={{ padding: 'var(--space-5)', fontSize: 'var(--text-sm)', color: 'var(--color-ink-faint)' }}>
            No projects available yet.
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="My Stats" subtitle="Your activity over time" />
      <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
          {(['daily', 'weekly', 'monthly', 'all-time'] as Grain[]).map((g) => (
            <button
              key={g}
              onClick={() => setGrain(g)}
              className={grain === g ? 'btn btn-primary' : 'btn btn-secondary'}
              style={{ textTransform: 'capitalize' }}
            >
              {g === 'all-time' ? 'Up to date' : g}
            </button>
          ))}
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)} style={{ ...selectStyle, marginLeft: 'auto' }}>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select value={metricKey} onChange={(e) => setMetricKey(e.target.value)} style={selectStyle}>
            {(project?.metricFields ?? []).map((m) => (
              <option key={m.key} value={m.key}>{m.label}</option>
            ))}
          </select>
        </div>

        {(project?.metricFields.length ?? 0) === 0 ? (
          <div className="card" style={{ padding: 'var(--space-5)', fontSize: 'var(--text-sm)', color: 'var(--color-ink-faint)' }}>
            This project has no metric fields defined yet.
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
              {project?.metricFields.map((m) => (
                <KpiCard
                  key={m.key}
                  label={m.label}
                  value={grain === 'all-time' ? (allTimeTotals[m.key] ?? 0) : (currentTotals[m.key] ?? 0)}
                  delta={grain === 'all-time' ? undefined : percentChange(currentTotals[m.key] ?? 0, prevTotals[m.key] ?? 0)}
                />
              ))}
            </div>

            <ChartCard title={`${project?.metricFields.find((m) => m.key === metricKey)?.label ?? ''} — trend`} subtitle={grain === 'all-time' ? 'Full history' : `By ${grain.replace('-', ' ')} period`}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 4, right: 12, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="bucket" tickFormatter={formatBucketLabel} tick={{ fontSize: 11, fill: 'var(--color-ink-faint)' }} axisLine={{ stroke: 'var(--color-border-strong)' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--color-ink-faint)' }} axisLine={false} tickLine={false} />
                  <Tooltip labelFormatter={(v) => formatBucketLabel(v as string)} contentStyle={{ fontSize: 12, border: '1px solid var(--color-border-strong)', borderRadius: 4 }} />
                  <Line type="monotone" dataKey={metricKey} stroke="var(--chart-1)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </>
        )}
      </div>
    </>
  );
}
