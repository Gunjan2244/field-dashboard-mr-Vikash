import { useEffect, useMemo, useState } from 'react';
import { LineChart, Line, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import PageHeader from '../../components/PageHeader';
import FilterBar from '../../components/FilterBar';
import KpiCard from '../../components/KpiCard';
import ChartCard from '../../components/ChartCard';
import { getDistricts, getEmployees, getEntries } from '../../lib/api';
import { District, User, METRIC_FIELDS, DailyEntry } from '../../lib/types';
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
  const [allEntries, setAllEntries] = useState<DailyEntry[]>([]);
  const [districtId, setDistrictId] = useState('all');
  const [employeeId, setEmployeeId] = useState('all');
  const [grain, setGrain] = useState<Grain>('weekly');
  const [metric, setMetric] = useState<keyof DailyEntry>('schoolsObserved');

  useEffect(() => {
    getDistricts().then(setDistricts).catch(() => setDistricts([]));
    getEmployees().then(setEmployees).catch(() => setEmployees([]));
    getEntries().then(setAllEntries).catch(() => setAllEntries([]));
  }, []);

  const scopedEmployees = districtId === 'all' ? employees : employees.filter((e) => e.districtId === districtId);

  const baseEntries = useMemo(() => {
    return allEntries.filter((e) => {
      if (districtId !== 'all' && e.districtId !== districtId) return false;
      if (employeeId !== 'all' && e.userId !== employeeId) return false;
      return true;
    });
  }, [allEntries, districtId, employeeId]);

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
    if (employeeId !== 'all') return [];
    const list = districtId === 'all' ? districts.map((d) => ({ id: d.id, name: d.name })) : scopedEmployees.map((e) => ({ id: e.id, name: e.name.split(' ')[0] }));
    return list.map((item) => {
      const scoped =
        districtId === 'all'
          ? trendEntries.filter((e) => e.districtId === item.id)
          : trendEntries.filter((e) => e.userId === item.id);
      const totals = sumEntries(scoped);
      return { name: item.name, value: totals[metric as string] };
    });
  }, [districtId, employeeId, districts, scopedEmployees, trendEntries, metric]);

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Activity across all districts"
        actions={
          <select
            value={metric as string}
            onChange={(e) => setMetric(e.target.value as keyof DailyEntry)}
            style={{ height: 34, borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-strong)', padding: '0 var(--space-3)', fontSize: 'var(--text-sm)' }}
          >
            {METRIC_FIELDS.map((m) => (
              <option key={m.key as string} value={m.key as string}>{m.label}</option>
            ))}
          </select>
        }
      />

      <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        <FilterBar
          districts={districts}
          employees={employees}
          districtId={districtId}
          employeeId={employeeId}
          grain={grain}
          onDistrictChange={(v) => { setDistrictId(v); setEmployeeId('all'); }}
          onEmployeeChange={setEmployeeId}
          onGrainChange={setGrain}
        />

        <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
          {METRIC_FIELDS.slice(0, 4).map((m) => (
            <KpiCard
              key={m.key as string}
              label={m.label}
              value={grain === 'all-time' ? allTimeTotals[m.key as string] : currentTotals[m.key as string]}
              delta={grain === 'all-time' ? undefined : percentChange(currentTotals[m.key as string], prevTotals[m.key as string])}
            />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
          {METRIC_FIELDS.slice(4).map((m) => (
            <KpiCard
              key={m.key as string}
              label={m.label}
              value={grain === 'all-time' ? allTimeTotals[m.key as string] : currentTotals[m.key as string]}
              delta={grain === 'all-time' ? undefined : percentChange(currentTotals[m.key as string], prevTotals[m.key as string])}
            />
          ))}
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'stretch' }}>
          <ChartCard
            title={`${METRIC_FIELDS.find((m) => m.key === metric)?.label} — trend`}
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
                <Line type="monotone" dataKey={metric as string} stroke="var(--chart-1)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {comparisonData.length > 0 && (
            <ChartCard title={`${METRIC_FIELDS.find((m) => m.key === metric)?.label} — ${comparisonLabel}`} subtitle="Selected period totals">
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
      </div>
    </>
  );
}
