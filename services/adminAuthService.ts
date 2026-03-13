import { AdminUser } from '../types';

const USERS_KEY    = 'clinic_admin_users';
const SESSION_KEY  = 'clinic_admin_session';

// ── Seed default master user if none exist ─────────────────────────────────
const DEFAULT_MASTER: AdminUser = {
  id: 'admin-default',
  name: 'Administrador',
  username: 'admin',
  password: 'admin123',
  role: 'master',
  createdAt: new Date().toISOString(),
};

export const getAdminUsers = (): AdminUser[] => {
  const stored = localStorage.getItem(USERS_KEY);
  if (!stored) {
    const defaults = [DEFAULT_MASTER];
    localStorage.setItem(USERS_KEY, JSON.stringify(defaults));
    return defaults;
  }
  return JSON.parse(stored);
};

export const saveAdminUsers = (users: AdminUser[]): void => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

// ── Auth ───────────────────────────────────────────────────────────────────
export const adminLogin = (username: string, password: string): AdminUser | null => {
  const users = getAdminUsers();
  return users.find(u => u.username === username && u.password === password) ?? null;
};

// ── Session (sessionStorage — limpo ao fechar a aba) ──────────────────────
export const getAdminSession = (): AdminUser | null => {
  const s = sessionStorage.getItem(SESSION_KEY);
  return s ? JSON.parse(s) : null;
};

export const setAdminSession = (user: AdminUser): void => {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
};

export const clearAdminSession = (): void => {
  sessionStorage.removeItem(SESSION_KEY);
};
