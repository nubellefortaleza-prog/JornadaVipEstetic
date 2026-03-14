import React, { useState } from 'react';
import { AdminUser } from '../types';
import { adminLogin, setAdminSession } from '../services/adminAuthService';

interface Props {
  onSuccess: (user: AdminUser) => void;
  onBack: () => void;
}

const AdminLoginView: React.FC<Props> = ({ onSuccess, onBack }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Small timeout for visual feedback
    setTimeout(() => {
      const user = adminLogin(username.trim(), password);
      if (user) {
        setAdminSession(user);
        onSuccess(user);
      } else {
        setError('Usuário ou senha inválidos.');
      }
      setLoading(false);
    }, 400);
  };

  return (
    <div className="flex flex-col items-center justify-center flex-1 space-y-10">
      <div className="text-center">
        <div className="text-3xl tracking-[0.4em] font-serif uppercase sage-green mb-2">VIP ESTETIC</div>
        <p className="text-xs text-white/40 uppercase tracking-widest">Acesso Clínico</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full space-y-3">
        <div>
          <input
            type="text"
            autoComplete="username"
            placeholder="Usuário"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none focus:border-sage transition-colors"
          />
        </div>
        <div>
          <input
            type="password"
            autoComplete="current-password"
            placeholder="Senha"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm outline-none focus:border-sage transition-colors"
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

      <button onClick={onBack} className="text-[10px] text-white/30 hover:text-white/60 transition-colors uppercase tracking-widest">
        Voltar
      </button>
    </div>
  );
};

export default AdminLoginView;
