import React, { useState, useEffect } from 'react';
import { AdminUser } from '../types';
import {
  adminLoginAsync,
  isFirstSetup,
  createFirstAdmin,
  setAdminSession,
  checkRateLimit,
} from '../services/adminAuthService';

interface Props {
  onSuccess: (user: AdminUser) => void;
  onBack: () => void;
}

const AdminLoginView: React.FC<Props> = ({ onSuccess, onBack }) => {
  const [firstSetup, setFirstSetup] = useState(false);
  const [name, setName]         = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    setFirstSetup(isFirstSetup());
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const limit = checkRateLimit();
    if (limit.locked) {
      setError(`Muitas tentativas. Aguarde ${limit.remainingMinutes} min.`);
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
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }
    if (password.length < 8) {
      setError('Senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      setError('Senha deve ter maiúsculas, minúsculas e números.');
      return;
    }

    setLoading(true);
    try {
      const user = await createFirstAdmin(name.trim(), username.trim(), password);
      setAdminSession(user);
      onSuccess(user);
    } catch (err: any) {
      setError(err.message || 'Erro ao criar administrador.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center flex-1 space-y-10">
      <div className="text-center">
        <div className="text-3xl tracking-[0.4em] font-serif uppercase sage-green mb-2">VIP ESTETIC</div>
        <p className="text-xs text-white/60 uppercase tracking-widest">
          {firstSetup ? 'Configuração Inicial' : 'Acesso Clínico'}
        </p>
      </div>

      {firstSetup ? (
        <form onSubmit={handleSetup} className="w-full space-y-3">
          <p className="text-[11px] text-white/50 text-center pb-1">
            Crie o primeiro acesso de administrador
          </p>
          <input
            type="text"
            placeholder="Seu nome completo"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="w-full bg-white/5 border border-white/15 rounded-2xl px-5 py-4 text-sm outline-none focus:border-sage transition-colors"
          />
          <input
            type="text"
            autoComplete="username"
            placeholder="Nome de usuário"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            className="w-full bg-white/5 border border-white/15 rounded-2xl px-5 py-4 text-sm outline-none focus:border-sage transition-colors"
          />
          <input
            type="password"
            autoComplete="new-password"
            placeholder="Senha (mín. 8 caracteres)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full bg-white/5 border border-white/15 rounded-2xl px-5 py-4 text-sm outline-none focus:border-sage transition-colors"
          />
          <input
            type="password"
            autoComplete="new-password"
            placeholder="Confirmar senha"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            required
            className="w-full bg-white/5 border border-white/15 rounded-2xl px-5 py-4 text-sm outline-none focus:border-sage transition-colors"
          />

          {error && <p className="text-[11px] text-red-400 text-center pt-1">{error}</p>}

          <button
            type="submit"
            disabled={loading || !name || !username || !password || !confirm}
            className="w-full py-4 bg-sage text-[#1A1A1B] font-bold rounded-2xl text-sm disabled:opacity-40 transition-all active:scale-95"
          >
            {loading ? 'Criando...' : 'Criar Administrador'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleLogin} className="w-full space-y-3">
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
            autoComplete="current-password"
            placeholder="Senha"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-white/5 border border-white/15 rounded-2xl px-5 py-4 text-sm outline-none focus:border-sage transition-colors"
          />

          {error && <p className="text-[11px] text-red-400 text-center pt-1">{error}</p>}

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="w-full py-4 bg-sage text-[#1A1A1B] font-bold rounded-2xl text-sm disabled:opacity-40 transition-all active:scale-95"
          >
            {loading ? 'Verificando...' : 'Entrar'}
          </button>
        </form>
      )}

      <button onClick={onBack} className="text-[11px] text-white/50 hover:text-white/60 transition-colors uppercase tracking-widest">
        Voltar
      </button>
    </div>
  );
};

export default AdminLoginView;
