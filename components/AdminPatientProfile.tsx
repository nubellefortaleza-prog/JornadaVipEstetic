// ─────────────────────────────────────────────────────────────────────────────
// AdminPatientProfile.tsx — Perfil completo do paciente no painel admin
//
// Exibe: dados cadastrais, anamnese, tracking, fotos, feed
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { getPacientePerfil } from '../services/masterAdminService';

interface Props {
  pacienteId: string;
  onBack: () => void;
  crmBaseUrl?: string;
}

type ProfileTab = 'resumo' | 'anamnese' | 'tracking' | 'fotos' | 'feed';

const AdminPatientProfile: React.FC<Props> = ({ pacienteId, onBack, crmBaseUrl }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ProfileTab>('resumo');

  useEffect(() => {
    setLoading(true);
    getPacientePerfil(pacienteId).then(d => {
      setData(d);
      setLoading(false);
    });
  }, [pacienteId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#AABAA4] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-white/40 text-center py-10">Paciente nao encontrado.</p>;
  }

  const p = data.paciente;
  const t = data.tracking;
  const tabs: { key: ProfileTab; label: string }[] = [
    { key: 'resumo', label: 'Resumo' },
    { key: 'anamnese', label: 'Anamnese' },
    { key: 'tracking', label: 'Rastreamento' },
    { key: 'fotos', label: `Fotos (${data.fotos?.length || 0})` },
    { key: 'feed', label: 'Feed' },
  ];

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('pt-BR') : '-';
  const formatDateTime = (d: string) => d ? new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-';

  return (
    <div>
      {/* Header com foto e dados */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {p.fotoUrl ? (
          <img src={p.fotoUrl} alt={p.nome} className="w-14 h-14 rounded-full object-cover border-2 border-[#AABAA4]/30" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-[#AABAA4]/20 flex items-center justify-center text-[#AABAA4] text-xl font-bold">
            {p.nome?.charAt(0)?.toUpperCase()}
          </div>
        )}

        <div className="flex-1">
          <h2 className="text-lg font-medium">{p.nome}</h2>
          <p className="text-xs text-white/50">{p.email} {p.telefone && `· ${p.telefone}`}</p>
          <p className="text-[10px] text-white/30">Cadastro: {formatDate(p.criadoEm)} {p.cidade && `· ${p.cidade}/${p.estado}`}</p>
        </div>

        {crmBaseUrl && (
          <a href={`${crmBaseUrl}/pacientes/${p.id}`} target="_blank" rel="noopener noreferrer"
            className="text-xs bg-[#AABAA4]/20 text-[#AABAA4] px-3 py-1.5 rounded-lg hover:bg-[#AABAA4]/30">
            Ver no CRM
          </a>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white/5 rounded-xl p-1 overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all ${activeTab === tab.key ? 'bg-[#AABAA4] text-[#1A1A1B] font-medium' : 'text-white/50 hover:text-white'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Resumo ─────────────────────────────────────────────────────────── */}
      {activeTab === 'resumo' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Sessoes" value={t.sessoes.length} />
            <Stat label="Telas visitadas" value={Object.keys(t.telas).length} />
            <Stat label="Fotos enviadas" value={t.fotos.length} />
            <Stat label="Moods" value={t.moods.length} />
          </div>

          {t.sessoes.length > 0 && (
            <div className="bg-white/5 rounded-xl p-4">
              <h4 className="text-xs text-white/40 uppercase tracking-wider mb-3">Ultimo acesso</h4>
              <div className="text-sm">
                <p>{formatDateTime(t.sessoes[0].horario)}</p>
                <p className="text-xs text-white/40">{t.sessoes[0].dispositivo} · {t.sessoes[0].referrer}</p>
                {t.sessoes[0].bateria && <p className="text-xs text-white/30">Bateria: {t.sessoes[0].bateria}</p>}
              </div>
            </div>
          )}

          {t.geolocations.length > 0 && (
            <div className="bg-white/5 rounded-xl p-4">
              <h4 className="text-xs text-white/40 uppercase tracking-wider mb-3">Ultima localizacao</h4>
              <p className="text-sm">{t.geolocations[0].cidade}, {t.geolocations[0].estado}</p>
              <p className="text-[10px] text-white/30">Precisao: {Math.round(t.geolocations[0].accuracy || 0)}m · {formatDateTime(t.geolocations[0].horario)}</p>
            </div>
          )}

          {t.moods.length > 0 && (
            <div className="bg-white/5 rounded-xl p-4">
              <h4 className="text-xs text-white/40 uppercase tracking-wider mb-3">Historico de humor</h4>
              <div className="flex flex-wrap gap-2">
                {t.moods.slice(0, 20).map((m: any, i: number) => (
                  <span key={i} className="text-xs bg-white/10 px-2 py-1 rounded-full">
                    {m.mood} <span className="text-white/30">{formatDate(m.horario)}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Telas mais visitadas */}
          {Object.keys(t.telas).length > 0 && (
            <div className="bg-white/5 rounded-xl p-4">
              <h4 className="text-xs text-white/40 uppercase tracking-wider mb-3">Telas mais visitadas</h4>
              <div className="space-y-1">
                {Object.entries(t.telas)
                  .sort((a: any, b: any) => b[1].visitas - a[1].visitas)
                  .slice(0, 10)
                  .map(([screen, stats]: [string, any]) => (
                    <div key={screen} className="flex justify-between text-xs">
                      <span className="text-white/70">{screen}</span>
                      <span className="text-white/30">{stats.visitas}x · {Math.round(stats.tempoTotal / 1000)}s</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Anamnese ───────────────────────────────────────────────────────── */}
      {activeTab === 'anamnese' && (
        <div>
          {data.anamnese ? (
            <div className="bg-white/5 rounded-xl p-5 space-y-3">
              <p className="text-[10px] text-white/30">Preenchida em {formatDateTime(data.anamnese.criadoEm)}</p>
              {Object.entries(data.anamnese.dados || {}).map(([key, value]: [string, any]) => (
                <div key={key} className="border-b border-white/5 pb-2">
                  <p className="text-[10px] text-[#AABAA4] uppercase tracking-wider">{formatLabel(key)}</p>
                  <p className="text-sm text-white/70 mt-0.5">
                    {typeof value === 'boolean' ? (value ? 'Sim' : 'Nao') :
                     typeof value === 'object' ? JSON.stringify(value, null, 2) :
                     String(value) || '-'}
                  </p>
                </div>
              ))}
              {data.anamnese.observacoes && (
                <div>
                  <p className="text-[10px] text-[#AABAA4] uppercase tracking-wider">Observacoes</p>
                  <p className="text-sm text-white/70">{data.anamnese.observacoes}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-white/30 text-sm text-center py-8">Anamnese nao preenchida.</p>
          )}
        </div>
      )}

      {/* ── Tracking ───────────────────────────────────────────────────────── */}
      {activeTab === 'tracking' && (
        <div className="space-y-4">
          {/* Sessões */}
          <Section title={`Sessoes (${t.sessoes.length})`}>
            {t.sessoes.slice(0, 30).map((s: any, i: number) => (
              <div key={i} className="flex justify-between py-1.5 border-b border-white/5 text-xs">
                <div>
                  <span className="text-white/70">{s.dispositivo}</span>
                  <span className="text-white/30 ml-2">{s.referrer}</span>
                </div>
                <div className="text-right text-white/30">
                  <span>{formatDateTime(s.horario)}</span>
                  {s.ip && <span className="ml-2">{s.ip}</span>}
                </div>
              </div>
            ))}
          </Section>

          {/* Velocidade digitação */}
          {t.keystrokes.length > 0 && (
            <Section title="Velocidade de digitacao">
              {t.keystrokes.map((k: any, i: number) => (
                <div key={i} className="flex justify-between py-1.5 border-b border-white/5 text-xs">
                  <span className="text-white/70">Campo: {k.campo}</span>
                  <span className="text-white/30">{k.wpm} WPM · {k.velocidadeMedia}ms intervalo · {k.totalCaracteres} chars</span>
                </div>
              ))}
            </Section>
          )}

          {/* Swipes */}
          {t.swipes.length > 0 && (
            <Section title={`Padroes de swipe (${t.swipes.length})`}>
              <div className="grid grid-cols-4 gap-2 text-center">
                {['up', 'down', 'left', 'right'].map(dir => {
                  const count = t.swipes.filter((s: any) => s.direcao === dir).length;
                  return (
                    <div key={dir} className="bg-white/5 rounded-lg p-2">
                      <p className="text-lg font-bold text-[#AABAA4]">{count}</p>
                      <p className="text-[10px] text-white/40">{dir}</p>
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          {/* Erros */}
          {t.erros.length > 0 && (
            <Section title={`Erros (${t.erros.length})`}>
              {t.erros.map((e: any, i: number) => (
                <div key={i} className="py-1.5 border-b border-white/5 text-xs">
                  <p className="text-red-400">{e.mensagem}</p>
                  <p className="text-white/20">{formatDateTime(e.horario)}</p>
                </div>
              ))}
            </Section>
          )}
        </div>
      )}

      {/* ── Fotos ──────────────────────────────────────────────────────────── */}
      {activeTab === 'fotos' && (
        <div>
          {data.fotos.length === 0 && t.fotos.length === 0 ? (
            <p className="text-white/30 text-sm text-center py-8">Nenhuma foto enviada.</p>
          ) : (
            <div className="space-y-4">
              {/* Fotos do CRM (arquivos_paciente) */}
              {data.fotos.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {data.fotos.map((f: any) => (
                    <div key={f.id} className="rounded-xl overflow-hidden border border-white/10">
                      <img src={f.url} alt={f.nome} className="w-full h-32 object-cover" />
                      <div className="p-2">
                        <p className="text-[10px] text-white/40">{f.tipo} · {formatDate(f.criadoEm)}</p>
                        {f.descricao && <p className="text-xs text-white/60">{f.descricao}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Metadados EXIF das fotos (tracking) */}
              {t.fotos.length > 0 && (
                <Section title="Metadados das fotos enviadas">
                  {t.fotos.map((f: any, i: number) => (
                    <div key={i} className="py-1.5 border-b border-white/5 text-xs">
                      <span className="text-white/70">{f.arquivo}</span>
                      {f.modelo && <span className="text-white/30 ml-2">{f.modelo}</span>}
                      {f.tamanho && <span className="text-white/30 ml-2">{Math.round(f.tamanho / 1024)}KB</span>}
                      <span className="text-white/20 ml-2">{formatDateTime(f.horario)}</span>
                    </div>
                  ))}
                </Section>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Feed ───────────────────────────────────────────────────────────── */}
      {activeTab === 'feed' && (
        <div className="space-y-2">
          {data.feed.length === 0 ? (
            <p className="text-white/30 text-sm text-center py-8">Feed vazio.</p>
          ) : (
            data.feed.map((f: any) => (
              <div key={f.id} className="bg-white/5 rounded-xl p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] bg-[#AABAA4]/20 text-[#AABAA4] px-2 py-0.5 rounded-full">{f.tipo}</span>
                    {f.titulo && <p className="text-sm font-medium mt-1">{f.titulo}</p>}
                    {f.descricao && <p className="text-xs text-white/50 mt-0.5">{f.descricao}</p>}
                  </div>
                  <span className="text-[10px] text-white/30">{formatDateTime(f.criadoEm)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// ── Helpers ─────────────────────────────────────────────────────────────────

const Stat: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
    <p className="text-xl font-bold text-[#AABAA4]">{value}</p>
    <p className="text-[10px] text-white/40 uppercase tracking-wider">{label}</p>
  </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white/5 rounded-xl p-4">
    <h4 className="text-xs text-white/40 uppercase tracking-wider mb-3">{title}</h4>
    {children}
  </div>
);

function formatLabel(key: string): string {
  const map: Record<string, string> = {
    healthGeneral: 'Saude Geral',
    allergies: 'Alergias',
    medications: 'Medicamentos',
    pregnancy: 'Gestante',
    pastProcedures: 'Procedimentos Anteriores',
    habits: 'Habitos',
    expectedResult: 'Resultado Esperado',
    saude_geral: 'Saude Geral',
    alergias: 'Alergias',
    medicamentos: 'Medicamentos',
    gravidez: 'Gestante',
    procedimentos_anteriores: 'Procedimentos Anteriores',
    habitos: 'Habitos',
    resultado_esperado: 'Resultado Esperado',
  };
  return map[key] || key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim();
}

export default AdminPatientProfile;
