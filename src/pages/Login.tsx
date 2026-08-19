import { FormEvent, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setInfo('');
    if (!email || !password) {
      setError('Enter your email and password.');
      return;
    }
    if (mode === 'signup' && !name.trim()) {
      setError('Enter your name.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'signin') {
        const result = await login(email, password);
        if (!result.ok) setError(result.error ?? 'Unable to sign in.');
      } else {
        if (password.length < 8) {
          setError('Password must be at least 8 characters.');
          return;
        }
        const result = await signup(email, password, name);
        if (!result.ok) {
          setError(result.error ?? 'Unable to create account.');
        } else if (result.needsConfirmation) {
          setInfo('Account created. Check your email to confirm before signing in.');
          setMode('signin');
        }
      }
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
            <div style={styles.brandSub}>District Activity Reporting</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {mode === 'signup' && (
            <div className="field">
              <label htmlFor="name">Name</label>
              <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" autoFocus />
            </div>
          )}
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@org.in"
              autoFocus={mode === 'signin'}
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>

          {error && <div style={styles.error}>{error}</div>}
          {info && <div style={styles.info}>{info}</div>}

          <button type="submit" className="btn btn-primary" disabled={submitting} style={{ marginTop: 'var(--space-2)' }}>
            {submitting ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div style={styles.demoBox}>
          {mode === 'signin' ? (
            <>
              <div style={styles.demoLabel}>New employee?</div>
              <button className="btn btn-ghost" onClick={() => { setMode('signup'); setError(''); setInfo(''); }} style={{ padding: 0 }}>
                Create an account
              </button>
              <div style={styles.demoHint}>
                New accounts default to the employee role with no district assigned — ask your admin to assign your district.
              </div>
            </>
          ) : (
            <button className="btn btn-ghost" onClick={() => { setMode('signin'); setError(''); setInfo(''); }} style={{ padding: 0 }}>
              Already have an account? Sign in
            </button>
          )}
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
  info: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-positive)',
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
  demoHint: {
    fontSize: 'var(--text-xs)',
    color: 'var(--color-ink-faint)',
    marginTop: 'var(--space-2)',
  },
};
