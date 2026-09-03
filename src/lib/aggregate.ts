import { DailyEntry } from './types';

export type Grain = 'daily' | 'weekly' | 'monthly' | 'all-time';

function addEntry(target: Record<string, number>, entry: DailyEntry) {
  for (const [key, value] of Object.entries(entry.metrics)) {
    target[key] = (target[key] ?? 0) + (value || 0);
  }
}

function weekKey(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((day + 6) % 7));
  return monday.toISOString().slice(0, 10);
}

function monthKey(dateStr: string): string {
  return dateStr.slice(0, 7); // yyyy-mm
}

export function bucketKey(dateStr: string, grain: Grain): string {
  if (grain === 'daily') return dateStr;
  if (grain === 'weekly') return weekKey(dateStr);
  if (grain === 'monthly') return monthKey(dateStr);
  return 'all';
}

/** Rolls entries into time buckets, summing every metric present on each entry. Sorted ascending by bucket. */
export function aggregateByTime(entries: DailyEntry[], grain: Grain) {
  const buckets = new Map<string, Record<string, number>>();
  for (const e of entries) {
    const key = bucketKey(e.date, grain);
    if (!buckets.has(key)) buckets.set(key, {});
    addEntry(buckets.get(key)!, e);
  }
  return Array.from(buckets.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([key, totals]) => ({ bucket: key, ...totals }));
}

/** Sums every metric across the given entries into a single totals object, keyed by metric field key. */
export function sumEntries(entries: DailyEntry[]): Record<string, number> {
  const totals: Record<string, number> = {};
  entries.forEach((e) => addEntry(totals, e));
  return totals;
}

export function filterByRange(entries: DailyEntry[], startDate?: string, endDate?: string) {
  return entries.filter((e) => (!startDate || e.date >= startDate) && (!endDate || e.date <= endDate));
}

export function rangeForGrain(grain: Grain): { start?: string; end?: string } {
  const today = new Date();
  const end = today.toISOString().slice(0, 10);
  if (grain === 'all-time') return {};
  const start = new Date(today);
  if (grain === 'daily') start.setDate(today.getDate() - 13); // last 14 days of daily points
  if (grain === 'weekly') start.setDate(today.getDate() - 7 * 11); // last 12 weeks
  if (grain === 'monthly') start.setMonth(today.getMonth() - 11); // last 12 months
  return { start: start.toISOString().slice(0, 10), end };
}

export function previousPeriodRange(grain: Grain): { start?: string; end?: string } {
  const today = new Date();
  const end = new Date(today);
  const start = new Date(today);
  if (grain === 'daily') {
    end.setDate(today.getDate() - 1);
    start.setDate(today.getDate() - 1);
  } else if (grain === 'weekly') {
    end.setDate(today.getDate() - 7);
    start.setDate(today.getDate() - 13);
  } else {
    end.setMonth(today.getMonth() - 1);
    start.setMonth(today.getMonth() - 1);
    start.setDate(1);
  }
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

export function currentPeriodRange(grain: Grain): { start?: string; end?: string } {
  const today = new Date();
  const end = today.toISOString().slice(0, 10);
  const start = new Date(today);
  if (grain === 'daily') return { start: end, end };
  if (grain === 'weekly') start.setDate(today.getDate() - 6);
  if (grain === 'monthly') start.setDate(1);
  return { start: start.toISOString().slice(0, 10), end };
}

export function percentChange(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / previous) * 100;
}
