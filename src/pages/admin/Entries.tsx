import { useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import { getDistricts, getEmployees, getEntries, getProjects } from '../../lib/api';
import { isEditable } from '../../lib/dates';
import { District, User, DailyEntry, Project } from '../../lib/types';

export default function AdminEntries() {
  const [districts, setDistricts] = useState<District[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [allEntries, setAllEntries] = useState<DailyEntry[]>([]);
  const [districtId, setDistrictId] = useState('all');
  const [employeeId, setEmployeeId] = useState('all');
  const [projectId, setProjectId] = useState('all');
  const [days, setDays] = useState(14);

  useEffect(() => {
    getDistricts().then(setDistricts).catch(() => setDistricts([]));
    getEmployees().then(setEmployees).catch(() => setEmployees([]));
    getProjects().then(setAllProjects).catch(() => setAllProjects([]));
    getEntries().then(setAllEntries).catch(() => setAllEntries([]));
  }, []);

  const nameById = useMemo(() => new Map(employees.map((u) => [u.id, u.name])), [employees]);
  const districtById = useMemo(() => new Map(districts.map((d) => [d.id, d.name])), [districts]);
  const projectById = useMemo(() => new Map(allProjects.map((p) => [p.id, p])), [allProjects]);

  const scopedProjects = districtId === 'all' ? allProjects : allProjects.filter((p) => p.districtId === districtId);
  const scopedEmployees = districtId === 'all' ? employees : employees.filter((e) => e.districtId === districtId);
  const activeProject = projectId === 'all' ? null : (projectById.get(projectId) ?? null);

  const rows = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    return allEntries
      .filter((e) => {
        if (districtId !== 'all' && e.districtId !== districtId) return false;
        if (projectId !== 'all' && e.projectId !== projectId) return false;
        if (employeeId !== 'all' && e.userId !== employeeId) return false;
        return e.date >= cutoffStr;
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [allEntries, districtId, projectId, employeeId, days]);

  const selectStyle: React.CSSProperties = { height: 34, borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-strong)', padding: '0 var(--space-3)', fontSize: 'var(--text-sm)' };

  return (
    <>
      <PageHeader title="All Entries" subtitle="Every submission across all districts and projects" />
      <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <select style={selectStyle} value={districtId} onChange={(e) => { setDistrictId(e.target.value); setEmployeeId('all'); setProjectId('all'); }}>
            <option value="all">All districts</option>
            {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select style={selectStyle} value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            <option value="all">All projects</option>
            {scopedProjects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
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
                <th>Project</th>
                {activeProject
                  ? activeProject.metricFields.map((m) => <th key={m.key}>{m.label}</th>)
                  : <th>Metrics</th>}
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const rowProject = projectById.get(r.projectId);
                return (
                  <tr key={r.id}>
                    <td>{r.date}</td>
                    <td>{nameById.get(r.userId)}</td>
                    <td>{districtById.get(r.districtId)}</td>
                    <td>{rowProject?.name ?? '—'}</td>
                    {activeProject ? (
                      activeProject.metricFields.map((m) => <td key={m.key}>{r.metrics[m.key] ?? 0}</td>)
                    ) : (
                      <td style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-faint)' }}>
                        {Object.entries(r.metrics).map(([k, v]) => `${k}: ${v}`).join(', ') || '—'}
                      </td>
                    )}
                    <td>
                      <span className={`badge ${isEditable(r.date) ? 'badge-positive' : 'badge-neutral'}`}>
                        {isEditable(r.date) ? 'Editable' : 'Locked'}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={(activeProject?.metricFields.length ?? 1) + 5} style={{ textAlign: 'center', color: 'var(--color-ink-faint)', padding: 'var(--space-5)' }}>
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
