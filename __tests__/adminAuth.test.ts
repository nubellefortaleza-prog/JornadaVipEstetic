import { describe, it, expect, beforeEach } from 'vitest';
import {
  isFirstSetup,
  createFirstAdmin,
  adminLoginAsync,
  hashPassword,
  checkRateLimit,
  setAdminSession,
  getAdminSession,
  clearAdminSession,
  getAdminUsers,
  createAdminUser,
  deleteAdminUser,
} from '../services/adminAuthService';

describe('adminAuthService', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  // ── isFirstSetup ────────────────────────────────────────────────────────

  describe('isFirstSetup', () => {
    it('returns true when no admin users exist', () => {
      expect(isFirstSetup()).toBe(true);
    });

    it('returns false after first admin is created', async () => {
      await createFirstAdmin('Admin', 'admin', 'Senha123a');
      expect(isFirstSetup()).toBe(false);
    });
  });

  // ── createFirstAdmin ──────────────────────────────────────────────────

  describe('createFirstAdmin', () => {
    it('creates admin user successfully', async () => {
      const user = await createFirstAdmin('Admin Master', 'admin', 'Senha123a');
      expect(user.name).toBe('Admin Master');
      expect(user.username).toBe('admin');
      expect(user.role).toBe('master');
      expect(user.password).toBe('********'); // hash not exposed
    });

    it('throws if admin already exists', async () => {
      await createFirstAdmin('Admin', 'admin', 'Senha123a');
      await expect(createFirstAdmin('Admin2', 'admin2', 'Senha456b'))
        .rejects.toThrow('Admin já cadastrado');
    });
  });

  // ── adminLoginAsync ───────────────────────────────────────────────────

  describe('adminLoginAsync', () => {
    beforeEach(async () => {
      await createFirstAdmin('Admin', 'admin', 'Senha123a');
    });

    it('returns user for valid credentials', async () => {
      const user = await adminLoginAsync('admin', 'Senha123a');
      expect(user).not.toBeNull();
      expect(user!.username).toBe('admin');
    });

    it('returns null for wrong password', async () => {
      const user = await adminLoginAsync('admin', 'wrongpass');
      expect(user).toBeNull();
    });

    it('returns null for non-existent user', async () => {
      const user = await adminLoginAsync('nobody', 'Senha123a');
      expect(user).toBeNull();
    });

    it('is case-insensitive for username', async () => {
      const user = await adminLoginAsync('ADMIN', 'Senha123a');
      expect(user).not.toBeNull();
    });
  });

  // ── hashPassword ──────────────────────────────────────────────────────

  describe('hashPassword', () => {
    it('returns consistent hash for same input', async () => {
      const h1 = await hashPassword('test123');
      const h2 = await hashPassword('test123');
      expect(h1).toBe(h2);
    });

    it('returns different hash for different input', async () => {
      const h1 = await hashPassword('test123');
      const h2 = await hashPassword('test456');
      expect(h1).not.toBe(h2);
    });

    it('returns 64-char hex string', async () => {
      const hash = await hashPassword('test');
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });
  });

  // ── Rate Limiting ─────────────────────────────────────────────────────

  describe('checkRateLimit', () => {
    it('is not locked initially', () => {
      expect(checkRateLimit().locked).toBe(false);
    });

    it('locks after 5 failed login attempts', async () => {
      await createFirstAdmin('Admin', 'admin', 'Senha123a');
      for (let i = 0; i < 5; i++) {
        await adminLoginAsync('admin', 'wrong');
      }
      const limit = checkRateLimit();
      expect(limit.locked).toBe(true);
      expect(limit.remainingMinutes).toBeGreaterThan(0);
    });
  });

  // ── Session Management ────────────────────────────────────────────────

  describe('session management', () => {
    it('stores and retrieves session', () => {
      const user = { id: '1', name: 'Admin', username: 'admin', password: '********', role: 'master' as const, createdAt: new Date().toISOString() };
      setAdminSession(user);
      const retrieved = getAdminSession();
      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe('1');
    });

    it('returns null after clearing session', () => {
      const user = { id: '1', name: 'Admin', username: 'admin', password: '********', role: 'master' as const, createdAt: new Date().toISOString() };
      setAdminSession(user);
      clearAdminSession();
      expect(getAdminSession()).toBeNull();
    });
  });

  // ── User Management ───────────────────────────────────────────────────

  describe('user management', () => {
    beforeEach(async () => {
      await createFirstAdmin('Master', 'master', 'Senha123a');
    });

    it('creates additional admin', async () => {
      const user = await createAdminUser('Colab', 'colab', 'Senha456b', 'colaborador');
      expect(user.role).toBe('colaborador');
      expect(getAdminUsers().length).toBe(2);
    });

    it('rejects duplicate username', async () => {
      await expect(createAdminUser('Dup', 'master', 'Senha456b'))
        .rejects.toThrow('Username já existe');
    });

    it('can list created admin users', async () => {
      const colab = await createAdminUser('Colab', 'colab', 'Senha456b', 'colaborador');
      const users = getAdminUsers();
      expect(users.length).toBe(2);
      expect(users.some(u => u.id === colab.id)).toBe(true);
    });

    it('prevents deleting last master', async () => {
      const users = getAdminUsers();
      const master = users.find(u => u.role === 'master')!;
      expect(deleteAdminUser(master.id)).toBe(false);
    });
  });
});
