import { useEffect, useMemo, useState } from 'react';
import { LineChart, Line, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import PageHeader from '../../components/PageHeader';
import FilterBar from '../../components/FilterBar';
import KpiCard from '../../components/KpiCard';
import ChartCard from '../../components/ChartCard';
import { getDistricts, getEmployees, getEntries, getProjects } from '../../lib/api';
import { District, User, DailyEntry, Project } from '../../lib/types';
import {
  Grain,
  aggregateByTime,
  filterByRange,
  rangeForGrain,
  currentPeriodRange,
  previousPeriodRange,
  sumEntries,
  percentChange,
} from '../../lib/aggregate';

const chartColors = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];

function formatBucketLabel(bucket: string, grain: Grain) {
  if (grain === 'all-time') return 'All time';
  if (grain === 'monthly') {
    const [y, m] = bucket.split('-');
    return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
  }
  return new Date(bucket + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

export default function AdminDashboard() {
  const [districts, setDistricts] = useState<District[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [allEntries, setAllEntries] = useState<DailyEntry[]>([]);
  const [districtId, setDistrictId] = useState('all');
  const [employeeId, setEmployeeId] = useState('all');
  const [projectId, setProjectId] = useState('all');
  const [grain, setGrain] = useState<Grain>('weekly');
  const [metricKey, setMetricKey] = useState('');

  useEffect(() => {
    getDistricts().then(setDistricts).catch(() => setDistricts([]));
    getEmployees().then(setEmployees).catch(() => setEmployees([]));
    getProjects().then(setAllProjects).catch(() => setAllProjects([]));
    getEntries().then(setAllEntries).catch(() => setAllEntries([]));
  }, []);

  const scopedEmployees = districtId === 'all' ? employees : employees.filter((e) => e.districtId === districtId);
  const scopedProjects = districtId === 'all' ? allProjects : allProjects.filter((p) => p.districtId === districtId);

  // Reset the project pick whenever the scope changes so it's never stale.
  useEffect(() => {
    if (projectId !== 'all' && !scopedProjects.some((p) => p.id === projectId)) {
      setProjectId('all');
    }
  }, [scopedProjects, projectId]);

  const activeProject = projectId === 'all' ? null : (scopedProjects.find((p) => p.id === projectId) ?? null);

  useEffect(() => {
    if (activeProject && (!metricKey || !activeProject.metricFields.some((m) => m.key === metricKey))) {
      setMetricKey(activeProject.metricFields[0]?.key ?? '');
    }
  }, [activeProject, metricKey]);

  const baseEntries = useMemo(() => {
    return allEntries.filter((e) => {
      if (districtId !== 'all' && e.districtId !== districtId) return false;
      if (projectId !== 'all' && e.projectId !== projectId) return false;
      if (employeeId !== 'all' && e.userId !== employeeId) return false;
      return true;
    });
  }, [allEntries, districtId, projectId, employeeId]);

  const { start, end } = rangeForGrain(grain);
  const trendEntries = filterByRange(baseEntries, start, end);
  const trendData = useMemo(() => aggregateByTime(trendEntries, grain), [trendEntries, grain]);

  const currentRange = currentPeriodRange(grain === 'all-time' ? 'monthly' : grain);
  const prevRange = previousPeriodRange(grain === 'all-time' ? 'monthly' : grain);
  const currentTotals = sumEntries(filterByRange(baseEntries, currentRange.start, currentRange.end));
  const prevTotals = sumEntries(filterByRange(baseEntries, prevRange.start, prevRange.end));
  const allTimeTotals = sumEntries(baseEntries);

  const comparisonLabel = districtId === 'all' && employeeId === 'all' ? 'By district' : 'By employee';

  const comparisonData = useMemo(() => {
    if (employeeId !== 'all' || !metricKey) return [];
    const list = districtId === 'all' ? districts.map((d) => ({ id: d.id, name: d.name })) : scopedEmployees.map((e) => ({ id: e.id, name: e.name.split(' ')[0] }));
    return list.map((item) => {
      const scoped =
        districtId === 'all'
          ? trendEntries.filter((e) => e.districtId === item.id)
          : trendEntries.filter((e) => e.userId === item.id);
      const totals = sumEntries(scoped);
      return { name: item.name, value: totals[metricKey] ?? 0 };
    });
  }, [districtId, employeeId, districts, scopedEmployees, trendEntries, metricKey]);

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Activity across all districts and projects"
        actions={
          activeProject && activeProject.metricFields.length > 0 ? (
            <select
              value={metricKey}
              onChange={(e) => setMetricKey(e.target.value)}
              style={{ height: 34, borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-strong)', padding: '0 var(--space-3)', fontSize: 'var(--text-sm)' }}
            >
              {activeProject.metricFields.map((m) => (
                <option key={m.key} value={m.key}>{m.label}</option>
              ))}
            </select>
          ) : undefined
        }
      />

      <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        <FilterBar
          districts={districts}
          employees={scopedEmployees}
          projects={scopedProjects}
          districtId={districtId}
          employeeId={employeeId}
          projectId={projectId}
          grain={grain}
          onDistrictChange={(v) => { setDistrictId(v); setEmployeeId('all'); setProjectId('all'); }}
          onEmployeeChange={setEmployeeId}
          onProjectChange={setProjectId}
          onGrainChange={setGrain}
        />

        {!activeProject ? (
          <div className="card" style={{ padding: 'var(--space-5)', fontSize: 'var(--text-sm)', color: 'var(--color-ink-faint)' }}>
            Pick a project above to see its metrics — each project defines its own fields, so totals across
            different projects aren't comparable. There are {baseEntries.length} entries in the current scope.
          </div>
        ) : activeProject.metricFields.length === 0 ? (
          <div className="card" style={{ padding: 'var(--space-5)', fontSize: 'var(--text-sm)', color: 'var(--color-ink-faint)' }}>
            This project has no metric fields defined yet.
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
              {activeProject.metricFields.map((m) => (
                <KpiCard
                  key={m.key}
                  label={m.label}
                  value={grain === 'all-time' ? (allTimeTotals[m.key] ?? 0) : (currentTotals[m.key] ?? 0)}
                  delta={grain === 'all-time' ? undefined : percentChange(currentTotals[m.key] ?? 0, prevTotals[m.key] ?? 0)}
                />
              ))}
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'stretch' }}>
              <ChartCard
                title={`${activeProject.metricFields.find((m) => m.key === metricKey)?.label ?? ''} — trend`}
                subtitle={grain === 'all-time' ? 'Full history' : `By ${grain.replace('-', ' ')} period`}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 4, right: 12, left: -20, bottom: 0 }}>
                    <CartesianGrid stroke="var(--color-border)" vertical={false} />
                    <XAxis
                      dataKey="bucket"
                      tickFormatter={(v) => formatBucketLabel(v, grain)}
                      tick={{ fontSize: 11, fill: 'var(--color-ink-faint)' }}
                      axisLine={{ stroke: 'var(--color-border-strong)' }}
                      tickLine={false}
                    />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--color-ink-faint)' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      labelFormatter={(v) => formatBucketLabel(v as string, grain)}
                      contentStyle={{ fontSize: 12, border: '1px solid var(--color-border-strong)', borderRadius: 4 }}
                    />
                    <Line type="monotone" dataKey={metricKey} stroke="var(--chart-1)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              {comparisonData.length > 0 && (
                <ChartCard title={`${activeProject.metricFields.find((m) => m.key === metricKey)?.label ?? ''} — ${comparisonLabel}`} subtitle="Selected period totals">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData} margin={{ top: 4, right: 12, left: -20, bottom: 0 }}>
                      <CartesianGrid stroke="var(--color-border)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--color-ink-faint)' }} axisLine={{ stroke: 'var(--color-border-strong)' }} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: 'var(--color-ink-faint)' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ fontSize: 12, border: '1px solid var(--color-border-strong)', borderRadius: 4 }} />
                      <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                        {comparisonData.map((_, i) => (
                          <Cell key={i} fill={chartColors[i % chartColors.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
