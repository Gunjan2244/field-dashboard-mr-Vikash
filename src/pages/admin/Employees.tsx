import { FormEvent, useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import { createEmployee, deleteEmployee, getDistricts, getEmployees, setEmployeePassword, updateEmployee } from '../../lib/api';
import { District, User } from '../../lib/types';

function randomPassword() {
  return Math.random().toString(36).slice(-6) + Math.random().toString(36).slice(-4).toUpperCase() + '!1';
}

export default function Employees() {
  const [districts, setDistricts] = useState<District[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftDistrict, setDraftDistrict] = useState<string>('');
  const [draftStatus, setDraftStatus] = useState<'active' | 'inactive'>('active');
  const [saving, setSaving] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState(randomPassword());
  const [newDistrict, setNewDistrict] = useState('');
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);
  const [createdCreds, setCreatedCreds] = useState<{ email: string; password: string } | null>(null);

  const [resetId, setResetId] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetting, setResetting] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  function refresh() {
    getDistricts().then(setDistricts).catch(() => setDistricts([]));
    getEmployees().then(setEmployees).catch(() => setEmployees([]));
  }

  useEffect(refresh, []);

  const districtById = new Map(districts.map((d) => [d.id, d.name]));

  function startEdit(e: User) {
    setEditingId(e.id);
    setDraftDistrict(e.districtId ?? '');
    setDraftStatus(e.status);
  }

  async function saveEdit(id: string) {
    setSaving(true);
    try {
      await updateEmployee(id, { districtId: draftDistrict || null, status: draftStatus });
      setEditingId(null);
      refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreateError('');
    if (!newName.trim() || !newEmail.trim() || !newPassword) {
      setCreateError('Fill in name, email, and password.');
      return;
    }
    if (newPassword.length < 8) {
      setCreateError('Password must be at least 8 characters.');
      return;
    }
    setCreating(true);
    try {
      await createEmployee({
        name: newName.trim(),
        email: newEmail.trim(),
        password: newPassword,
        districtId: newDistrict || null,
      });
      setCreatedCreds({ email: newEmail.trim(), password: newPassword });
      setNewName('');
      setNewEmail('');
      setNewPassword(randomPassword());
      setNewDistrict('');
      refresh();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Could not create this account.');
    } finally {
      setCreating(false);
    }
  }

  function startReset(id: string) {
    setResetId(id);
    setResetPassword(randomPassword());
    setResetError('');
  }

  async function submitReset() {
    if (!resetId) return;
    if (resetPassword.length < 8) {
      setResetError('Password must be at least 8 characters.');
      return;
    }
    setResetting(true);
    setResetError('');
    try {
      await setEmployeePassword(resetId, resetPassword);
    } catch (err) {
      setResetError(err instanceof Error ? err.message : 'Could not update the password.');
    } finally {
      setResetting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this employee account? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await deleteEmployee(id);
      refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not delete this account.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Employees"
        subtitle="Create accounts, assign districts, and manage access"
        actions={
          <button className="btn btn-primary" onClick={() => { setShowCreate((v) => !v); setCreatedCreds(null); }}>
            {showCreate ? 'Close' : 'New employee'}
          </button>
        }
      />
      <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {showCreate && (
          <div className="card" style={{ padding: 'var(--space-5)', maxWidth: 480 }}>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-4)' }}>Create employee account</div>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div className="field">
                <label htmlFor="new-name">Name</label>
                <input id="new-name" type="text" value={newName} onChange={(e) => setNewName(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="new-email">Email</label>
                <input id="new-email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="new-district">District</label>
                <select id="new-district" value={newDistrict} onChange={(e) => setNewDistrict(e.target.value)}>
                  <option value="">Unassigned</option>
                  {districts.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="new-password">Temporary password</label>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <input id="new-password" type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{ flex: 1 }} />
                  <button type="button" className="btn btn-ghost" onClick={() => setNewPassword(randomPassword())}>Regenerate</button>
                </div>
              </div>
              {createError && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-negative)' }}>{createError}</div>}
              <button className="btn btn-primary" type="submit" disabled={creating}>
                {creating ? 'Creating…' : 'Create account'}
              </button>
            </form>
          </div>
        )}

        {createdCreds && (
          <div className="card" style={{ padding: 'var(--space-4)', fontSize: 'var(--text-sm)' }}>
            Account created for <strong>{createdCreds.email}</strong>. Share this temporary password with them: <code>{createdCreds.password}</code>
          </div>
        )}

        <div className="card" style={{ overflow: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>District</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => (
                <tr key={e.id}>
                  <td>{e.name}</td>
                  <td>{e.email}</td>
                  <td>
                    {editingId === e.id ? (
                      <select value={draftDistrict} onChange={(ev) => setDraftDistrict(ev.target.value)}>
                        <option value="">Unassigned</option>
                        {districts.map((d) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    ) : (
                      districtById.get(e.districtId as string) ?? '—'
                    )}
                  </td>
                  <td>
                    {editingId === e.id ? (
                      <select value={draftStatus} onChange={(ev) => setDraftStatus(ev.target.value as 'active' | 'inactive')}>
                        <option value="active">active</option>
                        <option value="inactive">inactive</option>
                      </select>
                    ) : (
                      <span className={`badge ${e.status === 'active' ? 'badge-positive' : 'badge-neutral'}`}>{e.status}</span>
                    )}
                  </td>
                  <td>
                    {editingId === e.id ? (
                      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <button className="btn btn-primary" disabled={saving} onClick={() => saveEdit(e.id)}>Save</button>
                        <button className="btn btn-ghost" onClick={() => setEditingId(null)}>Cancel</button>
                      </div>
                    ) : resetId === e.id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', minWidth: 220 }}>
                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                          <input type="text" value={resetPassword} onChange={(ev) => setResetPassword(ev.target.value)} style={{ flex: 1 }} />
                        </div>
                        {resetError && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-negative)' }}>{resetError}</div>}
                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                          <button className="btn btn-primary" disabled={resetting} onClick={submitReset}>{resetting ? 'Saving…' : 'Set password'}</button>
                          <button className="btn btn-ghost" onClick={() => setResetId(null)}>Done</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <button className="btn btn-ghost" onClick={() => startEdit(e)}>Edit</button>
                        <button className="btn btn-ghost" onClick={() => startReset(e.id)}>Reset password</button>
                        <button className="btn btn-ghost" style={{ color: 'var(--color-negative)' }} disabled={deletingId === e.id} onClick={() => handleDelete(e.id)}>
                          {deletingId === e.id ? 'Deleting…' : 'Delete'}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {employees.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-ink-faint)', padding: 'var(--space-5)' }}>
                    No employees yet. Use "New employee" above to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
