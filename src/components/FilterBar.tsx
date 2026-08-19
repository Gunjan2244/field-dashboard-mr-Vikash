import { District, User } from '../lib/types';
import { Grain } from '../lib/aggregate';

const selectStyle: React.CSSProperties = {
  height: 34,
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-border-strong)',
  padding: '0 var(--space-3)',
  fontSize: 'var(--text-sm)',
  background: 'var(--color-surface)',
  color: 'var(--color-ink)',
};

export default function FilterBar({
  districts,
  employees,
  districtId,
  employeeId,
  grain,
  onDistrictChange,
  onEmployeeChange,
  onGrainChange,
}: {
  districts: District[];
  employees: User[];
  districtId: string;
  employeeId: string;
  grain: Grain;
  onDistrictChange: (v: string) => void;
  onEmployeeChange: (v: string) => void;
  onGrainChange: (v: Grain) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
      <select style={selectStyle} value={districtId} onChange={(e) => onDistrictChange(e.target.value)}>
        <option value="all">All districts</option>
        {districts.map((d) => (
          <option key={d.id} value={d.id}>{d.name}</option>
        ))}
      </select>

      <select style={selectStyle} value={employeeId} onChange={(e) => onEmployeeChange(e.target.value)}>
        <option value="all">All employees</option>
        {employees.map((e) => (
          <option key={e.id} value={e.id}>{e.name}</option>
        ))}
      </select>

      <div style={{ display: 'flex', border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
        {(['daily', 'weekly', 'monthly', 'all-time'] as Grain[]).map((g) => (
          <button
            key={g}
            onClick={() => onGrainChange(g)}
            style={{
              padding: '0 var(--space-3)',
              height: 34,
              fontSize: 'var(--text-sm)',
              fontWeight: grain === g ? 600 : 500,
              border: 'none',
              borderRight: g !== 'all-time' ? '1px solid var(--color-border-strong)' : 'none',
              background: grain === g ? 'var(--color-accent)' : 'var(--color-surface)',
              color: grain === g ? '#fff' : 'var(--color-ink-soft)',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {g === 'all-time' ? 'Up to date' : g}
          </button>
        ))}
      </div>
    </div>
  );
}
