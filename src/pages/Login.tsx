import { FormEvent, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!password) {
      setError('Enter your password.');
      return;
    }
    const result = login(email);
    if (!result.ok) setError(result.error ?? 'Unable to sign in.');
  }

  return (
    <div style={styles.page}>
      <div style={styles.panel} className="card">
        <div style={styles.brand}>
          <div style={styles.brandMark}>FM</div>
          <div>
            <div style={styles.brandTitle}>Field Monitoring</div>
            <div style={styles.brandSub}>District Activity Reporting</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@org.in" autoFocus />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button type="submit" className="btn btn-primary" style={{ marginTop: 'var(--space-2)' }}>
            Sign in
          </button>
        </form>

        <div style={styles.demoBox}>
          <div style={styles.demoLabel}>Demo accounts</div>
          <div style={styles.demoRow}>admin@org.in — Admin</div>
          <div style={styles.demoRow}>ravi.k@org.in — Employee, Patna</div>
          <div style={styles.demoHint}>Any password works in this preview build.</div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--color-bg)',
    padding: 'var(--space-4)',
  },
  panel: {
    width: 380,
    padding: 'var(--space-5)',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    marginBottom: 'var(--space-5)',
  },
  brandMark: {
    width: 40,
    height: 40,
    borderRadius: 'var(--radius-sm)',
    background: 'var(--color-accent)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    fontSize: 'var(--text-sm)',
    letterSpacing: '0.02em',
  },
  brandTitle: {
    fontSize: 'var(--text-md)',
    fontWeight: 600,
    color: 'var(--color-ink)',
  },
  brandSub: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-ink-faint)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-3)',
  },
  error: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-negative)',
    background: 'var(--color-negative-soft)',
    padding: 'var(--space-2) var(--space-3)',
    borderRadius: 'var(--radius-sm)',
  },
  demoBox: {
    marginTop: 'var(--space-5)',
    paddingTop: 'var(--space-4)',
    borderTop: '1px solid var(--color-border)',
  },
  demoLabel: {
    fontSize: 'var(--text-xs)',
    fontWeight: 600,
    color: 'var(--color-ink-soft)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: 'var(--space-2)',
  },
  demoRow: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-ink-soft)',
    lineHeight: 1.8,
  },
  demoHint: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-ink-faint)',
    marginTop: 'var(--space-2)',
  },
};
