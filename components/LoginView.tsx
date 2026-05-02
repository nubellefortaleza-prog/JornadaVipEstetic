// ─────────────────────────────────────────────────────────────────────────────
// LoginView.tsx — Tela de login com Google, Apple e Email/Senha
//
// Fluxos:
//   1. Login Google/Apple OAuth → busca por email → DASHBOARD ou vinculação
//   2. Login Email/Senha → autentica → DASHBOARD
//   3. Primeiro Acesso → cadastra nome/telefone/email/senha → DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { OAuthResult } from '../services/oauthService';
import { isValidCPF } from '../services/validation';
import { CONFIG, apiUrl } from '../services/config';

type LoginStep = 'initial' | 'loading' | 'email-login' | 'register' | 'not-found' | 'link-cpf' | 'error';

interface Props {
  onOAuthLogin: (oauthData: OAuthResult) => Promise<{ found: boolean; error?: string }>;
  onLinkCpf: (cpf: string, oauthData: OAuthResult) => Promise<{ found: boolean; error?: string }>;
  onNewPatient: (oauthData: OAuthResult) => void;
  onEmailLogin: (patient: any) => void;
  onAdminLogin: () => void;
}

const LoginView: React.FC<Props> = ({ onOAuthLogin, onLinkCpf, onNewPatient, onEmailLogin, onAdminLogin }) => {
  const [loginStep, setLoginStep] = useState<LoginStep>('initial');
  const [oauthData, setOauthData] = useState<OAuthResult | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Email/senha fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Registro fields
  const [regNome, setRegNome] = useState('');
  const [regTelefone, setRegTelefone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');

  // CPF link
  const [cpf, setCpf] = useState('');
  const [cpfError, setCpfError] = useState('');
  const [isLinking, setIsLinking] = useState(false);

  const inputClass = 'w-full bg-white/5 border border-white/15 rounded-2xl px-5 py-4 text-sm outline-none focus:border-[#AABAA4]/50 transition-colors';

  // ── Máscara telefone ──────────────────────────────────────────────────────
  const formatPhone = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 2) return d;
    if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  };

  const formatCpf = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
    if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  };

  // ── API helpers ───────────────────────────────────────────────────────────
  const apiFetch = async (path: string, body: any) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Clinic-ID': CONFIG.CLINIC_ID,
    };
    if (CONFIG.API_KEY) headers['x-api-key'] = CONFIG.API_KEY;

    const res = await fetch(apiUrl(path), { method: 'POST', headers, body: JSON.stringify(body) });
    return res.json();
  };

  // ── Handler: OAuth ────────────────────────────────────────────────────────
  const handleOAuth = async (provider: 'google' | 'apple') => {
    setLoginStep('loading');
    setErrorMessage('');
    try {
      let result: OAuthResult;
      if (provider === 'google') {
        const { loginWithGoogle } = await import('../services/oauthService');
        result = await loginWithGoogle();
      } else {
        const { loginWithApple } = await import('../services/oauthService');
        result = await loginWithApple();
      }
      setOauthData(result);
      const response = await onOAuthLogin(result);
      if (response.found) return;
      setLoginStep('not-found');
    } catch (err: any) {
      if (err.message?.includes('cancelado') || err.message?.includes('popup_closed')) {
        setLoginStep('initial');
        return;
      }
      setErrorMessage(err.message || 'Erro ao fazer login.');
      setLoginStep('error');
    }
  };

  // ── Handler: Email/Senha login ────────────────────────────────────────────
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const data = await apiFetch('/api/jornada/auth/email-login', { email, password });
      if (data.found && data.patient) {
        // Salvar tokens
        if (data.accessToken) {
          localStorage.setItem(CONFIG.AUTH_TOKEN_KEY, data.accessToken);
          if (data.refreshToken) localStorage.setItem(CONFIG.AUTH_REFRESH_KEY, data.refreshToken);
        }
        onEmailLogin(data.patient);
      } else {
        setErrorMessage(data.error || 'Email ou senha incorretos.');
      }
    } catch {
      setErrorMessage('Erro de conexao com o servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Handler: Registro ─────────────────────────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regNome || !regEmail || !regPassword) return;
    if (regPassword !== regConfirm) { setErrorMessage('As senhas nao coincidem.'); return; }
    if (regPassword.length < 6) { setErrorMessage('Senha deve ter no minimo 6 caracteres.'); return; }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const data = await apiFetch('/api/jornada/auth/register', {
        nome: regNome,
        telefone: regTelefone.replace(/\D/g, ''),
        email: regEmail,
        password: regPassword,
      });

      if (data.found && data.patient) {
        if (data.accessToken) {
          localStorage.setItem(CONFIG.AUTH_TOKEN_KEY, data.accessToken);
          if (data.refreshToken) localStorage.setItem(CONFIG.AUTH_REFRESH_KEY, data.refreshToken);
        }
        onEmailLogin(data.patient);
      } else {
        setErrorMessage(data.error || 'Erro ao criar conta.');
      }
    } catch {
      setErrorMessage('Erro de conexao com o servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Handler: Vincular CPF ─────────────────────────────────────────────────
  const handleLinkCpf = async () => {
    const raw = cpf.replace(/\D/g, '');
    if (!isValidCPF(raw)) { setCpfError('CPF invalido.'); return; }
    setCpfError('');
    setIsLinking(true);
    try {
      const response = await onLinkCpf(raw, oauthData!);
      if (!response.found) setCpfError(response.error || 'CPF nao encontrado.');
    } catch { setCpfError('Erro ao verificar CPF.'); }
    finally { setIsLinking(false); }
  };

  // ── Render: Loading ───────────────────────────────────────────────────────
  if (loginStep === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center flex-1 space-y-6">
        <div className="w-12 h-12 border-2 border-[#AABAA4] border-t-transparent rounded-full animate-spin" />
        <p className="text-white/60 text-sm">Verificando sua conta...</p>
      </div>
    );
  }

  // ── Render: Email Login ───────────────────────────────────────────────────
  if (loginStep === 'email-login') {
    return (
      <div className="flex flex-col items-center justify-center flex-1 space-y-8">
        <div className="text-center">
          <div className="text-2xl tracking-[0.4em] font-serif uppercase text-[#AABAA4] mb-2">VIP ESTETIC</div>
          <p className="text-xs text-white/60">Entrar com email e senha</p>
        </div>

        <form onSubmit={handleEmailLogin} className="w-full space-y-3">
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
            className={inputClass} autoComplete="email" autoFocus />
          <input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)}
            className={inputClass} autoComplete="current-password" />
          {errorMessage && <p className="text-red-400 text-xs text-center">{errorMessage}</p>}
          <button type="submit" disabled={isSubmitting || !email || !password}
            className="w-full py-4 bg-[#AABAA4] text-[#1A1A1B] font-medium rounded-2xl disabled:opacity-40 transition-all active:scale-95">
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <button onClick={() => { setLoginStep('initial'); setErrorMessage(''); }}
          className="text-xs text-white/40 hover:text-white/60">Voltar</button>
      </div>
    );
  }

  // ── Render: Registro (Primeiro Acesso) ────────────────────────────────────
  if (loginStep === 'register') {
    return (
      <div className="flex flex-col items-center justify-center flex-1 space-y-6">
        <div className="text-center">
          <div className="text-2xl tracking-[0.4em] font-serif uppercase text-[#AABAA4] mb-2">VIP ESTETIC</div>
          <p className="text-xs text-white/60">Primeiro acesso</p>
        </div>

        <form onSubmit={handleRegister} className="w-full space-y-3">
          <input placeholder="Nome completo *" value={regNome} onChange={e => setRegNome(e.target.value)}
            className={inputClass} autoFocus />
          <input placeholder="Telefone (WhatsApp)" value={regTelefone}
            onChange={e => setRegTelefone(formatPhone(e.target.value))}
            className={inputClass} inputMode="tel" />
          <input type="email" placeholder="Email *" value={regEmail} onChange={e => setRegEmail(e.target.value)}
            className={inputClass} autoComplete="email" />
          <input type="password" placeholder="Criar senha (min. 6 caracteres) *" value={regPassword}
            onChange={e => setRegPassword(e.target.value)} className={inputClass} autoComplete="new-password" />
          <input type="password" placeholder="Confirmar senha *" value={regConfirm}
            onChange={e => setRegConfirm(e.target.value)} className={inputClass} autoComplete="new-password" />

          {errorMessage && <p className="text-red-400 text-xs text-center">{errorMessage}</p>}

          <button type="submit" disabled={isSubmitting || !regNome || !regEmail || !regPassword || !regConfirm}
            className="w-full py-4 bg-[#AABAA4] text-[#1A1A1B] font-medium rounded-2xl disabled:opacity-40 transition-all active:scale-95">
            {isSubmitting ? 'Criando conta...' : 'Criar Conta'}
          </button>
        </form>

        <button onClick={() => { setLoginStep('initial'); setErrorMessage(''); }}
          className="text-xs text-white/40 hover:text-white/60">Voltar</button>
      </div>
    );
  }

  // ── Render: Not found (OAuth) ─────────────────────────────────────────────
  if (loginStep === 'not-found') {
    return (
      <div className="flex flex-col items-center justify-center flex-1 space-y-8">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto bg-[#AABAA4]/20 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#AABAA4]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-lg font-medium text-white">Ola, {oauthData?.name?.split(' ')[0]}!</h2>
          <p className="text-white/60 text-sm max-w-[280px]">
            Nao encontramos seu cadastro com <span className="text-[#AABAA4]">{oauthData?.email}</span>. Voce ja e paciente?
          </p>
        </div>
        <div className="w-full space-y-3">
          <button onClick={() => setLoginStep('link-cpf')}
            className="w-full py-4 bg-[#AABAA4] text-[#1A1A1B] rounded-2xl font-medium active:scale-95">
            Sim, ja sou paciente
          </button>
          <button onClick={() => onNewPatient(oauthData!)}
            className="w-full py-4 bg-white/5 border border-white/15 rounded-2xl font-medium active:scale-95">
            Sou paciente novo
          </button>
        </div>
        <button onClick={() => { setLoginStep('initial'); setOauthData(null); }}
          className="text-xs text-white/40 hover:text-white/60">Voltar</button>
      </div>
    );
  }

  // ── Render: Link CPF ──────────────────────────────────────────────────────
  if (loginStep === 'link-cpf') {
    return (
      <div className="flex flex-col items-center justify-center flex-1 space-y-8">
        <div className="text-center space-y-3">
          <h2 className="text-lg font-medium text-white">Vincular sua conta</h2>
          <p className="text-white/60 text-sm max-w-[280px]">Informe o CPF cadastrado na clinica.</p>
        </div>
        <div className="w-full space-y-4">
          <input type="text" inputMode="numeric" value={cpf}
            onChange={e => { setCpf(formatCpf(e.target.value)); setCpfError(''); }}
            onKeyDown={e => { if (e.key === 'Enter') handleLinkCpf(); }}
            placeholder="000.000.000-00" autoFocus maxLength={14}
            className={`${inputClass} text-center text-lg tracking-widest`} />
          {cpfError && <p className="text-red-400 text-xs text-center">{cpfError}</p>}
          <button onClick={handleLinkCpf} disabled={cpf.replace(/\D/g, '').length < 11 || isLinking}
            className="w-full py-4 bg-[#AABAA4] text-[#1A1A1B] rounded-2xl font-medium disabled:opacity-40 active:scale-95">
            {isLinking ? 'Verificando...' : 'Vincular conta'}
          </button>
        </div>
        <button onClick={() => setLoginStep('not-found')} className="text-xs text-white/40 hover:text-white/60">Voltar</button>
      </div>
    );
  }

  // ── Render: Initial (tela principal) ──────────────────────────────────────
  return (
    <div className="flex flex-col items-center justify-center flex-1 space-y-10">
      <div className="text-center">
        <div className="mb-6 flex justify-center">
          <div className="text-3xl tracking-[0.4em] font-serif uppercase sage-green">VIP ESTETIC</div>
        </div>
        <h1 className="text-xl font-light tracking-wide text-white/90">Bem-vindo a sua Jornada VIP</h1>
      </div>

      <div className="w-full space-y-3">
        {/* Google */}
        <button onClick={() => handleOAuth('google')}
          className="w-full py-4 bg-white/5 border border-white/15 rounded-2xl flex items-center justify-center space-x-3 hover:bg-white/10 transition-all active:scale-95">
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          <span className="text-sm font-medium">Continuar com Google</span>
        </button>

        {/* Apple */}
        <button onClick={() => handleOAuth('apple')}
          className="w-full py-4 bg-white/5 border border-white/15 rounded-2xl flex items-center justify-center space-x-3 hover:bg-white/10 transition-all active:scale-95">
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.67-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.67.805-3.54 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.568-1.702z" />
          </svg>
          <span className="text-sm font-medium">Continuar com Apple</span>
        </button>

        {/* Divisor */}
        <div className="flex items-center gap-3 py-2">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-[10px] text-white/30 uppercase tracking-wider">ou</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Email/Senha */}
        <button onClick={() => { setLoginStep('email-login'); setErrorMessage(''); }}
          className="w-full py-4 bg-white/5 border border-white/15 rounded-2xl flex items-center justify-center space-x-3 hover:bg-white/10 transition-all active:scale-95">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span className="text-sm font-medium">Entrar com email e senha</span>
        </button>

        {/* Primeiro Acesso */}
        <button onClick={() => { setLoginStep('register'); setErrorMessage(''); }}
          className="w-full py-3 text-[#AABAA4] text-sm font-medium hover:underline transition-all">
          Primeiro acesso? Criar conta
        </button>

        {loginStep === 'error' && errorMessage && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
            <p className="text-red-400 text-sm">{errorMessage}</p>
          </div>
        )}

        <div className="pt-6 flex justify-center">
          <button onClick={onAdminLogin}
            className="text-[11px] uppercase tracking-[0.3em] text-white/50 hover:text-sage transition-colors">
            Acesso Clinico
          </button>
        </div>
      </div>

      <p className="text-[11px] text-center text-white/60 max-w-[200px] leading-relaxed">
        Ao continuar, voce concorda com nossos Termos de Uso e Politica de Privacidade.
      </p>
    </div>
  );
};

export default LoginView;
