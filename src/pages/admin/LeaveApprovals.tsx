import { useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import { getEmployees, getLeaveRequests, updateLeaveStatus } from '../../lib/api';
import { LeaveRequest, LeaveStatus, User } from '../../lib/types';

const statusClass: Record<LeaveStatus, string> = {
  pending: 'badge-warning',
  approved: 'badge-positive',
  rejected: 'badge-negative',
};

export default function LeaveApprovals() {
  const [employees, setEmployees] = useState<User[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);

  function refresh() {
    getEmployees().then(setEmployees).catch(() => setEmployees([]));
    getLeaveRequests().then(setRequests).catch(() => setRequests([]));
  }

  useEffect(refresh, []);

  const nameById = new Map(employees.map((u) => [u.id, u.name]));
  const sorted = [...requests].sort((a, b) => (a.appliedAt < b.appliedAt ? 1 : -1));

  async function setStatus(id: string, status: LeaveStatus) {
    await updateLeaveStatus(id, status);
    refresh();
  }

  return (
    <>
      <PageHeader title="Leave Approvals" subtitle="Review and act on employee leave requests" />
      <div style={{ padding: 'var(--space-5)' }}>
        <div className="card" style={{ overflow: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Applied</th>
                <th>From</th>
                <th>To</th>
                <th>Reason</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((l) => (
                <tr key={l.id}>
                  <td>{nameById.get(l.userId) ?? '—'}</td>
                  <td>{l.appliedAt.slice(0, 10)}</td>
                  <td>{l.startDate}</td>
                  <td>{l.endDate}</td>
                  <td>{l.reason}</td>
                  <td>
                    <span className={`badge ${statusClass[l.status]}`}>{l.status}</span>
                  </td>
                  <td>
                    {l.status === 'pending' ? (
                      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <button className="btn btn-secondary" onClick={() => setStatus(l.id, 'approved')}>Approve</button>
                        <button className="btn btn-ghost" onClick={() => setStatus(l.id, 'rejected')}>Reject</button>
                      </div>
                    ) : (
                      <button className="btn btn-ghost" onClick={() => setStatus(l.id, 'pending')}>Reopen</button>
                    )}
                  </td>
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--color-ink-faint)', padding: 'var(--space-5)' }}>
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
