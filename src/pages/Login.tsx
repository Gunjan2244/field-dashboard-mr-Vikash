import { FormEvent, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Enter your email and password.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await login(email, password);
      if (!result.ok) setError(result.error ?? 'Unable to sign in.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.panel} className="card">
        <div style={styles.brand}>
          <div style={styles.brandMark}>FM</div>
          <div>
            <div style={styles.brandTitle}>Field Monitoring</div>
            <div style={styles.brandSub}>District &amp; Project Activity Reporting</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@org.in"
              autoFocus
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button type="submit" className="btn btn-primary" disabled={submitting} style={{ marginTop: 'var(--space-2)' }}>
            {submitting ? 'Please wait…' : 'Sign in'}
          </button>
        </form>

        <div style={styles.demoBox}>
          <div style={styles.demoHint}>
            Accounts are created by your admin. If you don't have a login yet, or forgot your password, contact your administrator.
          </div>
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
  demoHint: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-ink-faint)',
  },
};
