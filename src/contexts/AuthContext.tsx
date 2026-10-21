import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { authService } from '../services/auth.service';
import { reconnectSocketWithToken } from '../services/socket.service';

export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'OPERATOR' | 'VIEWER';

export interface AuthUser {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: Role;
  avatar: string | null;
}

interface AuthCtx {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  loginOffline: () => void;
  logout: () => Promise<void>;
  hasRole: (minRole: Role) => boolean;
  canControl: () => boolean;       // OPERATOR+
  canManageUsers: () => boolean;   // ADMIN+
  canAdmin: () => boolean;         // SUPER_ADMIN only
}

const ROLE_LEVEL: Record<Role, number> = {
  VIEWER: 1, OPERATOR: 2, ADMIN: 3, SUPER_ADMIN: 4,
};

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Init: restore session from token or auto-login default admin ─────
  useEffect(() => {
    const { accessToken } = authService.getStoredTokens();
    if (!accessToken) {
      authService
        .login('admin', 'Admin@2026')
        .then((res) => {
          setUser(res.user as AuthUser);
          try {
            reconnectSocketWithToken();
          } catch {}
        })
        .catch(() => {})
        .finally(() => setLoading(false));
      return;
    }
    authService
      .me()
      .then((me) => setUser(me))
      .catch(() => {
        authService
          .login('admin', 'Admin@2026')
          .then((res) => setUser(res.user as AuthUser))
          .catch(() => {
            localStorage.removeItem('atk-access-token');
            localStorage.removeItem('atk-refresh-token');
          });
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Listen for forced logout (token expired) ──────────────────────────
  useEffect(() => {
    const handler = () => { setUser(null); };
    window.addEventListener('atk:logout', handler);
    return () => window.removeEventListener('atk:logout', handler);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const result = await authService.login(username, password);
    setUser(result.user as AuthUser);
    try {
      const { reconnectSocketWithToken } = await import('../services/socket.service');
      reconnectSocketWithToken();
    } catch {}
  }, []);

  const loginOffline = useCallback(() => {
    setUser({
      id: 'local-admin',
      username: 'admin',
      fullName: 'Quản trị viên (Cục bộ)',
      email: 'admin@atk.local',
      role: 'SUPER_ADMIN' as Role,
      avatar: null,
    });
  }, []);

  const logout = useCallback(async () => {
    const { refreshToken } = authService.getStoredTokens();
    await authService.logout(refreshToken || '');
    setUser(null);
  }, []);

  const hasRole = useCallback((minRole: Role) => {
    if (!user) return false;
    return ROLE_LEVEL[user.role] >= ROLE_LEVEL[minRole];
  }, [user]);

  const canControl = useCallback(() => hasRole('OPERATOR'), [hasRole]);
  const canManageUsers = useCallback(() => hasRole('ADMIN'), [hasRole]);
  const canAdmin = useCallback(() => hasRole('SUPER_ADMIN'), [hasRole]);

  return (
    <AuthContext.Provider value={{
      user, isAuthenticated: !!user, loading,
      login, loginOffline, logout, hasRole, canControl, canManageUsers, canAdmin,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthCtx {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
