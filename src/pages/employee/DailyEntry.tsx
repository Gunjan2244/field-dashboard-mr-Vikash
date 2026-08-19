import { useMemo, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { dailyEntries, isEditable } from '../../lib/mockData';
import { METRIC_FIELDS, DailyEntry } from '../../lib/types';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function emptyForm() {
  const f: Record<string, number> = {};
  METRIC_FIELDS.forEach((m) => (f[m.key as string] = 0));
  return f;
}

export default function DailyEntryPage() {
  const { user } = useAuth();
  const [date, setDate] = useState(todayIso());
  const [saved, setSaved] = useState(false);

  const existing = useMemo(
    () => dailyEntries.find((e) => e.userId === user!.id && e.date === date),
    [date, user]
  );

  const [form, setForm] = useState<Record<string, number>>(() => {
    if (existing) {
      const f: Record<string, number> = {};
      METRIC_FIELDS.forEach((m) => (f[m.key as string] = existing[m.key] as number));
      return f;
    }
    return emptyForm();
  });

  const editable = isEditable(date);

  function loadDate(newDate: string) {
    setDate(newDate);
    setSaved(false);
    const e = dailyEntries.find((en) => en.userId === user!.id && en.date === newDate);
    if (e) {
      const f: Record<string, number> = {};
      METRIC_FIELDS.forEach((m) => (f[m.key as string] = e[m.key] as number));
      setForm(f);
    } else {
      setForm(emptyForm());
    }
  }

  function handleChange(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: Math.max(0, Number(value) || 0) }));
  }

  function handleSave() {
    if (!user || !editable) return;
    const idx = dailyEntries.findIndex((e) => e.userId === user.id && e.date === date);
    const record: DailyEntry = {
      id: existing?.id ?? `${user.id}-${date}`,
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
      updatedAt: new Date().toISOString(),
    };
    if (idx >= 0) dailyEntries[idx] = record;
    else dailyEntries.push(record);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <>
      <PageHeader title="Daily Entry" subtitle="Record today's field activity" />
      <div style={{ padding: 'var(--space-5)', maxWidth: 640 }}>
        <div className="card" style={{ padding: 'var(--space-5)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
            <div className="field" style={{ maxWidth: 200 }}>
              <label htmlFor="date">Date</label>
              <input id="date" type="date" value={date} max={todayIso()} onChange={(e) => loadDate(e.target.value)} />
            </div>
            {!editable && <span className="badge badge-neutral">Locked — older than 2 days</span>}
            {editable && existing && <span className="badge badge-neutral">Editing existing entry</span>}
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
                  disabled={!editable}
                  onChange={(e) => handleChange(m.key as string, e.target.value)}
                />
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-5)' }}>
            <button className="btn btn-primary" disabled={!editable} onClick={handleSave}>
              Save entry
            </button>
            {saved && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-positive)' }}>Saved.</span>}
            {!editable && (
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
