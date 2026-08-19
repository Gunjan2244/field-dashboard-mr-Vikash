import { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import PageHeader from '../../components/PageHeader';
import ChartCard from '../../components/ChartCard';
import KpiCard from '../../components/KpiCard';
import { useAuth } from '../../context/AuthContext';
import { dailyEntries } from '../../lib/mockData';
import { METRIC_FIELDS, DailyEntry } from '../../lib/types';
import { Grain, aggregateByTime, filterByRange, rangeForGrain, currentPeriodRange, previousPeriodRange, sumEntries, percentChange } from '../../lib/aggregate';

export default function Stats() {
  const { user } = useAuth();
  const [grain, setGrain] = useState<Grain>('weekly');
  const [metric, setMetric] = useState<keyof DailyEntry>('schoolsObserved');

  const myEntries = useMemo(() => dailyEntries.filter((e) => e.userId === user!.id), [user]);

  const { start, end } = rangeForGrain(grain);
  const trendData = useMemo(() => aggregateByTime(filterByRange(myEntries, start, end), grain), [myEntries, start, end, grain]);

  const currentRange = currentPeriodRange(grain === 'all-time' ? 'monthly' : grain);
  const prevRange = previousPeriodRange(grain === 'all-time' ? 'monthly' : grain);
  const currentTotals = sumEntries(filterByRange(myEntries, currentRange.start, currentRange.end));
  const prevTotals = sumEntries(filterByRange(myEntries, prevRange.start, prevRange.end));
  const allTimeTotals = sumEntries(myEntries);

  function formatBucketLabel(bucket: string) {
    if (grain === 'all-time') return 'All time';
    if (grain === 'monthly') {
      const [y, m] = bucket.split('-');
      return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
    }
    return new Date(bucket + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  }

  return (
    <>
      <PageHeader title="My Stats" subtitle="Your activity over time" />
      <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
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
          <select
            value={metric as string}
            onChange={(e) => setMetric(e.target.value as keyof DailyEntry)}
            style={{ height: 34, borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-strong)', padding: '0 var(--space-3)', fontSize: 'var(--text-sm)', marginLeft: 'auto' }}
          >
            {METRIC_FIELDS.map((m) => (
              <option key={m.key as string} value={m.key as string}>{m.label}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
          {METRIC_FIELDS.map((m) => (
            <KpiCard
              key={m.key as string}
              label={m.label}
              value={grain === 'all-time' ? allTimeTotals[m.key as string] : currentTotals[m.key as string]}
              delta={grain === 'all-time' ? undefined : percentChange(currentTotals[m.key as string], prevTotals[m.key as string])}
            />
          ))}
        </div>

        <ChartCard title={`${METRIC_FIELDS.find((m) => m.key === metric)?.label} — trend`} subtitle={grain === 'all-time' ? 'Full history' : `By ${grain.replace('-', ' ')} period`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 4, right: 12, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="bucket" tickFormatter={formatBucketLabel} tick={{ fontSize: 11, fill: 'var(--color-ink-faint)' }} axisLine={{ stroke: 'var(--color-border-strong)' }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--color-ink-faint)' }} axisLine={false} tickLine={false} />
              <Tooltip labelFormatter={(v) => formatBucketLabel(v as string)} contentStyle={{ fontSize: 12, border: '1px solid var(--color-border-strong)', borderRadius: 4 }} />
              <Line type="monotone" dataKey={metric as string} stroke="var(--chart-1)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </>
  );
}
