import { useMemo, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import { districts, users, dailyEntries, isEditable } from '../../lib/mockData';
import { METRIC_FIELDS } from '../../lib/types';

const employees = users.filter((u) => u.role === 'employee');
const nameById = new Map(users.map((u) => [u.id, u.name]));
const districtById = new Map(districts.map((d) => [d.id, d.name]));

export default function AdminEntries() {
  const [districtId, setDistrictId] = useState('all');
  const [employeeId, setEmployeeId] = useState('all');
  const [days, setDays] = useState(14);

  const rows = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    return dailyEntries
      .filter((e) => {
        if (districtId !== 'all' && e.districtId !== districtId) return false;
        if (employeeId !== 'all' && e.userId !== employeeId) return false;
        return e.date >= cutoffStr;
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [districtId, employeeId, days]);

  const scopedEmployees = districtId === 'all' ? employees : employees.filter((e) => e.districtId === districtId);
  const selectStyle: React.CSSProperties = { height: 34, borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-strong)', padding: '0 var(--space-3)', fontSize: 'var(--text-sm)' };

  return (
    <>
      <PageHeader title="All Entries" subtitle="Every submission across all districts" />
      <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <select style={selectStyle} value={districtId} onChange={(e) => { setDistrictId(e.target.value); setEmployeeId('all'); }}>
            <option value="all">All districts</option>
            {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select style={selectStyle} value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
            <option value="all">All employees</option>
            {scopedEmployees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <select style={selectStyle} value={days} onChange={(e) => setDays(Number(e.target.value))}>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <span style={{ marginLeft: 'auto', fontSize: 'var(--text-xs)', color: 'var(--color-ink-faint)', alignSelf: 'center' }}>
            {rows.length} entries
          </span>
        </div>

        <div className="card" style={{ overflow: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Employee</th>
                <th>District</th>
                {METRIC_FIELDS.map((m) => <th key={m.key as string}>{m.label}</th>)}
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.date}</td>
                  <td>{nameById.get(r.userId)}</td>
                  <td>{districtById.get(r.districtId)}</td>
                  {METRIC_FIELDS.map((m) => <td key={m.key as string}>{r[m.key] as number}</td>)}
                  <td>
                    <span className={`badge ${isEditable(r.date) ? 'badge-positive' : 'badge-neutral'}`}>
                      {isEditable(r.date) ? 'Editable' : 'Locked (admin override available)'}
                    </span>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={METRIC_FIELDS.length + 4} style={{ textAlign: 'center', color: 'var(--color-ink-faint)', padding: 'var(--space-5)' }}>
                    No entries match these filters.
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
