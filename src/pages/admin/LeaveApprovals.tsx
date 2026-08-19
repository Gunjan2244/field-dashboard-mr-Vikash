import { useState } from 'react';
import PageHeader from '../../components/PageHeader';
import { leaveRequests, users } from '../../lib/mockData';
import { LeaveStatus } from '../../lib/types';

const nameById = new Map(users.map((u) => [u.id, u.name]));

const statusClass: Record<LeaveStatus, string> = {
  pending: 'badge-warning',
  approved: 'badge-positive',
  rejected: 'badge-negative',
};

export default function LeaveApprovals() {
  const [, forceRender] = useState(0);
  const sorted = [...leaveRequests].sort((a, b) => (a.appliedAt < b.appliedAt ? 1 : -1));

  function setStatus(id: string, status: LeaveStatus) {
    const req = leaveRequests.find((l) => l.id === id);
    if (req) req.status = status;
    forceRender((n) => n + 1);
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
                  <td>{nameById.get(l.userId)}</td>
                  <td>{l.appliedAt}</td>
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
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
