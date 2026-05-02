// ─────────────────────────────────────────────────────────────────────────────
// MasterAdminView.tsx — Painel do Admin Master e Admin de Estabelecimento
//
// Rota: /admin_m_m
//
// Fluxo:
//   1. Verifica se existe master → se não, mostra wizard de setup
//   2. Se existe, mostra login
//   3. Após login → dashboard com gestão de estabelecimentos e admins
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback } from 'react';
import * as masterApi from '../services/masterAdminService';
import type { MasterAdmin, Estabelecimento, EstabAdmin, PacienteResumo } from '../services/masterAdminService';
import AdminPatientProfile from './AdminPatientProfile';

type ViewState = 'loading' | 'setup' | 'login' | 'dashboard';
type DashTab = 'dashboard' | 'pacientes' | 'estabelecimentos' | 'admins';

const MasterAdminView: React.FC = () => {
  const [view, setView] = useState<ViewState>('loading');
  const [admin, setAdmin] = useState<MasterAdmin | null>(null);
  const [estabelecimentos, setEstabelecimentos] = useState<Estabelecimento[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ── Login fields ───────────────────────────────────────────────────────────
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // ── Dashboard ─────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<DashTab>('dashboard');
  const [selectedEstab, setSelectedEstab] = useState<Estabelecimento | null>(null);
  const [estabAdmins, setEstabAdmins] = useState<EstabAdmin[]>([]);

  // ── Dashboard data ────────────────────────────────────────────────────────
  const [dashData, setDashData] = useState<any>(null);
  const [dashLoading, setDashLoading] = useState(false);
  const [dashEstabId, setDashEstabId] = useState<string>('');
  const [dashFrom, setDashFrom] = useState(() => new Date().toISOString().split('T')[0]);
  const [dashTo, setDashTo] = useState(() => new Date().toISOString().split('T')[0]);

  // ── Pacientes ─────────────────────────────────────────────────────────────
  const [pacientes, setPacientes] = useState<PacienteResumo[]>([]);
  const [pacientesEstabId, setPacientesEstabId] = useState('');
  const [pacientesLoading, setPacientesLoading] = useState(false);
  const [selectedPacienteId, setSelectedPacienteId] = useState<string | null>(null);

  // ── Formulários ───────────────────────────────────────────────────────────
  const [showEstabForm, setShowEstabForm] = useState(false);
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [fNome, setFNome] = useState('');
  const [fEmail, setFEmail] = useState('');
  const [fPassword, setFPassword] = useState('');
  const [fCnpj, setFCnpj] = useState('');
  const [fTelefone, setFTelefone] = useState('');
  const [fCidade, setFCidade] = useState('');
  const [fEstado, setFEstado] = useState('');
  const [fJornadaAtivo, setFJornadaAtivo] = useState(true);
  const [fCrmIntegrado, setFCrmIntegrado] = useState(false);

  // ── Init ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    // Master só é criado via servidor — sempre mostra login
    setView('login');
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await masterApi.adminLogin(email, password);
    setLoading(false);

    if (result.success && result.admin) {
      setAdmin(result.admin);
      setEstabelecimentos(result.estabelecimentos || []);
      setView('dashboard');
    } else {
      setError(result.error || 'Email ou senha inválidos.');
    }
  };

  const handleLogout = () => {
    masterApi.adminLogout();
    setAdmin(null);
    setView('login');
    setEmail('');
    setPassword('');
  };

  const loadEstabDetails = useCallback(async (estab: Estabelecimento) => {
    setSelectedEstab(estab);
    const data = await masterApi.getEstabelecimento(estab.id);
    if (data) {
      setEstabAdmins(data.admins);
    }
  }, []);

  const handleCreateEstab = async () => {
    setError('');
    if (!fNome) { setError('Nome é obrigatório.'); return; }
    setLoading(true);

    const result = await masterApi.createEstabelecimento({
      nome: fNome,
      cnpj: fCnpj || undefined,
      telefone: fTelefone || undefined,
      cidade: fCidade || undefined,
      estado: fEstado || undefined,
      jornadaAtivo: fJornadaAtivo,
      crmIntegrado: fCrmIntegrado,
    });

    setLoading(false);
    if (result.success && result.estabelecimento) {
      setEstabelecimentos(prev => [...prev, result.estabelecimento!]);
      setShowEstabForm(false);
      clearEstabForm();
    } else {
      setError(result.error || 'Erro ao criar.');
    }
  };

  const handleToggleEstab = async (estab: Estabelecimento, field: 'jornadaAtivo' | 'crmIntegrado' | 'ativo') => {
    const updates: any = {};
    updates[field] = !(estab as any)[field === 'jornadaAtivo' ? 'jornada_ativo' : field === 'crmIntegrado' ? 'crm_integrado' : 'ativo'];
    await masterApi.updateEstabelecimento(estab.id, updates);
    setEstabelecimentos(prev => prev.map(e =>
      e.id === estab.id
        ? { ...e, [field === 'jornadaAtivo' ? 'jornada_ativo' : field === 'crmIntegrado' ? 'crm_integrado' : 'ativo']: updates[field] }
        : e
    ));
  };

  const handleCreateAdmin = async () => {
    setError('');
    if (!fNome || !fEmail || !fPassword || !selectedEstab) {
      setError('Preencha todos os campos.'); return;
    }
    if (fPassword.length < 8) { setError('Senha mínima 8 caracteres.'); return; }

    setLoading(true);
    const result = await masterApi.createAdmin({
      nome: fNome,
      email: fEmail,
      password: fPassword,
      estabelecimentoId: selectedEstab.id,
    });
    setLoading(false);

    if (result.success && result.admin) {
      setEstabAdmins(prev => [...prev, result.admin!]);
      setShowAdminForm(false);
      clearAdminForm();
    } else {
      setError(result.error || 'Erro ao criar admin.');
    }
  };

  const handleDeleteAdmin = async (adminId: string) => {
    await masterApi.deleteAdmin(adminId);
    setEstabAdmins(prev => prev.map(a => a.id === adminId ? { ...a, ativo: false } : a));
  };

  const loadPacientes = useCallback(async (estabId: string) => {
    setPacientesLoading(true);
    const result = await masterApi.getPacientes(estabId);
    setPacientes(result);
    setPacientesLoading(false);
  }, []);

  const clearEstabForm = () => { setFNome(''); setFCnpj(''); setFTelefone(''); setFCidade(''); setFEstado(''); setFJornadaAtivo(true); setFCrmIntegrado(false); };
  const clearAdminForm = () => { setFNome(''); setFEmail(''); setFPassword(''); };

  // ── Dashboard fetch ───────────────────────────────────────────────────────
  const loadDashboard = useCallback(async (estabId: string, from?: string, to?: string) => {
    if (!estabId) return;
    setDashLoading(true);
    try {
      const token = masterApi.getAdminToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      };
      const apiKey = (await import('../services/config')).CONFIG.API_KEY;
      if (apiKey) headers['x-api-key'] = apiKey;

      const fromDate = from ? `${from}T00:00:00.000Z` : `${dashFrom}T00:00:00.000Z`;
      const toDate = to ? `${to}T23:59:59.999Z` : `${dashTo}T23:59:59.999Z`;
      const baseUrl = (await import('../services/config')).apiUrl;

      const res = await fetch(baseUrl(`/api/jornada/admin/dashboard?estabelecimento_id=${estabId}&from=${fromDate}&to=${toDate}`), { headers });
      if (res.ok) {
        const data = await res.json();
        setDashData(data);
      }
    } catch (err) {
      console.error('Erro dashboard:', err);
    } finally {
      setDashLoading(false);
    }
  }, [dashFrom, dashTo]);

  // ── Styles ────────────────────────────────────────────────────────────────

  const inputClass = 'w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#AABAA4]/50 transition-colors';
  const btnPrimary = 'py-3 px-6 bg-[#AABAA4] text-[#1A1A1B] font-medium rounded-xl hover:bg-[#AABAA4]/90 transition-all active:scale-95 disabled:opacity-40 text-sm';
  const btnSecondary = 'py-3 px-6 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition-all active:scale-95 text-sm';

  // ── Render: Loading ───────────────────────────────────────────────────────

  if (view === 'loading') {
    return (
      <div className="min-h-screen bg-[#1A1A1B] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#AABAA4] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Render: Login ─────────────────────────────────────────────────────────

  if (view === 'login') {
    return (
      <div className="min-h-screen bg-[#1A1A1B] flex items-center justify-center px-6">
        <div className="max-w-sm w-full space-y-10">
          <div className="text-center">
            <div className="text-2xl tracking-[0.4em] font-serif uppercase text-[#AABAA4] mb-2">VIP ESTETIC</div>
            <p className="text-xs text-white/60 uppercase tracking-widest">Painel Administrativo</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-3">
            <input placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} autoComplete="email" />
            <input placeholder="Senha" type="password" value={password} onChange={e => setPassword(e.target.value)} className={inputClass} autoComplete="current-password" />
            {error && <p className="text-red-400 text-xs text-center">{error}</p>}
            <button type="submit" disabled={loading || !email || !password} className={`${btnPrimary} w-full`}>
              {loading ? 'Verificando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Render: Dashboard ─────────────────────────────────────────────────────

  const isMaster = admin?.role === 'master';

  return (
    <div className="min-h-screen bg-[#1A1A1B] text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div>
          <span className="text-sm tracking-[0.3em] font-serif uppercase text-[#AABAA4]">VIP ESTETIC</span>
          <span className="text-[10px] text-white/40 ml-3 uppercase tracking-wider">
            {isMaster ? 'Admin Master' : 'Admin'}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-white/50">{admin?.email}</span>
          <button onClick={handleLogout} className="text-xs text-white/40 hover:text-red-400 transition-colors">
            Sair
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Tabs */}
        {isMaster && (
          <div className="flex gap-1 mb-8 bg-white/5 rounded-xl p-1 w-fit">
            {(['dashboard', 'pacientes', 'estabelecimentos', 'admins'] as DashTab[]).map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setSelectedEstab(null); setSelectedPacienteId(null); }}
                className={`px-4 py-2 rounded-lg text-sm transition-all ${activeTab === tab ? 'bg-[#AABAA4] text-[#1A1A1B] font-medium' : 'text-white/60 hover:text-white'}`}
              >
                {{ dashboard: 'Dashboard', pacientes: 'Pacientes', estabelecimentos: 'Estabelecimentos', admins: 'Admins' }[tab]}
              </button>
            ))}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {error}
            <button onClick={() => setError('')} className="ml-2 underline text-xs">fechar</button>
          </div>
        )}

        {/* ── Tab: Dashboard ──────────────────────────────────────────── */}
        {activeTab === 'dashboard' && (
          <div>
            <h2 className="text-lg font-medium mb-6">Dashboard</h2>

            {/* Filtros */}
            <div className="flex flex-wrap gap-3 mb-6 items-end">
              <div>
                <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-1">Estabelecimento</label>
                <select
                  value={dashEstabId}
                  onChange={(e) => { setDashEstabId(e.target.value); if (e.target.value) loadDashboard(e.target.value); }}
                  className="bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm outline-none text-white min-w-[200px]"
                >
                  <option value="" className="bg-[#1A1A1B]">Selecione...</option>
                  {estabelecimentos.map(e => (
                    <option key={e.id} value={e.id} className="bg-[#1A1A1B]">{e.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-1">De</label>
                <input type="date" value={dashFrom} onChange={e => setDashFrom(e.target.value)}
                  className="bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm outline-none text-white" />
              </div>
              <div>
                <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-1">Ate</label>
                <input type="date" value={dashTo} onChange={e => setDashTo(e.target.value)}
                  className="bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm outline-none text-white" />
              </div>
              <button
                onClick={() => dashEstabId && loadDashboard(dashEstabId)}
                disabled={!dashEstabId || dashLoading}
                className={`${btnPrimary} ${dashLoading ? 'opacity-50' : ''}`}
              >
                {dashLoading ? 'Carregando...' : 'Filtrar'}
              </button>
            </div>

            {dashData && (
              <div className="space-y-6">
                {/* Contadores */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-[#AABAA4]">{dashData.contadores.totalPacientes}</p>
                    <p className="text-[10px] text-white/40 uppercase tracking-wider mt-1">Pacientes Total</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-[#AABAA4]">{dashData.contadores.totalAnamneses}</p>
                    <p className="text-[10px] text-white/40 uppercase tracking-wider mt-1">Anamneses Total</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-[#AABAA4]">{dashData.anamneses.total}</p>
                    <p className="text-[10px] text-white/40 uppercase tracking-wider mt-1">Anamneses no Periodo</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-[#AABAA4]">{dashData.acessos.pacientesUnicos}</p>
                    <p className="text-[10px] text-white/40 uppercase tracking-wider mt-1">Pacientes Acessaram</p>
                  </div>
                </div>

                {/* Anamneses */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                  <h3 className="text-sm font-medium text-[#AABAA4] mb-3">
                    Anamneses no periodo ({dashData.anamneses.total})
                  </h3>
                  {dashData.anamneses.lista.length === 0 ? (
                    <p className="text-white/30 text-xs">Nenhuma anamnese neste periodo.</p>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {dashData.anamneses.lista.map((a: any) => (
                        <div key={a.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/5">
                          <div>
                            <p className="text-sm">{a.pacienteNome}</p>
                            <p className="text-[10px] text-white/40">
                              {new Date(a.criadoEm).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          {dashData.contadores && isMaster && (
                            <a
                              href={`https://crm.vipestetic.com.br/pacientes/${a.pacienteId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-[#AABAA4] hover:underline"
                            >
                              Ver no CRM
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Acessos */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                  <h3 className="text-sm font-medium text-[#AABAA4] mb-3">
                    Acessos no periodo ({dashData.acessos.totalSessoes} sessoes, {dashData.acessos.pacientesUnicos} pacientes)
                  </h3>
                  {dashData.acessos.lista.length === 0 ? (
                    <p className="text-white/30 text-xs">Nenhum acesso neste periodo.</p>
                  ) : (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {dashData.acessos.lista.map((a: any, i: number) => (
                        <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/5">
                          <div>
                            <p className="text-sm">{a.pacienteNome}</p>
                            <p className="text-[10px] text-white/40">
                              {a.dispositivo} · {a.referrer === 'direto' ? 'Acesso direto' : a.referrer}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-white/40">
                              {new Date(a.horario).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            </p>
                            {a.pacienteId && isMaster && (
                              <a
                                href={`https://crm.vipestetic.com.br/pacientes/${a.pacienteId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-[#AABAA4] hover:underline"
                              >
                                Perfil CRM
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {!dashData && !dashLoading && dashEstabId && (
              <p className="text-white/30 text-sm text-center py-8">Selecione um periodo e clique em Filtrar.</p>
            )}
            {!dashEstabId && (
              <p className="text-white/30 text-sm text-center py-8">Selecione um estabelecimento para ver o dashboard.</p>
            )}
          </div>
        )}

        {/* ── Tab: Pacientes ────────────────────────────────────────────── */}
        {activeTab === 'pacientes' && (
          <div>
            {selectedPacienteId ? (
              <AdminPatientProfile
                pacienteId={selectedPacienteId}
                onBack={() => setSelectedPacienteId(null)}
                crmBaseUrl="https://crm.vipestetic.com.br"
              />
            ) : (
              <>
                <div className="flex flex-wrap gap-3 mb-6 items-end">
                  <div>
                    <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-1">Estabelecimento</label>
                    <select value={pacientesEstabId}
                      onChange={e => { setPacientesEstabId(e.target.value); if (e.target.value) loadPacientes(e.target.value); }}
                      className="bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm outline-none text-white min-w-[200px]">
                      <option value="" className="bg-[#1A1A1B]">Selecione...</option>
                      {estabelecimentos.map(e => (
                        <option key={e.id} value={e.id} className="bg-[#1A1A1B]">{e.nome}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {pacientesLoading ? (
                  <div className="flex justify-center py-10">
                    <div className="w-8 h-8 border-2 border-[#AABAA4] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : pacientes.length === 0 && pacientesEstabId ? (
                  <p className="text-white/30 text-sm text-center py-8">Nenhum paciente encontrado.</p>
                ) : (
                  <div className="space-y-2">
                    {pacientes.map(p => (
                      <div key={p.id}
                        className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:border-[#AABAA4]/30 transition-all">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {p.fotoUrl ? (
                            <img src={p.fotoUrl} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-[#AABAA4]/20 flex items-center justify-center text-[#AABAA4] text-sm font-bold flex-shrink-0">
                              {p.nome?.charAt(0)?.toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{p.nome}</p>
                            <p className="text-[10px] text-white/40 truncate">
                              {p.telefone || ''} {p.email && `· ${p.email}`}
                            </p>
                            <div className="flex gap-2 mt-1">
                              {p.temAnamnese && <span className="text-[9px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full">Anamnese</span>}
                              {p.tracking.sessoes > 0 && <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full">{p.tracking.sessoes} sessoes</span>}
                              {p.tracking.fotos > 0 && <span className="text-[9px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded-full">{p.tracking.fotos} fotos</span>}
                              {p.tracking.ultimoAcesso && (
                                <span className="text-[9px] text-white/20">
                                  Ultimo: {new Date(p.tracking.ultimoAcesso).toLocaleDateString('pt-BR')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <button onClick={() => setSelectedPacienteId(p.id)}
                          className="text-xs bg-[#AABAA4]/20 text-[#AABAA4] px-3 py-1.5 rounded-lg hover:bg-[#AABAA4]/30 flex-shrink-0 ml-3">
                          Ver perfil
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {!pacientesEstabId && (
                  <p className="text-white/30 text-sm text-center py-8">Selecione um estabelecimento.</p>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Tab: Estabelecimentos ──────────────────────────────────────── */}
        {activeTab === 'estabelecimentos' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium">Estabelecimentos</h2>
              {isMaster && (
                <button onClick={() => { clearEstabForm(); setShowEstabForm(true); }} className={btnPrimary}>
                  + Novo Estabelecimento
                </button>
              )}
            </div>

            {/* Form criar estabelecimento */}
            {showEstabForm && (
              <div className="mb-6 p-5 bg-white/5 rounded-2xl space-y-3">
                <p className="text-sm font-medium text-[#AABAA4] mb-2">Novo Estabelecimento</p>
                <input placeholder="Nome *" value={fNome} onChange={e => setFNome(e.target.value)} className={inputClass} />
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="CNPJ" value={fCnpj} onChange={e => setFCnpj(e.target.value)} className={inputClass} />
                  <input placeholder="Telefone" value={fTelefone} onChange={e => setFTelefone(e.target.value)} className={inputClass} />
                  <input placeholder="Cidade" value={fCidade} onChange={e => setFCidade(e.target.value)} className={inputClass} />
                  <input placeholder="Estado (UF)" maxLength={2} value={fEstado} onChange={e => setFEstado(e.target.value.toUpperCase())} className={inputClass} />
                </div>

                <div className="flex gap-6 pt-2">
                  <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                    <input type="checkbox" checked={fJornadaAtivo} onChange={e => setFJornadaAtivo(e.target.checked)} className="accent-[#AABAA4]" />
                    JornadaVip ativo
                  </label>
                  <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                    <input type="checkbox" checked={fCrmIntegrado} onChange={e => setFCrmIntegrado(e.target.checked)} className="accent-[#AABAA4]" />
                    Integrado ao CRM
                  </label>
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={handleCreateEstab} disabled={loading || !fNome} className={btnPrimary}>
                    {loading ? 'Salvando...' : 'Criar'}
                  </button>
                  <button onClick={() => setShowEstabForm(false)} className={btnSecondary}>Cancelar</button>
                </div>
              </div>
            )}

            {/* Lista */}
            <div className="space-y-3">
              {estabelecimentos.length === 0 && (
                <p className="text-white/40 text-sm text-center py-8">Nenhum estabelecimento cadastrado.</p>
              )}
              {estabelecimentos.map(estab => (
                <div
                  key={estab.id}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    selectedEstab?.id === estab.id
                      ? 'border-[#AABAA4]/50 bg-[#AABAA4]/5'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  } ${!estab.ativo ? 'opacity-40' : ''}`}
                  onClick={() => loadEstabDetails(estab)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-sm">{estab.nome}</h3>
                      <p className="text-xs text-white/50 mt-1">
                        {[estab.cidade, estab.estado].filter(Boolean).join(' - ') || 'Sem localização'}
                        {estab.cnpj && ` • ${estab.cnpj}`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {estab.jornada_ativo && (
                        <span className="text-[10px] bg-[#AABAA4]/20 text-[#AABAA4] px-2 py-1 rounded-full">Jornada</span>
                      )}
                      {estab.crm_integrado && (
                        <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">CRM</span>
                      )}
                      {!estab.ativo && (
                        <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-1 rounded-full">Inativo</span>
                      )}
                    </div>
                  </div>

                  {/* Detalhes expandidos */}
                  {selectedEstab?.id === estab.id && (
                    <div className="mt-4 pt-4 border-t border-white/10 space-y-4" onClick={e => e.stopPropagation()}>
                      {isMaster && (
                        <div className="flex gap-3 flex-wrap">
                          <button onClick={() => handleToggleEstab(estab, 'jornadaAtivo')} className={`text-xs px-3 py-1.5 rounded-lg ${estab.jornada_ativo ? 'bg-[#AABAA4]/20 text-[#AABAA4]' : 'bg-white/10 text-white/50'}`}>
                            {estab.jornada_ativo ? 'Desativar Jornada' : 'Ativar Jornada'}
                          </button>
                          <button onClick={() => handleToggleEstab(estab, 'crmIntegrado')} className={`text-xs px-3 py-1.5 rounded-lg ${estab.crm_integrado ? 'bg-blue-500/20 text-blue-400' : 'bg-white/10 text-white/50'}`}>
                            {estab.crm_integrado ? 'Desintegrar CRM' : 'Integrar CRM'}
                          </button>
                          <button onClick={() => handleToggleEstab(estab, 'ativo')} className={`text-xs px-3 py-1.5 rounded-lg ${estab.ativo ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                            {estab.ativo ? 'Desativar' : 'Reativar'}
                          </button>
                        </div>
                      )}

                      {/* Admins deste estabelecimento */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-white/50 uppercase tracking-wider">Admins</p>
                          {isMaster && (
                            <button onClick={() => { clearAdminForm(); setShowAdminForm(true); }} className="text-xs text-[#AABAA4] hover:underline">
                              + Novo Admin
                            </button>
                          )}
                        </div>

                        {showAdminForm && selectedEstab?.id === estab.id && (
                          <div className="mb-3 p-3 bg-white/5 rounded-lg space-y-2">
                            <input placeholder="Nome" value={fNome} onChange={e => setFNome(e.target.value)} className={inputClass} />
                            <input placeholder="Email" value={fEmail} onChange={e => setFEmail(e.target.value)} className={inputClass} />
                            <input placeholder="Senha (min. 8)" type="password" value={fPassword} onChange={e => setFPassword(e.target.value)} className={inputClass} />
                            <div className="flex gap-2">
                              <button onClick={handleCreateAdmin} disabled={loading} className={`${btnPrimary} text-xs`}>
                                {loading ? 'Criando...' : 'Criar Admin'}
                              </button>
                              <button onClick={() => setShowAdminForm(false)} className={`${btnSecondary} text-xs`}>Cancelar</button>
                            </div>
                          </div>
                        )}

                        {estabAdmins.length === 0 && (
                          <p className="text-white/30 text-xs">Nenhum admin cadastrado.</p>
                        )}
                        {estabAdmins.map(a => (
                          <div key={a.id} className={`flex items-center justify-between py-2 ${!a.ativo ? 'opacity-40' : ''}`}>
                            <div>
                              <p className="text-sm">{a.nome}</p>
                              <p className="text-xs text-white/40">{a.email}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              {a.ultimo_login && (
                                <span className="text-[10px] text-white/30">
                                  Ultimo: {new Date(a.ultimo_login).toLocaleDateString('pt-BR')}
                                </span>
                              )}
                              {isMaster && a.ativo && (
                                <button onClick={() => handleDeleteAdmin(a.id)} className="text-xs text-red-400/60 hover:text-red-400">
                                  Desativar
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <p className="text-[10px] text-white/20">ID: {estab.id}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Tab: Admins (todos) ────────────────────────────────────────── */}
        {activeTab === 'admins' && isMaster && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium">Admins por Estabelecimento</h2>
            </div>
            {estabelecimentos.map(estab => (
              <AdminsByEstab key={estab.id} estabelecimento={estab} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Sub-componente: lista admins por estabelecimento + criar ─────────────────

const AdminsByEstab: React.FC<{ estabelecimento: Estabelecimento }> = ({ estabelecimento }) => {
  const [admins, setAdmins] = useState<EstabAdmin[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    masterApi.getAdmins(estabelecimento.id).then(a => {
      setAdmins(a);
      setLoaded(true);
    });
  }, [estabelecimento.id]);

  const handleCreate = async () => {
    if (!nome || !email || !pwd) { setFormError('Preencha todos os campos.'); return; }
    if (pwd.length < 8) { setFormError('Senha minimo 8 caracteres.'); return; }
    setFormError('');
    setSaving(true);

    const result = await masterApi.createAdmin({
      nome, email, password: pwd,
      estabelecimentoId: estabelecimento.id,
    });

    setSaving(false);
    if (result.success && result.admin) {
      setAdmins(prev => [...prev, result.admin!]);
      setShowForm(false);
      setNome(''); setEmail(''); setPwd('');
    } else {
      setFormError(result.error || 'Erro ao criar admin.');
    }
  };

  const handleDelete = async (id: string) => {
    await masterApi.deleteAdmin(id);
    setAdmins(prev => prev.map(a => a.id === id ? { ...a, ativo: false } : a));
  };

  if (!loaded) return <div className="mb-6 h-10 bg-white/5 rounded-xl animate-pulse" />;

  const inputClass = 'w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#AABAA4]/50 transition-colors';

  return (
    <div className="mb-6 bg-white/5 border border-white/10 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-[#AABAA4]">{estabelecimento.nome}</h3>
        <button
          onClick={() => { setShowForm(!showForm); setFormError(''); }}
          className="text-xs bg-[#AABAA4]/20 text-[#AABAA4] px-3 py-1.5 rounded-lg hover:bg-[#AABAA4]/30 transition-all"
        >
          {showForm ? 'Cancelar' : '+ Novo Admin'}
        </button>
      </div>

      {/* Formulário de criação */}
      {showForm && (
        <div className="mb-4 p-4 bg-white/5 rounded-xl space-y-3">
          <input placeholder="Nome completo" value={nome} onChange={e => setNome(e.target.value)} className={inputClass} />
          <input placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} />
          <input placeholder="Senha (min. 8 caracteres)" type="password" value={pwd} onChange={e => setPwd(e.target.value)} className={inputClass} />
          {formError && <p className="text-red-400 text-xs">{formError}</p>}
          <button onClick={handleCreate} disabled={saving || !nome || !email || !pwd}
            className="py-2.5 px-5 bg-[#AABAA4] text-[#1A1A1B] font-medium rounded-xl text-sm disabled:opacity-40 transition-all active:scale-95">
            {saving ? 'Criando...' : 'Criar Admin'}
          </button>
        </div>
      )}

      {/* Lista de admins */}
      {admins.length === 0 && !showForm && (
        <p className="text-xs text-white/30">Nenhum admin cadastrado para este estabelecimento.</p>
      )}
      <div className="space-y-1">
        {admins.map(a => (
          <div key={a.id} className={`flex items-center justify-between py-2.5 px-3 rounded-lg bg-white/5 ${!a.ativo ? 'opacity-40' : ''}`}>
            <div>
              <p className="text-sm">{a.nome}</p>
              <p className="text-xs text-white/40">{a.email}</p>
              {a.ultimo_login && (
                <p className="text-[10px] text-white/20">Ultimo login: {new Date(a.ultimo_login).toLocaleDateString('pt-BR')}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${a.ativo ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {a.ativo ? 'Ativo' : 'Inativo'}
              </span>
              {a.ativo && (
                <button onClick={() => handleDelete(a.id)}
                  className="text-[10px] text-red-400/50 hover:text-red-400 transition-colors">
                  Desativar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MasterAdminView;
