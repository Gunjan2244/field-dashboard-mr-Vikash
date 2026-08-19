import { useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import { getDistricts, getEmployees, updateEmployee } from '../../lib/api';
import { District, User } from '../../lib/types';

export default function Employees() {
  const [districts, setDistricts] = useState<District[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftDistrict, setDraftDistrict] = useState<string>('');
  const [draftStatus, setDraftStatus] = useState<'active' | 'inactive'>('active');
  const [saving, setSaving] = useState(false);

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

  return (
    <>
      <PageHeader
        title="Employees"
        subtitle="Manage district assignment and account status"
      />
      <div style={{ padding: 'var(--space-5)' }}>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-faint)', marginBottom: 'var(--space-3)' }}>
          New employees create their own account from the sign-in screen. Assign them a district below once they sign up.
        </div>
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
                    ) : (
                      <button className="btn btn-ghost" onClick={() => startEdit(e)}>Edit</button>
                    )}
                  </td>
                </tr>
              ))}
              {employees.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-ink-faint)', padding: 'var(--space-5)' }}>
                    No employees yet.
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
