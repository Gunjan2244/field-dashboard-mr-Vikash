import { useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { getEntryForDate, upsertEntry } from '../../lib/api';
import { isEditable, todayIso } from '../../lib/dates';
import { METRIC_FIELDS } from '../../lib/types';

function emptyForm() {
  const f: Record<string, number> = {};
  METRIC_FIELDS.forEach((m) => (f[m.key as string] = 0));
  return f;
}

export default function DailyEntryPage() {
  const { user } = useAuth();
  const [date, setDate] = useState(todayIso());
  const [form, setForm] = useState<Record<string, number>>(emptyForm());
  const [hasExisting, setHasExisting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const editable = isEditable(date);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    setSaved(false);
    setError('');
    getEntryForDate(user.id, date)
      .then((existing) => {
        if (cancelled) return;
        if (existing) {
          const f: Record<string, number> = {};
          METRIC_FIELDS.forEach((m) => (f[m.key as string] = existing[m.key] as number));
          setForm(f);
          setHasExisting(true);
        } else {
          setForm(emptyForm());
          setHasExisting(false);
        }
      })
      .catch(() => !cancelled && setError('Could not load this entry.'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [user, date]);

  function handleChange(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: Math.max(0, Number(value) || 0) }));
  }

  async function handleSave() {
    if (!user || !editable) return;
    setSaving(true);
    setError('');
    try {
      await upsertEntry({
        userId: user.id,
        districtId: user.districtId as string,
        date,
        schoolsObserved: form.schoolsObserved,
        classesObserved: form.classesObserved,
        studentsAttended: form.studentsAttended,
        teachersObserved: form.teachersObserved,
        fieldVisits: form.fieldVisits,
        storiesRead: form.storiesRead,
        seelDone: form.seelDone,
      });
      setHasExisting(true);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError('Could not save this entry. It may be outside the 2-day edit window.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader title="Daily Entry" subtitle="Record today's field activity" />
      <div style={{ padding: 'var(--space-5)', maxWidth: 640 }}>
        <div className="card" style={{ padding: 'var(--space-5)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
            <div className="field" style={{ maxWidth: 200 }}>
              <label htmlFor="date">Date</label>
              <input id="date" type="date" value={date} max={todayIso()} onChange={(e) => setDate(e.target.value)} />
            </div>
            {!editable && <span className="badge badge-neutral">Locked — older than 2 days</span>}
            {editable && hasExisting && <span className="badge badge-neutral">Editing existing entry</span>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            {METRIC_FIELDS.map((m) => (
              <div className="field" key={m.key as string}>
                <label htmlFor={m.key as string}>{m.label}</label>
                <input
                  id={m.key as string}
                  type="number"
                  min={0}
                  value={form[m.key as string]}
                  disabled={!editable || loading}
                  onChange={(e) => handleChange(m.key as string, e.target.value)}
                />
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-5)' }}>
            <button className="btn btn-primary" disabled={!editable || loading || saving} onClick={handleSave}>
              {saving ? 'Saving…' : 'Save entry'}
            </button>
            {saved && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-positive)' }}>Saved.</span>}
            {error && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-negative)' }}>{error}</span>}
            {!editable && !error && (
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-faint)' }}>
                Entries can only be edited within 2 days of the date. Contact your admin for corrections beyond that.
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
