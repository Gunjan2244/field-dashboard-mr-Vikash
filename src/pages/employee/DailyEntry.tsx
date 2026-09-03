import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { getEntryForDate, getProjects, upsertEntry } from '../../lib/api';
import { isEditable, todayIso } from '../../lib/dates';
import { Project } from '../../lib/types';

export default function DailyEntryPage() {
  const { user } = useAuth();
  const [date, setDate] = useState(todayIso());
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState('');
  const [form, setForm] = useState<Record<string, number>>({});
  const [hasExisting, setHasExisting] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const editable = isEditable(date);

  useEffect(() => {
    if (!user?.districtId) {
      setLoadingProjects(false);
      return;
    }
    setLoadingProjects(true);
    getProjects({ districtId: user.districtId })
      .then((list) => {
        setProjects(list);
        setProjectId((current) => current || list[0]?.id || '');
      })
      .catch(() => setProjects([]))
      .finally(() => setLoadingProjects(false));
  }, [user?.districtId]);

  const project = useMemo(() => projects.find((p) => p.id === projectId) ?? null, [projects, projectId]);

  function emptyForm(p: Project | null) {
    const f: Record<string, number> = {};
    (p?.metricFields ?? []).forEach((m) => (f[m.key] = 0));
    return f;
  }

  useEffect(() => {
    if (!user || !projectId) return;
    let cancelled = false;
    setLoading(true);
    setSaved(false);
    setError('');
    getEntryForDate(user.id, date)
      .then((existing) => {
        if (cancelled) return;
        if (existing && existing.projectId === projectId) {
          setForm({ ...emptyForm(project), ...existing.metrics });
          setHasExisting(true);
        } else if (existing) {
          // An entry already exists for this date under a different project.
          setForm(existing.metrics);
          setProjectId(existing.projectId);
          setHasExisting(true);
        } else {
          setForm(emptyForm(project));
          setHasExisting(false);
        }
      })
      .catch(() => !cancelled && setError('Could not load this entry.'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, date, projectId]);

  function handleChange(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: Math.max(0, Number(value) || 0) }));
  }

  function handleProjectChange(id: string) {
    setProjectId(id);
    const next = projects.find((p) => p.id === id) ?? null;
    if (!hasExisting) setForm(emptyForm(next));
  }

  async function handleSave() {
    if (!user || !editable || !project) return;
    setSaving(true);
    setError('');
    try {
      await upsertEntry({
        userId: user.id,
        districtId: user.districtId as string,
        projectId: project.id,
        date,
        metrics: form,
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

  if (!loadingProjects && !user?.districtId) {
    return (
      <>
        <PageHeader title="Daily Entry" subtitle="Record today's field activity" />
        <div style={{ padding: 'var(--space-5)' }}>
          <div className="card" style={{ padding: 'var(--space-5)', fontSize: 'var(--text-sm)', color: 'var(--color-ink-faint)' }}>
            You haven't been assigned to a district yet. Contact your admin.
          </div>
        </div>
      </>
    );
  }

  if (!loadingProjects && projects.length === 0) {
    return (
      <>
        <PageHeader title="Daily Entry" subtitle="Record today's field activity" />
        <div style={{ padding: 'var(--space-5)' }}>
          <div className="card" style={{ padding: 'var(--space-5)', fontSize: 'var(--text-sm)', color: 'var(--color-ink-faint)' }}>
            No projects have been set up for your district yet. Contact your admin.
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Daily Entry" subtitle="Record today's field activity" />
      <div style={{ padding: 'var(--space-5)', maxWidth: 640 }}>
        <div className="card" style={{ padding: 'var(--space-5)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-3)', marginBottom: 'var(--space-5)', flexWrap: 'wrap' }}>
            <div className="field" style={{ maxWidth: 200 }}>
              <label htmlFor="date">Date</label>
              <input id="date" type="date" value={date} max={todayIso()} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="field" style={{ maxWidth: 260 }}>
              <label htmlFor="project">Project</label>
              <select id="project" value={projectId} onChange={(e) => handleProjectChange(e.target.value)} disabled={hasExisting}>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            {!editable && <span className="badge badge-neutral">Locked — older than 2 days</span>}
            {editable && hasExisting && <span className="badge badge-neutral">Editing existing entry</span>}
          </div>

          {hasExisting && (
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-faint)', marginBottom: 'var(--space-4)' }}>
              This date already has an entry under <strong>{project?.name}</strong>. To log it under a different project, delete this entry first by contacting your admin.
            </div>
          )}

          {(project?.metricFields.length ?? 0) === 0 ? (
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-ink-faint)' }}>
              This project has no metric fields defined yet. Contact your admin.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              {project?.metricFields.map((m) => (
                <div className="field" key={m.key}>
                  <label htmlFor={m.key}>{m.label}</label>
                  <input
                    id={m.key}
                    type="number"
                    min={0}
                    value={form[m.key] ?? 0}
                    disabled={!editable || loading}
                    onChange={(e) => handleChange(m.key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-5)', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" disabled={!editable || loading || saving || !project?.metricFields.length} onClick={handleSave}>
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
