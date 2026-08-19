import { FormEvent, useMemo, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { leaveRequests } from '../../lib/mockData';
import { LeaveRequest, LeaveStatus } from '../../lib/types';

const statusClass: Record<LeaveStatus, string> = {
  pending: 'badge-warning',
  approved: 'badge-positive',
  rejected: 'badge-negative',
};

export default function Leave() {
  const { user } = useAuth();
  const [, forceRender] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const myRequests = useMemo(
    () => leaveRequests.filter((l) => l.userId === user!.id).sort((a, b) => (a.appliedAt < b.appliedAt ? 1 : -1)),
    [user, leaveRequests.length]
  );

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!startDate || !endDate) {
      setError('Select a start and end date.');
      return;
    }
    if (endDate < startDate) {
      setError('End date cannot be before start date.');
      return;
    }
    const record: LeaveRequest = {
      id: `l-${Date.now()}`,
      userId: user!.id,
      startDate,
      endDate,
      reason: reason.trim() || '—',
      status: 'pending',
      appliedAt: new Date().toISOString().slice(0, 10),
    };
    leaveRequests.push(record);
    setStartDate('');
    setEndDate('');
    setReason('');
    setError('');
    forceRender((n) => n + 1);
  }

  return (
    <>
      <PageHeader title="Leave" subtitle="Apply for leave and track approval status" />
      <div style={{ padding: 'var(--space-5)', display: 'flex', gap: 'var(--space-5)', flexWrap: 'wrap' }}>
        <div className="card" style={{ padding: 'var(--space-5)', width: 340, flexShrink: 0 }}>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-4)' }}>New request</div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div className="field">
              <label htmlFor="start">Start date</label>
              <input id="start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="end">End date</label>
              <input id="end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="reason">Reason</label>
              <input id="reason" type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Brief reason" />
            </div>
            {error && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-negative)' }}>{error}</div>}
            <button className="btn btn-primary" type="submit">Submit request</button>
          </form>
        </div>

        <div className="card" style={{ flex: 1, minWidth: 320 }}>
          <table>
            <thead>
              <tr>
                <th>Applied</th>
                <th>From</th>
                <th>To</th>
                <th>Reason</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {myRequests.map((l) => (
                <tr key={l.id}>
                  <td>{l.appliedAt}</td>
                  <td>{l.startDate}</td>
                  <td>{l.endDate}</td>
                  <td>{l.reason}</td>
                  <td>
                    <span className={`badge ${statusClass[l.status]}`}>{l.status}</span>
                  </td>
                </tr>
              ))}
              {myRequests.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-ink-faint)', padding: 'var(--space-5)' }}>
                    No leave requests yet.
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
