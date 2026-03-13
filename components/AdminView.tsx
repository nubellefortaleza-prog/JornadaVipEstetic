
import React, { useState, useEffect } from 'react';
import { PatientRecord, Reminder } from '../types';
import { getGeminiSummaryForClinic } from '../services/geminiService';
import { getWebhooks, saveWebhooks, sendPatientToWebhooks, WebhookConfig } from '../services/webhookService';
import {
  PopupCampaign,
  getCampaigns,
  saveCampaigns,
  showBrowserNotification,
} from '../services/notificationService';
import { getEngagement, getLocation, getSessionContexts, getNavHistory } from '../services/analyticsService';

interface Props {
  onBack: () => void;
}

type AdminTab = 'pacientes' | 'campanhas' | 'integracoes' | 'analytics';

const AdminView: React.FC<Props> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('pacientes');

  // ── Pacientes ──────────────────────────────────────────────────────────────
  const [records, setRecords] = useState<PatientRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<PatientRecord | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [remTitle, setRemTitle] = useState('');
  const [remMsg, setRemMsg] = useState('');

  // ── Campanhas ──────────────────────────────────────────────────────────────
  const [campaigns, setCampaigns] = useState<PopupCampaign[]>([]);
  const [campTitle, setCampTitle] = useState('');
  const [campMsg, setCampMsg] = useState('');
  const [campImageUrl, setCampImageUrl] = useState('');
  const [campCtaLabel, setCampCtaLabel] = useState('');
  const [campCtaUrl, setCampCtaUrl] = useState('');
  const [campTarget, setCampTarget] = useState<'all' | 'select'>('all');
  const [campSelectedIds, setCampSelectedIds] = useState<string[]>([]);
  const [campScheduled, setCampScheduled] = useState('');

  // ── Cadastro / Edição de Paciente ──────────────────────────────────────────
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fName, setFName]             = useState('');
  const [fPhone, setFPhone]           = useState('');
  const [fEmail, setFEmail]           = useState('');
  const [fCpf, setFCpf]               = useState('');
  const [fBirth, setFBirth]           = useState('');
  const [fCity, setFCity]             = useState('');
  const [fObjective, setFObjective]   = useState('');
  const [fStyle, setFStyle]           = useState<'natural' | 'marcante' | 'discreto'>('natural');
  const [fComm, setFComm]             = useState<'tecnico' | 'simples'>('simples');

  // ── Webhooks ───────────────────────────────────────────────────────────────
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>(getWebhooks);
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [newWebhookLabel, setNewWebhookLabel] = useState('');
  const [webhookStatus, setWebhookStatus] = useState<string | null>(null);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('clinic_records') || '[]');
    setRecords(data);
    setCampaigns(getCampaigns());
  }, []);

  // ── Helpers: Formulário de Paciente ───────────────────────────────────────
  const clearPatientForm = () => {
    setFName(''); setFPhone(''); setFEmail(''); setFCpf('');
    setFBirth(''); setFCity(''); setFObjective('');
    setFStyle('natural'); setFComm('simples');
    setEditingId(null); setShowPatientForm(false);
  };

  const openEditForm = (r: PatientRecord) => {
    setFName(r.profile.name);
    setFPhone(r.profile.phone);
    setFEmail(r.profile.email);
    setFCpf(r.profile.cpf);
    setFBirth(r.profile.birthDate);
    setFCity(r.profile.city);
    setFObjective(r.profile.objective);
    setFStyle(r.profile.style);
    setFComm(r.profile.commPreference);
    setEditingId(r.profile.id);
    setShowPatientForm(true);
    setSelectedRecord(null);
  };

  const handleSavePatient = () => {
    if (!fName || !fPhone) return;
    const all: PatientRecord[] = JSON.parse(localStorage.getItem('clinic_records') || '[]');

    if (editingId) {
      // Edição
      const updated = all.map(r =>
        r.profile.id === editingId
          ? { ...r, profile: { ...r.profile, name: fName, phone: fPhone, email: fEmail, cpf: fCpf, birthDate: fBirth, city: fCity, objective: fObjective, style: fStyle, commPreference: fComm } }
          : r
      );
      localStorage.setItem('clinic_records', JSON.stringify(updated));
      setRecords(updated);
    } else {
      // Novo cadastro
      const emptyAnamnesis = { healthGeneral: '', allergies: '', medications: '', pregnancy: false, pastProcedures: '', habits: { sun: '', sleep: '', smoking: false, skincare: '' }, expectedResult: '' };
      const newRecord: PatientRecord = {
        profile: { id: Math.random().toString(36).substr(2, 9), name: fName, phone: fPhone, email: fEmail, cpf: fCpf, birthDate: fBirth, city: fCity, objective: fObjective, style: fStyle, commPreference: fComm, createdAt: new Date().toISOString() },
        anamnesis: emptyAnamnesis,
        reminders: [],
      };
      const updated = [...all, newRecord];
      localStorage.setItem('clinic_records', JSON.stringify(updated));
      setRecords(updated);
    }
    clearPatientForm();
  };

  const handleDeletePatient = (id: string) => {
    if (!confirm('Remover este paciente permanentemente?')) return;
    const updated = records.filter(r => r.profile.id !== id);
    localStorage.setItem('clinic_records', JSON.stringify(updated));
    setRecords(updated);
    if (selectedRecord?.profile.id === id) setSelectedRecord(null);
  };

  // ── Handlers: Pacientes ────────────────────────────────────────────────────
  const handleViewPatient = async (record: PatientRecord) => {
    setSelectedRecord(record);
    setAiSummary(null);
    setLoadingAi(true);
    const summary = await getGeminiSummaryForClinic(record.profile, record.anamnesis);
    setAiSummary(summary || 'Sem resumo disponível.');
    setLoadingAi(false);
  };

  const handleSendReminder = () => {
    if (!selectedRecord || !remTitle || !remMsg) return;
    const newReminder: Reminder = {
      id: Math.random().toString(36).substr(2, 9),
      patientId: selectedRecord.profile.id,
      title: remTitle,
      message: remMsg,
      date: new Date().toISOString(),
      type: 'orientacao',
      read: false,
    };
    const updatedRecords = records.map(r =>
      r.profile.id === selectedRecord.profile.id
        ? { ...r, reminders: [...(r.reminders || []), newReminder] }
        : r
    );
    localStorage.setItem('clinic_records', JSON.stringify(updatedRecords));
    setRecords(updatedRecords);
    setSelectedRecord({ ...selectedRecord, reminders: [...(selectedRecord.reminders || []), newReminder] });
    setRemTitle('');
    setRemMsg('');

    // Também envia notificação do browser se possível
    showBrowserNotification(remTitle, remMsg);
    alert('Lembrete salvo e notificação enviada!');
  };

  const handleTestWebhooks = async () => {
    if (!selectedRecord) return;
    setWebhookStatus('Enviando...');
    const results = await sendPatientToWebhooks(selectedRecord);
    const successCount = results.filter(r => r.success).length;
    setWebhookStatus(`${successCount}/${results.length} webhooks enviados com sucesso.`);
    setTimeout(() => setWebhookStatus(null), 4000);
  };

  // ── Handlers: Campanhas ────────────────────────────────────────────────────
  const handleCreateCampaign = () => {
    if (!campTitle || !campMsg) return;
    const newCampaign: PopupCampaign = {
      id: Math.random().toString(36).substr(2, 9),
      title: campTitle,
      message: campMsg,
      imageUrl: campImageUrl || undefined,
      ctaLabel: campCtaLabel || undefined,
      ctaUrl: campCtaUrl || undefined,
      targetPatientIds: campTarget === 'all' ? 'all' : campSelectedIds,
      createdAt: new Date().toISOString(),
      scheduledAt: campScheduled || undefined,
      readBy: [],
    };
    const updated = [...campaigns, newCampaign];
    setCampaigns(updated);
    saveCampaigns(updated);
    setCampTitle(''); setCampMsg(''); setCampImageUrl('');
    setCampCtaLabel(''); setCampCtaUrl(''); setCampScheduled('');
    setCampSelectedIds([]);

    // Tenta notificar via browser
    showBrowserNotification(campTitle, campMsg);
    alert('Campanha criada! Aparecerá para os pacientes ao abrirem o app.');
  };

  const handleDeleteCampaign = (id: string) => {
    const updated = campaigns.filter(c => c.id !== id);
    setCampaigns(updated);
    saveCampaigns(updated);
  };

  const togglePatientSelection = (id: string) => {
    setCampSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // ── Handlers: Webhooks ─────────────────────────────────────────────────────
  const handleAddWebhook = () => {
    if (!newWebhookUrl || !newWebhookLabel) return;
    const updated = [...webhooks, { url: newWebhookUrl, label: newWebhookLabel, enabled: true }];
    setWebhooks(updated);
    saveWebhooks(updated);
    setNewWebhookUrl(''); setNewWebhookLabel('');
  };

  const handleToggleWebhook = (i: number) => {
    const updated = webhooks.map((w, idx) => idx === i ? { ...w, enabled: !w.enabled } : w);
    setWebhooks(updated); saveWebhooks(updated);
  };

  const handleRemoveWebhook = (i: number) => {
    const updated = webhooks.filter((_, idx) => idx !== i);
    setWebhooks(updated); saveWebhooks(updated);
  };

  const tabs: { key: AdminTab; label: string }[] = [
    { key: 'pacientes', label: 'Pacientes' },
    { key: 'campanhas', label: 'Campanhas' },
    { key: 'analytics', label: 'Analytics' },
    { key: 'integracoes', label: 'CRM' },
  ];

  return (
    <div className="flex flex-col flex-1 pb-10">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-2xl font-serif">Painel Clínico</h2>
          <p className="text-xs text-white/40">Gestão e Inteligência</p>
        </div>
        <button onClick={onBack} className="text-xs sage-green uppercase tracking-widest font-bold">Sair</button>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-4 gap-1 mb-6">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => { setActiveTab(t.key); setSelectedRecord(null); }}
            className={`py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
              activeTab === t.key ? 'bg-sage text-[#1A1A1B]' : 'bg-white/5 text-white/40 hover:bg-white/10'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── ABA: PACIENTES ──────────────────────────────────────────────────── */}
      {activeTab === 'pacientes' && (
        <>
          {!selectedRecord ? (
            <div className="space-y-4">

              {/* Botão + Formulário de Cadastro/Edição */}
              {!showPatientForm ? (
                <button
                  onClick={() => { clearPatientForm(); setShowPatientForm(true); }}
                  className="w-full py-3 border border-sage/40 rounded-2xl text-xs font-bold sage-green hover:bg-sage/10 transition-all flex items-center justify-center gap-2"
                >
                  <span className="text-lg leading-none">+</span> Novo Cadastro
                </button>
              ) : (
                <div className="bg-white/5 border border-sage/30 rounded-3xl p-5 space-y-3">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-sage">
                      {editingId ? 'Editar Paciente' : 'Novo Cadastro'}
                    </h4>
                    <button onClick={clearPatientForm} className="text-white/30 hover:text-white/60 text-lg leading-none">✕</button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input className="col-span-2 w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-xs outline-none focus:border-sage" placeholder="Nome completo *" value={fName} onChange={e => setFName(e.target.value)} />
                    <input className="bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none focus:border-sage" placeholder="Telefone *" value={fPhone} onChange={e => setFPhone(e.target.value)} />
                    <input className="bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none focus:border-sage" placeholder="E-mail" value={fEmail} onChange={e => setFEmail(e.target.value)} />
                    <input className="bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none focus:border-sage" placeholder="CPF" value={fCpf} onChange={e => setFCpf(e.target.value)} />
                    <input type="date" className="bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none focus:border-sage" value={fBirth} onChange={e => setFBirth(e.target.value)} />
                    <input className="col-span-2 w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-xs outline-none focus:border-sage" placeholder="Cidade" value={fCity} onChange={e => setFCity(e.target.value)} />
                    <input className="col-span-2 w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-xs outline-none focus:border-sage" placeholder="Objetivo (ex: Lifting facial, Harmonização...)" value={fObjective} onChange={e => setFObjective(e.target.value)} />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[9px] text-white/30 mb-1">Estilo</p>
                      <div className="flex gap-1">
                        {(['natural', 'marcante', 'discreto'] as const).map(s => (
                          <button key={s} onClick={() => setFStyle(s)} className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold capitalize transition-all ${fStyle === s ? 'bg-sage text-[#1A1A1B]' : 'bg-white/5 text-white/40'}`}>{s}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[9px] text-white/30 mb-1">Comunicação</p>
                      <div className="flex gap-1">
                        {(['simples', 'tecnico'] as const).map(c => (
                          <button key={c} onClick={() => setFComm(c)} className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold capitalize transition-all ${fComm === c ? 'bg-sage text-[#1A1A1B]' : 'bg-white/5 text-white/40'}`}>{c}</button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button onClick={handleSavePatient} disabled={!fName || !fPhone} className="w-full py-2.5 bg-sage text-[#1A1A1B] text-xs font-bold rounded-xl disabled:opacity-30 transition-all">
                    {editingId ? 'Salvar Alterações' : 'Cadastrar Paciente'}
                  </button>
                </div>
              )}

              {/* Lista de pacientes */}
              <div className="flex justify-between items-center px-1">
                <h3 className="text-xs uppercase tracking-widest text-white/40">Fichas Cadastradas ({records.length})</h3>
              </div>
              {records.length === 0 ? (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                  <p className="text-sm text-white/40">Aguardando novos cadastros...</p>
                </div>
              ) : (
                records.map((r, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between hover:border-sage/20 transition-all">
                    <button onClick={() => handleViewPatient(r)} className="flex-1 text-left">
                      <p className="font-medium">{r.profile.name}</p>
                      <p className="text-[10px] text-white/40">{r.profile.phone}{r.profile.city ? ` · ${r.profile.city}` : ''}</p>
                      {r.profile.objective && <p className="text-[9px] text-white/25 uppercase tracking-tighter mt-0.5">{r.profile.objective}</p>}
                    </button>
                    <div className="flex items-center gap-3 ml-3">
                      <button onClick={() => openEditForm(r)} className="text-[10px] text-white/30 hover:text-sage transition-colors font-bold">Editar</button>
                      <button onClick={() => handleDeletePatient(r.profile.id)} className="text-[10px] text-red-400/40 hover:text-red-400 transition-colors font-bold">✕</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-5">
              <button onClick={() => setSelectedRecord(null)} className="flex items-center space-x-2 text-xs text-white/40">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Voltar</span>
              </button>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{selectedRecord.profile.name}</p>
                    <p className="text-xs text-white/40">{selectedRecord.profile.phone} • {selectedRecord.profile.email}</p>
                    {selectedRecord.profile.city && <p className="text-xs text-white/30">{selectedRecord.profile.city}</p>}
                    <p className="text-xs text-white/40 mt-1">Objetivo: {selectedRecord.profile.objective}</p>
                  </div>
                  <button onClick={() => openEditForm(selectedRecord)} className="text-[10px] sage-green font-bold border border-sage/30 px-3 py-1 rounded-lg hover:bg-sage/10 transition-all">
                    Editar
                  </button>
                </div>
              </div>

              {/* Lembrete / Popup interno */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-5">
                <h4 className="text-xs font-bold uppercase tracking-widest text-sage mb-4">Enviar Popup / Lembrete</h4>
                <div className="space-y-3">
                  <input
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-xs outline-none focus:border-sage"
                    placeholder="Título"
                    value={remTitle}
                    onChange={e => setRemTitle(e.target.value)}
                  />
                  <textarea
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-xs outline-none focus:border-sage min-h-[60px]"
                    placeholder="Mensagem..."
                    value={remMsg}
                    onChange={e => setRemMsg(e.target.value)}
                  />
                  <button onClick={handleSendReminder} className="w-full py-2 bg-sage text-[#1A1A1B] text-xs font-bold rounded-xl">
                    Enviar ao Paciente
                  </button>
                </div>
              </div>

              {/* Relatório IA */}
              <div className="bg-sage/5 border border-sage/20 rounded-3xl p-5">
                <h4 className="text-xs font-bold uppercase tracking-widest sage-green mb-3">Relatório de IA</h4>
                {loadingAi ? (
                  <p className="text-xs text-white/40">Gerando análise clínica...</p>
                ) : (
                  <p className="text-xs leading-relaxed text-white/80 whitespace-pre-line">{aiSummary}</p>
                )}
              </div>

              {/* Enviar via Webhook */}
              {webhooks.filter(w => w.enabled).length > 0 && (
                <div className="bg-white/5 border border-white/10 rounded-3xl p-5">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">Enviar para CRM</h4>
                  <button onClick={handleTestWebhooks} className="w-full py-2 bg-white/10 border border-white/10 text-xs font-bold rounded-xl hover:bg-white/15 transition-all">
                    Enviar Dados do Paciente
                  </button>
                  {webhookStatus && <p className="text-[10px] text-center mt-2 sage-green">{webhookStatus}</p>}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── ABA: CAMPANHAS ──────────────────────────────────────────────────── */}
      {activeTab === 'campanhas' && (
        <div className="space-y-6">
          {/* Criar nova campanha */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-5">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">Nova Campanha / Popup</h4>
            <div className="space-y-3">
              <input
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-xs outline-none focus:border-sage"
                placeholder="Título do popup *"
                value={campTitle}
                onChange={e => setCampTitle(e.target.value)}
              />
              <textarea
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-xs outline-none focus:border-sage min-h-[80px]"
                placeholder="Mensagem da campanha *"
                value={campMsg}
                onChange={e => setCampMsg(e.target.value)}
              />
              <input
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-xs outline-none focus:border-sage"
                placeholder="URL de imagem (opcional)"
                value={campImageUrl}
                onChange={e => setCampImageUrl(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  className="bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none focus:border-sage"
                  placeholder="Texto do botão (ex: Ver promoção)"
                  value={campCtaLabel}
                  onChange={e => setCampCtaLabel(e.target.value)}
                />
                <input
                  className="bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none focus:border-sage"
                  placeholder="URL do botão"
                  value={campCtaUrl}
                  onChange={e => setCampCtaUrl(e.target.value)}
                />
              </div>

              {/* Agendamento */}
              <div>
                <label className="text-[10px] text-white/40 block mb-1">Agendar para (opcional)</label>
                <input
                  type="datetime-local"
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-xs outline-none focus:border-sage"
                  value={campScheduled}
                  onChange={e => setCampScheduled(e.target.value)}
                />
              </div>

              {/* Destino */}
              <div>
                <label className="text-[10px] text-white/40 block mb-2">Enviar para</label>
                <div className="flex space-x-2 mb-3">
                  {(['all', 'select'] as const).map(opt => (
                    <button
                      key={opt}
                      onClick={() => setCampTarget(opt)}
                      className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                        campTarget === opt ? 'bg-sage text-[#1A1A1B]' : 'bg-white/5 text-white/40'
                      }`}
                    >
                      {opt === 'all' ? 'Todos os Pacientes' : 'Selecionar Pacientes'}
                    </button>
                  ))}
                </div>
                {campTarget === 'select' && (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {records.length === 0 ? (
                      <p className="text-xs text-white/30">Nenhum paciente cadastrado.</p>
                    ) : (
                      records.map(r => (
                        <label key={r.profile.id} className="flex items-center space-x-3 p-2 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10">
                          <input
                            type="checkbox"
                            checked={campSelectedIds.includes(r.profile.id)}
                            onChange={() => togglePatientSelection(r.profile.id)}
                            className="accent-[#AABAA4]"
                          />
                          <span className="text-xs">{r.profile.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={handleCreateCampaign}
                disabled={!campTitle || !campMsg}
                className="w-full py-3 bg-sage text-[#1A1A1B] text-xs font-bold rounded-xl disabled:opacity-30 transition-all"
              >
                Criar e Publicar Campanha
              </button>
            </div>
          </div>

          {/* Lista de campanhas existentes */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-widest text-white/40 px-1">Campanhas Ativas ({campaigns.length})</h4>
            {campaigns.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                <p className="text-xs text-white/30">Nenhuma campanha criada ainda.</p>
              </div>
            ) : (
              campaigns.map(c => (
                <div key={c.id} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{c.title}</p>
                      <p className="text-xs text-white/50 mt-0.5 line-clamp-2">{c.message}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteCampaign(c.id)}
                      className="text-[10px] text-red-400/50 hover:text-red-400 ml-3 flex-shrink-0"
                    >
                      Remover
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-[9px] bg-sage/10 text-sage px-2 py-1 rounded-full">
                      {c.targetPatientIds === 'all' ? 'Todos' : `${(c.targetPatientIds as string[]).length} paciente(s)`}
                    </span>
                    <span className="text-[9px] bg-white/5 text-white/40 px-2 py-1 rounded-full">
                      {c.readBy.length} leram
                    </span>
                    {c.scheduledAt && (
                      <span className="text-[9px] bg-white/5 text-white/40 px-2 py-1 rounded-full">
                        📅 {new Date(c.scheduledAt).toLocaleString('pt-BR')}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── ABA: ANALYTICS ──────────────────────────────────────────────────── */}
      {activeTab === 'analytics' && (
        <div className="space-y-4">
          <p className="text-xs text-white/40 leading-relaxed">
            Rastreamento LGPD-compliant — ações dentro do app + localização com consentimento.
          </p>
          {records.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
              <p className="text-sm text-white/40">Nenhum dado de engajamento ainda.</p>
            </div>
          ) : (
            records.map(r => {
              const eng      = getEngagement(r.profile.id);
              const loc      = getLocation(r.profile.id);
              const sessions = getSessionContexts(r.profile.id);
              const navHist  = getNavHistory(r.profile.id);
              const topScreens = Object.entries(eng.screenVisits).sort((a, b) => b[1] - a[1]).slice(0, 3);
              const lastSession = sessions[sessions.length - 1];

              return (
                <div key={r.profile.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
                  {/* Cabeçalho */}
                  <div className="flex justify-between items-center">
                    <p className="font-medium">{r.profile.name}</p>
                    {eng.lastSeen && (
                      <span className="text-[9px] text-white/30">
                        {new Date(eng.lastSeen).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>

                  {/* Métricas */}
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: 'Sessões', value: eng.totalSessions },
                      { label: 'Fotos', value: eng.photosUploaded },
                      { label: 'Checklists', value: eng.checklistCompletions },
                      { label: 'Indicações', value: eng.referralsSent },
                    ].map(m => (
                      <div key={m.label} className="bg-black/20 rounded-xl p-2 text-center">
                        <p className="text-base font-bold sage-green">{m.value}</p>
                        <p className="text-[9px] text-white/30">{m.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Localização */}
                  {loc ? (
                    <div className="bg-black/30 border border-white/10 rounded-xl p-3">
                      <p className="text-[9px] text-white/30 uppercase tracking-wider mb-1">Localização</p>
                      <p className="text-xs font-medium">
                        {[loc.city, loc.state, loc.country].filter(Boolean).join(', ') || 'Localização capturada'}
                      </p>
                      <p className="text-[9px] text-white/30 mt-0.5">
                        {loc.lat.toFixed(5)}, {loc.lng.toFixed(5)} · {new Date(loc.capturedAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-black/20 border border-white/5 rounded-xl p-3">
                      <p className="text-[9px] text-white/20 uppercase tracking-wider mb-0.5">Localização</p>
                      <p className="text-[10px] text-white/30">Aguardando permissão da paciente no próximo acesso</p>
                    </div>
                  )}

                  {/* Origem / Referrer */}
                  {lastSession && (
                    <div className="bg-black/30 border border-white/10 rounded-xl p-3 space-y-1">
                      <p className="text-[9px] text-white/30 uppercase tracking-wider mb-1">Origem da Visita</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] bg-sage/10 text-sage px-2 py-0.5 rounded-full max-w-full truncate">
                          {lastSession.referrer === 'direto' ? '🔗 Acesso direto (digitou URL ou app)' : `↩ ${lastSession.referrer}`}
                        </span>
                      </div>
                      <p className="text-[9px] text-white/20 truncate">{lastSession.userAgent}</p>
                    </div>
                  )}

                  {/* Telas mais acessadas */}
                  {topScreens.length > 0 && (
                    <div>
                      <p className="text-[9px] text-white/30 mb-1">Telas mais acessadas</p>
                      <div className="flex flex-wrap gap-1">
                        {topScreens.map(([screen, count]) => (
                          <span key={screen} className="text-[9px] bg-sage/10 text-sage px-2 py-0.5 rounded-full">
                            {screen} ({count}x)
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Histórico de navegação no app */}
                  {navHist.length > 0 && (
                    <div>
                      <p className="text-[9px] text-white/30 uppercase tracking-wider mb-2">Histórico de Navegação no App</p>
                      <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                        {navHist.slice(-20).reverse().map((entry, i) => (
                          <div key={i} className="flex items-center justify-between bg-black/20 rounded-lg px-3 py-1.5">
                            <span className="text-[10px] text-white/70 capitalize">{entry.screen}</span>
                            <span className="text-[9px] text-white/30">
                              {new Date(entry.timestamp).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Últimos humores */}
                  {eng.moodHistory.length > 0 && (
                    <div>
                      <p className="text-[9px] text-white/30 mb-1">Últimos humores</p>
                      <div className="flex space-x-1">
                        {eng.moodHistory.slice(-5).map((m, i) => (
                          <span key={i} className="text-lg">{m.mood}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}

          <div className="bg-sage/5 border border-sage/20 rounded-2xl p-4 mt-2">
            <p className="text-[10px] sage-green font-bold uppercase tracking-wider mb-2">Para analytics mais avançados</p>
            <p className="text-xs text-white/50 leading-relaxed">
              Integre com <strong className="text-white/70">Google Analytics 4</strong>, <strong className="text-white/70">Mixpanel</strong> ou <strong className="text-white/70">Firebase</strong> para funil de conversão e retenção. O Smartlook (já integrado) captura gravações de tela com consentimento.
            </p>
          </div>
        </div>
      )}

      {/* ── ABA: INTEGRAÇÕES (CRM) ────────────────────────────────────────────── */}
      {activeTab === 'integracoes' && (
        <div className="space-y-5">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-5">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">Adicionar Webhook</h4>
            <div className="space-y-3">
              <input
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-xs outline-none focus:border-sage"
                placeholder="Nome (Ex: RD Station, Ploomes...)"
                value={newWebhookLabel}
                onChange={e => setNewWebhookLabel(e.target.value)}
              />
              <input
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-xs outline-none focus:border-sage"
                placeholder="URL do Webhook (POST)"
                value={newWebhookUrl}
                onChange={e => setNewWebhookUrl(e.target.value)}
              />
              <button
                onClick={handleAddWebhook}
                disabled={!newWebhookUrl || !newWebhookLabel}
                className="w-full py-2 bg-sage text-[#1A1A1B] text-xs font-bold rounded-xl disabled:opacity-30"
              >
                Adicionar
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-widest text-white/40 px-1">Webhooks Configurados</h4>
            {webhooks.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
                <p className="text-xs text-white/30">Nenhum webhook configurado ainda.</p>
              </div>
            ) : (
              webhooks.map((w, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{w.label}</p>
                    <p className="text-[10px] text-white/30 truncate">{w.url}</p>
                  </div>
                  <div className="flex items-center space-x-3 ml-3">
                    <button
                      onClick={() => handleToggleWebhook(i)}
                      className={`w-10 h-5 rounded-full relative transition-colors ${w.enabled ? 'bg-sage' : 'bg-white/10'}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${w.enabled ? 'right-0.5' : 'left-0.5'}`} />
                    </button>
                    <button onClick={() => handleRemoveWebhook(i)} className="text-[10px] text-red-400/50 hover:text-red-400">✕</button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="bg-sage/5 border border-sage/20 rounded-2xl p-4">
            <p className="text-[10px] uppercase tracking-wider sage-green font-bold mb-2">Sobre as Integrações</p>
            <p className="text-xs text-white/50 leading-relaxed">
              Dados enviados: nome, telefone, e-mail, objetivo e anamnese do paciente via POST JSON. Compatível com Zapier, Make (Integromat), n8n, RD Station, Ploomes e qualquer sistema com webhook.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminView;
