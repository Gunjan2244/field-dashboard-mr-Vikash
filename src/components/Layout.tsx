import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDistricts } from '../lib/api';
import { District } from '../lib/types';

const employeeLinks = [
  { to: '/app/entry', label: 'Daily Entry' },
  { to: '/app/history', label: 'My History' },
  { to: '/app/leave', label: 'Leave' },
  { to: '/app/stats', label: 'My Stats' },
];

const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/entries', label: 'All Entries' },
  { to: '/admin/employees', label: 'Employees' },
  { to: '/admin/leave', label: 'Leave Approvals' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const [districts, setDistricts] = useState<District[]>([]);

  useEffect(() => {
    getDistricts().then(setDistricts).catch(() => setDistricts([]));
  }, []);

  if (!user) return null;

  const links = user.role === 'admin' ? adminLinks : employeeLinks;
  const districtName = districts.find((d) => d.id === user.districtId)?.name;

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside
        style={{
          width: 'var(--sidebar-width)',
          borderRight: '1px solid var(--color-border)',
          background: 'var(--color-surface)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            height: 'var(--header-height)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: '0 var(--space-4)',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-accent)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            FM
          </div>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Field Monitoring</span>
        </div>

        <nav style={{ padding: 'var(--space-4) var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              style={({ isActive }) => ({
                padding: 'var(--space-2) var(--space-3)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--text-sm)',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--color-accent)' : 'var(--color-ink-soft)',
                background: isActive ? 'var(--color-accent-soft)' : 'transparent',
                textDecoration: 'none',
              })}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', padding: 'var(--space-4) var(--space-3)', borderTop: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-ink)' }}>{user.name}</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink-faint)', marginTop: 2 }}>
            {user.role === 'admin' ? 'Administrator' : districtName ?? '—'}
          </div>
          <button onClick={logout} className="btn btn-ghost" style={{ marginTop: 'var(--space-3)', width: '100%', justifyContent: 'flex-start', padding: 'var(--space-1) 0' }}>
            Sign out
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </main>
    </div>
  );
}
