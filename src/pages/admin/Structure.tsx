import { FormEvent, useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import {
  createDistrict,
  createMetricField,
  createProject,
  deleteDistrict,
  deleteMetricField,
  deleteProject,
  getDistricts,
  getProjects,
  updateDistrict,
  updateProject,
} from '../../lib/api';
import { District, Project } from '../../lib/types';

function slugify(label: string) {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export default function Structure() {
  const [districts, setDistricts] = useState<District[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string | null>(null);

  const [newDistrictName, setNewDistrictName] = useState('');
  const [editingDistrictId, setEditingDistrictId] = useState<string | null>(null);
  const [districtDraft, setDistrictDraft] = useState('');

  const [newProjectName, setNewProjectName] = useState('');
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [projectDraft, setProjectDraft] = useState('');

  const [newFieldLabel, setNewFieldLabel] = useState<Record<string, string>>({});
  const [error, setError] = useState('');

  function refresh() {
    getDistricts().then((list) => {
      setDistricts(list);
      setSelectedDistrictId((current) => current ?? list[0]?.id ?? null);
    }).catch(() => setDistricts([]));
    getProjects().then(setProjects).catch(() => setProjects([]));
  }

  useEffect(refresh, []);

  const selectedDistrict = districts.find((d) => d.id === selectedDistrictId) ?? null;
  const districtProjects = projects.filter((p) => p.districtId === selectedDistrictId);

  async function handleAddDistrict(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!newDistrictName.trim()) return;
    try {
      const d = await createDistrict(newDistrictName.trim());
      setNewDistrictName('');
      refresh();
      setSelectedDistrictId(d.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create district.');
    }
  }

  async function saveDistrictEdit(id: string) {
    if (!districtDraft.trim()) return;
    await updateDistrict(id, districtDraft.trim());
    setEditingDistrictId(null);
    refresh();
  }

  async function handleDeleteDistrict(id: string) {
    if (!confirm('Delete this district? Its projects must be removed first.')) return;
    try {
      await deleteDistrict(id);
      if (selectedDistrictId === id) setSelectedDistrictId(null);
      refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not delete district — remove its projects first.');
    }
  }

  async function handleAddProject(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!selectedDistrictId || !newProjectName.trim()) return;
    try {
      await createProject(selectedDistrictId, newProjectName.trim());
      setNewProjectName('');
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create project.');
    }
  }

  async function saveProjectEdit(id: string) {
    if (!projectDraft.trim()) return;
    await updateProject(id, { name: projectDraft.trim() });
    setEditingProjectId(null);
    refresh();
  }

  async function handleDeleteProject(id: string) {
    if (!confirm('Delete this project? Existing entries logged under it will remain but the project will no longer be selectable.')) return;
    try {
      await deleteProject(id);
      refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not delete project.');
    }
  }

  async function handleAddField(projectId: string, sortOrder: number) {
    const label = (newFieldLabel[projectId] ?? '').trim();
    if (!label) return;
    const key = slugify(label);
    if (!key) return;
    try {
      await createMetricField(projectId, key, label, sortOrder);
      setNewFieldLabel((m) => ({ ...m, [projectId]: '' }));
      refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not add this field (the key may already exist on this project).');
    }
  }

  async function handleDeleteField(fieldId: string) {
    if (!confirm('Remove this metric field? Past entries keep their recorded values, but the field will no longer appear on the entry form.')) return;
    await deleteMetricField(fieldId);
    refresh();
  }

  return (
    <>
      <PageHeader title="Districts & Projects" subtitle="Define districts, their projects, and each project's custom metric fields" />
      <div style={{ padding: 'var(--space-5)', display: 'flex', gap: 'var(--space-5)', alignItems: 'flex-start' }}>
        {/* Districts column */}
        <div className="card" style={{ padding: 'var(--space-4)', width: 280, flexShrink: 0 }}>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-3)' }}>Districts</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', marginBottom: 'var(--space-4)' }}>
            {districts.map((d) => (
              <div
                key={d.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  padding: 'var(--space-2)',
                  borderRadius: 'var(--radius-sm)',
                  background: d.id === selectedDistrictId ? 'var(--color-accent-soft)' : 'transparent',
                  cursor: 'pointer',
                }}
              >
                {editingDistrictId === d.id ? (
                  <>
                    <input
                      value={districtDraft}
                      onChange={(e) => setDistrictDraft(e.target.value)}
                      style={{ flex: 1, height: 28 }}
                      autoFocus
                    />
                    <button className="btn btn-ghost" style={{ padding: '0 8px' }} onClick={() => saveDistrictEdit(d.id)}>Save</button>
                  </>
                ) : (
                  <>
                    <span onClick={() => setSelectedDistrictId(d.id)} style={{ flex: 1, fontSize: 'var(--text-sm)' }}>{d.name}</span>
                    <button className="btn btn-ghost" style={{ padding: '0 6px' }} onClick={() => { setEditingDistrictId(d.id); setDistrictDraft(d.name); }}>✎</button>
                    <button className="btn btn-ghost" style={{ padding: '0 6px', color: 'var(--color-negative)' }} onClick={() => handleDeleteDistrict(d.id)}>✕</button>
                  </>
                )}
              </div>
            ))}
            {districts.length === 0 && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-faint)' }}>No districts yet.</div>}
          </div>
          <form onSubmit={handleAddDistrict} style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <input
              placeholder="New district name"
              value={newDistrictName}
              onChange={(e) => setNewDistrictName(e.target.value)}
              style={{ flex: 1, height: 32 }}
            />
            <button className="btn btn-primary" type="submit">Add</button>
          </form>
        </div>

        {/* Projects + fields column */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {error && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-negative)' }}>{error}</div>}

          {!selectedDistrict ? (
            <div className="card" style={{ padding: 'var(--space-5)', fontSize: 'var(--text-sm)', color: 'var(--color-ink-faint)' }}>
              Select or create a district to manage its projects.
            </div>
          ) : (
            <>
              <div className="card" style={{ padding: 'var(--space-4)' }}>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-3)' }}>
                  Projects in {selectedDistrict.name}
                </div>
                <form onSubmit={handleAddProject} style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                  <input
                    placeholder="New project name"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    style={{ flex: 1, height: 32, maxWidth: 320 }}
                  />
                  <button className="btn btn-primary" type="submit">Add project</button>
                </form>
              </div>

              {districtProjects.length === 0 && (
                <div className="card" style={{ padding: 'var(--space-5)', fontSize: 'var(--text-sm)', color: 'var(--color-ink-faint)' }}>
                  No projects in this district yet.
                </div>
              )}

              {districtProjects.map((p) => (
                <div className="card" key={p.id} style={{ padding: 'var(--space-4)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                    {editingProjectId === p.id ? (
                      <>
                        <input value={projectDraft} onChange={(e) => setProjectDraft(e.target.value)} style={{ height: 30, flex: 1, maxWidth: 260 }} autoFocus />
                        <button className="btn btn-ghost" onClick={() => saveProjectEdit(p.id)}>Save</button>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: 'var(--text-md)', fontWeight: 600, flex: 1 }}>{p.name}</div>
                        <button className="btn btn-ghost" onClick={() => { setEditingProjectId(p.id); setProjectDraft(p.name); }}>Rename</button>
                        <button className="btn btn-ghost" style={{ color: 'var(--color-negative)' }} onClick={() => handleDeleteProject(p.id)}>Delete project</button>
                      </>
                    )}
                  </div>

                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-faint)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 'var(--space-2)' }}>
                    Metric fields
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', marginBottom: 'var(--space-3)' }}>
                    {p.metricFields.map((m) => (
                      <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
                        <span style={{ flex: 1 }}>{m.label}</span>
                        <code style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-faint)' }}>{m.key}</code>
                        <button className="btn btn-ghost" style={{ padding: '0 6px', color: 'var(--color-negative)' }} onClick={() => handleDeleteField(m.id)}>Remove</button>
                      </div>
                    ))}
                    {p.metricFields.length === 0 && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-faint)' }}>No fields defined yet — employees can't log entries until you add at least one.</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <input
                      placeholder="New field label, e.g. Schools Observed"
                      value={newFieldLabel[p.id] ?? ''}
                      onChange={(e) => setNewFieldLabel((m) => ({ ...m, [p.id]: e.target.value }))}
                      style={{ flex: 1, height: 30, maxWidth: 320 }}
                    />
                    <button className="btn btn-secondary" onClick={() => handleAddField(p.id, p.metricFields.length)}>Add field</button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </>
  );
}
