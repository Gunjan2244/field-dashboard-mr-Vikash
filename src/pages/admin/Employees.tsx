import PageHeader from '../../components/PageHeader';
import { districts, users } from '../../lib/mockData';

const districtById = new Map(districts.map((d) => [d.id, d.name]));
const employees = users.filter((u) => u.role === 'employee');

export default function Employees() {
  return (
    <>
      <PageHeader
        title="Employees"
        subtitle="Manage accounts and district assignment"
        actions={<button className="btn btn-primary">Add employee</button>}
      />
      <div style={{ padding: 'var(--space-5)' }}>
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
                  <td>{districtById.get(e.districtId as string)}</td>
                  <td>
                    <span className={`badge ${e.status === 'active' ? 'badge-positive' : 'badge-neutral'}`}>{e.status}</span>
                  </td>
                  <td>
                    <button className="btn btn-ghost">Edit</button>
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
