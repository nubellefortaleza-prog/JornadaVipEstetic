import React, { useState, useEffect } from 'react';
import { AdminUser } from '../types';
import {
  isFirstSetup,
  createFirstAdmin,
  adminLoginAsync,
  setAdminSession,
  checkRateLimit,
} from '../services/adminAuthService';
import { validateAdminCredentials } from '../services/validation';

interface Props {
  onSuccess: (user: AdminUser) => void;
  onBack: () => void;
}

const AdminLoginView: React.FC<Props> = ({ onSuccess, onBack }) => {
  const [isSetup, setIsSetup] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsSetup(isFirstSetup());
  }, []);

  // ── Login normal ──────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const limit = checkRateLimit();
    if (limit.locked) {
      setError(`Muitas tentativas. Tente novamente em ${limit.remainingMinutes} minutos.`);
      return;
    }

    setLoading(true);
    try {
      const user = await adminLoginAsync(username.trim(), password);
      if (user) {
        setAdminSession(user);
        onSuccess(user);
      } else {
        setError('Usuário ou senha inválidos.');
      }
    } catch {
      setError('Erro ao autenticar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // ── Wizard de primeiro acesso ─────────────────────────────────────────────
  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    const validationErrors = validateAdminCredentials(username.trim(), password);
    if (validationErrors.length > 0) {
      setError(validationErrors.map(e => e.message).join(' '));
      return;
    }

    if (!name.trim() || name.trim().length < 2) {
      setError('Informe seu nome completo.');
      return;
    }

    setLoading(true);
    try {
      const user = await createFirstAdmin(name.trim(), username.trim(), password);
      setAdminSession(user);
      onSuccess(user);
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta.');
    } finally {
      setLoading(false);
    }
  };

  // ── Render: Wizard de primeiro acesso ─────────────────────────────────────
  if (isSetup) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 space-y-8">
        <div className="text-center">
          <div className="text-3xl tracking-[0.4em] font-serif uppercase sage-green mb-2">VIP ESTETIC</div>
          <p className="text-xs text-white/60 uppercase tracking-widest mb-1">Primeiro Acesso</p>
          <p className="text-[11px] text-white/40 max-w-[280px] mx-auto leading-relaxed">
            Crie sua conta de administrador master para gerenciar a clínica.
          </p>
        </div>

        <form onSubmit={handleSetup} className="w-full space-y-3">
          <input
            type="text"
            placeholder="Nome completo"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-white/5 border border-white/15 rounded-2xl px-5 py-4 text-sm outline-none focus:border-sage transition-colors"
          />
          <input
            type="text"
            autoComplete="username"
            placeholder="Usuário"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="w-full bg-white/5 border border-white/15 rounded-2xl px-5 py-4 text-sm outline-none focus:border-sage transition-colors"
          />
          <input
            type="password"
            autoComplete="new-password"
            placeholder="Senha (min. 8 caracteres, A-z, 0-9)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-white/5 border border-white/15 rounded-2xl px-5 py-4 text-sm outline-none focus:border-sage transition-colors"
          />
          <input
            type="password"
            autoComplete="new-password"
            placeholder="Confirmar senha"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            className="w-full bg-white/5 border border-white/15 rounded-2xl px-5 py-4 text-sm outline-none focus:border-sage transition-colors"
          />

          {error && (
            <p className="text-[11px] text-red-400 text-center pt-1">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !name || !username || !password || !confirmPassword}
            className="w-full py-4 bg-sage text-[#1A1A1B] font-bold rounded-2xl text-sm disabled:opacity-40 transition-all active:scale-95"
          >
            {loading ? 'Criando conta...' : 'Criar Conta Admin'}
          </button>
        </form>

        <button onClick={onBack} className="text-[11px] text-white/50 hover:text-white/60 transition-colors uppercase tracking-widest">
          Voltar
        </button>
      </div>
    );
  }

  // ── Render: Login normal ──────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center justify-center flex-1 space-y-10">
      <div className="text-center">
        <div className="text-3xl tracking-[0.4em] font-serif uppercase sage-green mb-2">VIP ESTETIC</div>
        <p className="text-xs text-white/60 uppercase tracking-widest">Acesso Clínico</p>
      </div>

      <form onSubmit={handleLogin} className="w-full space-y-3">
        <div>
          <input
            type="text"
            autoComplete="username"
            placeholder="Usuário"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="w-full bg-white/5 border border-white/15 rounded-2xl px-5 py-4 text-sm outline-none focus:border-sage transition-colors"
          />
        </div>
        <div>
          <input
            type="password"
            autoComplete="current-password"
            placeholder="Senha"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-white/5 border border-white/15 rounded-2xl px-5 py-4 text-sm outline-none focus:border-sage transition-colors"
          />
        </div>

        {error && (
          <p className="text-[11px] text-red-400 text-center pt-1">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !username || !password}
          className="w-full py-4 bg-sage text-[#1A1A1B] font-bold rounded-2xl text-sm disabled:opacity-40 transition-all active:scale-95"
        >
          {loading ? 'Verificando...' : 'Entrar'}
        </button>
      </form>

      <button onClick={onBack} className="text-[11px] text-white/50 hover:text-white/60 transition-colors uppercase tracking-widest">
        Voltar
      </button>
    </div>
  );
};

export default AdminLoginView;
