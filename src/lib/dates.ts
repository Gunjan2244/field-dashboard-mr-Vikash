export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Mirrors the server-side RLS check on daily_entries: an entry is only
 * editable if its date is today or up to 2 days in the past. This client
 * copy is for UI purposes only (disabling inputs, showing badges) — the
 * database enforces the real rule regardless of what the client sends.
 */
export function isEditable(dateStr: string): boolean {
  const entryDate = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((today.getTime() - entryDate.getTime()) / 86400000);
  return diffDays >= 0 && diffDays <= 2;
}
