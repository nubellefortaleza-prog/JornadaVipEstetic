
import React, { useState, useEffect } from 'react';
import { PatientRecord, Reminder } from '../types';
import { getGeminiSummaryForClinic } from '../services/geminiService';
import { getWebhooks, saveWebhooks, sendPatientToWebhooks, WebhookConfig } from '../services/webhookService';

interface Props {
  onBack: () => void;
}

type AdminTab = 'pacientes' | 'integracoes';

const AdminView: React.FC<Props> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('pacientes');
  const [records, setRecords] = useState<PatientRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<PatientRecord | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [remTitle, setRemTitle] = useState('');
  const [remMsg, setRemMsg] = useState('');

  // Webhooks
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>(getWebhooks);
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [newWebhookLabel, setNewWebhookLabel] = useState('');
  const [webhookStatus, setWebhookStatus] = useState<string | null>(null);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('clinic_records') || '[]');
    setRecords(data);
  }, []);

  const handleViewPatient = async (record: PatientRecord) => {
    setSelectedRecord(record);
    setAiSummary(null);
    setLoadingAi(true);
    const summary = await getGeminiSummaryForClinic(record.profile, record.anamnesis);
    setAiSummary(summary || "Sem resumo disponível.");
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
      read: false
    };

    const updatedRecords = records.map(r => {
      if (r.profile.id === selectedRecord.profile.id) {
        return { ...r, reminders: [...(r.reminders || []), newReminder] };
      }
      return r;
    });

    localStorage.setItem('clinic_records', JSON.stringify(updatedRecords));
    setRecords(updatedRecords);
    setSelectedRecord({ ...selectedRecord, reminders: [...(selectedRecord.reminders || []), newReminder] });
    setRemTitle('');
    setRemMsg('');
    alert('Lembrete enviado ao app do paciente!');
  };

  const handleAddWebhook = () => {
    if (!newWebhookUrl || !newWebhookLabel) return;
    const updated = [...webhooks, { url: newWebhookUrl, label: newWebhookLabel, enabled: true }];
    setWebhooks(updated);
    saveWebhooks(updated);
    setNewWebhookUrl('');
    setNewWebhookLabel('');
  };

  const handleToggleWebhook = (i: number) => {
    const updated = webhooks.map((w, idx) => idx === i ? { ...w, enabled: !w.enabled } : w);
    setWebhooks(updated);
    saveWebhooks(updated);
  };

  const handleRemoveWebhook = (i: number) => {
    const updated = webhooks.filter((_, idx) => idx !== i);
    setWebhooks(updated);
    saveWebhooks(updated);
  };

  const handleTestWebhooks = async () => {
    if (!selectedRecord) return;
    setWebhookStatus('Enviando...');
    const results = await sendPatientToWebhooks(selectedRecord);
    const successCount = results.filter(r => r.success).length;
    setWebhookStatus(`${successCount}/${results.length} webhooks enviados com sucesso.`);
    setTimeout(() => setWebhookStatus(null), 4000);
  };

  return (
    <div className="flex flex-col flex-1 pb-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-serif">Painel Clínico</h2>
          <p className="text-xs text-white/40">Gestão e Inteligência</p>
        </div>
        <button onClick={onBack} className="text-xs sage-green uppercase tracking-widest font-bold">Sair</button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-6">
        {(['pacientes', 'integracoes'] as AdminTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === tab ? 'bg-sage text-[#1A1A1B]' : 'bg-white/5 text-white/40 hover:bg-white/10'
            }`}
          >
            {tab === 'pacientes' ? 'Pacientes' : 'Integrações'}
          </button>
        ))}
      </div>

      {/* ABA PACIENTES */}
      {activeTab === 'pacientes' && (
        <>
          {!selectedRecord ? (
            <div className="space-y-4">
              <h3 className="text-xs uppercase tracking-widest text-white/40 ml-1">Fichas Prontas para Consulta</h3>
              {records.length === 0 ? (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                  <p className="text-sm text-white/40">Aguardando novos cadastros...</p>
                </div>
              ) : (
                records.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => handleViewPatient(r)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between hover:border-sage/50 transition-all"
                  >
                    <div className="text-left">
                      <p className="font-medium">{r.profile.name}</p>
                      <p className="text-[10px] text-white/40 uppercase tracking-tighter">{r.profile.objective}</p>
                    </div>
                    <span className="text-[10px] sage-green font-bold">Abrir IA</span>
                  </button>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <button onClick={() => setSelectedRecord(null)} className="flex items-center space-x-2 text-xs text-white/40">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Voltar</span>
              </button>

              {/* Info do Paciente */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <p className="font-semibold">{selectedRecord.profile.name}</p>
                <p className="text-xs text-white/40">{selectedRecord.profile.phone} • {selectedRecord.profile.email}</p>
                <p className="text-xs text-white/40 mt-1">Objetivo: {selectedRecord.profile.objective}</p>
              </div>

              {/* Enviar Lembrete */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                <h4 className="text-xs font-bold uppercase tracking-widest text-sage mb-4">Programar Lembrete</h4>
                <div className="space-y-3">
                  <input
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-xs outline-none focus:border-sage"
                    placeholder="Título (Ex: Lembrete de Consulta)"
                    value={remTitle}
                    onChange={(e) => setRemTitle(e.target.value)}
                  />
                  <textarea
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-xs outline-none focus:border-sage min-h-[60px]"
                    placeholder="Mensagem da orientação..."
                    value={remMsg}
                    onChange={(e) => setRemMsg(e.target.value)}
                  />
                  <button
                    onClick={handleSendReminder}
                    className="w-full py-2 bg-sage text-[#1A1A1B] text-xs font-bold rounded-xl"
                  >
                    Enviar ao Paciente
                  </button>
                </div>
              </div>

              {/* Relatório de IA */}
              <div className="bg-sage/5 border border-sage/20 rounded-3xl p-6">
                <h4 className="text-xs font-bold uppercase tracking-widest sage-green mb-4">Relatório de IA</h4>
                {loadingAi ? (
                  <div className="py-4 text-xs text-white/40">Gerando análise clínica...</div>
                ) : (
                  <p className="text-xs leading-relaxed text-white/80 whitespace-pre-line">{aiSummary}</p>
                )}
              </div>

              {/* Enviar via Webhook */}
              {webhooks.filter(w => w.enabled).length > 0 && (
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">Enviar para CRM/Webhook</h4>
                  <button
                    onClick={handleTestWebhooks}
                    className="w-full py-2 bg-white/10 border border-white/10 text-xs font-bold rounded-xl hover:bg-white/15 transition-all"
                  >
                    Enviar Dados do Paciente
                  </button>
                  {webhookStatus && (
                    <p className="text-[10px] text-center mt-2 sage-green">{webhookStatus}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ABA INTEGRAÇÕES */}
      {activeTab === 'integracoes' && (
        <div className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">Adicionar Webhook</h4>
            <div className="space-y-3">
              <input
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-xs outline-none focus:border-sage"
                placeholder="Nome (Ex: CRM Ploomes, RD Station...)"
                value={newWebhookLabel}
                onChange={(e) => setNewWebhookLabel(e.target.value)}
              />
              <input
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-xs outline-none focus:border-sage"
                placeholder="URL do Webhook"
                value={newWebhookUrl}
                onChange={(e) => setNewWebhookUrl(e.target.value)}
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
                    <button
                      onClick={() => handleRemoveWebhook(i)}
                      className="text-[10px] text-red-400/50 hover:text-red-400 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="bg-sage/5 border border-sage/20 rounded-2xl p-4">
            <p className="text-[10px] uppercase tracking-wider sage-green font-bold mb-2">Sobre os Webhooks</p>
            <p className="text-xs text-white/50 leading-relaxed">
              Os dados do paciente (nome, telefone, e-mail, objetivo e anamnese) são enviados via POST em formato JSON quando você clicar em "Enviar Dados do Paciente" na ficha de cada paciente. Compatible com Zapier, Make, n8n, RD Station e outros.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminView;
