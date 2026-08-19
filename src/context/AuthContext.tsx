import { createContext, useContext, useState, ReactNode } from 'react';
import { User } from '../lib/types';
import { users } from '../lib/mockData';

interface AuthContextValue {
  user: User | null;
  login: (email: string) => { ok: boolean; error?: string };
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  function login(email: string) {
    const match = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!match) return { ok: false, error: 'No account found with that email.' };
    if (match.status !== 'active') return { ok: false, error: 'This account has been deactivated.' };
    setUser(match);
    return { ok: true };
  }

  function logout() {
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
