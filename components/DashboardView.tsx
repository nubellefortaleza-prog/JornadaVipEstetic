
import React, { useState, useEffect } from 'react';
import { PatientProfile, RewardPoints, AppStep, Reminder } from '../types';
import {
  requestNotificationPermission,
  getNotificationPermission,
  getPendingCampaignsForPatient,
  markCampaignAsRead,
  PopupCampaign,
} from '../services/notificationService';
import { trackScreen, trackFeature, trackNotificationOpened } from '../services/analyticsService';

const WHATSAPP_NUMBER = '5500000000000'; // Configure com o número da clínica

interface Props {
  profile: PatientProfile;
  rewards: RewardPoints;
  onOpenChat: () => void;
  onNavigate: (step: AppStep) => void;
  onMoodCheckin: (mood: string) => void;
}

const DashboardView: React.FC<Props> = ({ profile, rewards, onOpenChat, onNavigate, onMoodCheckin }) => {
  const [activeReminder, setActiveReminder] = useState<Reminder | null>(null);
  const [activeCampaign, setActiveCampaign] = useState<PopupCampaign | null>(null);
  const [campaignQueue, setCampaignQueue] = useState<PopupCampaign[]>([]);
  const [showNotifBanner, setShowNotifBanner] = useState(false);

  const firstName = profile?.name?.split(' ')[0] || 'Paciente';

  useEffect(() => {
    trackScreen(profile.id, 'dashboard');

    // Verificar lembrete pendente (enviado individualmente pelo admin)
    const allRecords = JSON.parse(localStorage.getItem('clinic_records') || '[]');
    const myRecord = allRecords.find((r: any) => r.profile.id === profile.id);
    if (myRecord?.reminders?.length > 0) {
      const unread = myRecord.reminders.find((rem: Reminder) => !rem.read);
      if (unread) setActiveReminder(unread);
    }

    // Verificar campanhas pendentes
    const pending = getPendingCampaignsForPatient(profile.id);
    if (pending.length > 0) {
      setCampaignQueue(pending);
      setActiveCampaign(pending[0]);
    }

    // Exibir banner para pedir permissão de notificação
    if (getNotificationPermission() === 'default') {
      setTimeout(() => setShowNotifBanner(true), 2000);
    }
  }, [profile.id]);

  const closeReminder = () => setActiveReminder(null);

  const closeCampaign = () => {
    if (!activeCampaign) return;
    markCampaignAsRead(activeCampaign.id, profile.id);
    trackNotificationOpened(profile.id, activeCampaign.id);
    const rest = campaignQueue.filter(c => c.id !== activeCampaign.id);
    setCampaignQueue(rest);
    setActiveCampaign(rest.length > 0 ? rest[0] : null);
  };

  const handleEnableNotifications = async () => {
    const perm = await requestNotificationPermission();
    setShowNotifBanner(false);
    if (perm === 'granted') {
      trackFeature(profile.id, 'push_notifications_enabled');
    }
  };

  const openWhatsApp = () => {
    const msg = encodeURIComponent(`Olá! Sou ${profile.name} e gostaria de falar sobre minha jornada VIP.`);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank');
    trackFeature(profile.id, 'whatsapp_contact');
  };

  return (
    <div className="flex flex-col space-y-5 pb-20 relative">

      {/* ── Banner de permissão de notificação ──────────────────────────────── */}
      {showNotifBanner && (
        <div className="bg-sage/10 border border-sage/30 rounded-2xl p-4 flex items-start space-x-3">
          <div className="w-8 h-8 bg-sage/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v1m6 0H9" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-white/90 mb-0.5">Receba avisos da clínica</p>
            <p className="text-[10px] text-white/50 mb-3">Ative as notificações para receber lembretes de consulta e orientações pós-procedimento.</p>
            <div className="flex space-x-2">
              <button onClick={handleEnableNotifications} className="px-4 py-1.5 bg-sage text-[#1A1A1B] text-[10px] font-bold rounded-lg">
                Ativar
              </button>
              <button onClick={() => setShowNotifBanner(false)} className="px-4 py-1.5 bg-white/5 text-white/40 text-[10px] rounded-lg">
                Agora não
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Popup de Lembrete individual ─────────────────────────────────────── */}
      {activeReminder && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-6 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1A1A1B] border border-sage/30 rounded-3xl p-8 w-full shadow-2xl shadow-sage/5">
            <div className="w-12 h-12 bg-sage/10 rounded-full flex items-center justify-center mb-6 mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v1m6 0H9" />
              </svg>
            </div>
            <h3 className="text-xl font-serif text-center mb-2">{activeReminder.title}</h3>
            <p className="text-sm text-white/60 text-center leading-relaxed mb-8">{activeReminder.message}</p>
            <button onClick={closeReminder} className="w-full py-4 bg-sage text-[#1A1A1B] font-bold rounded-2xl">
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* ── Popup de Campanha ────────────────────────────────────────────────── */}
      {activeCampaign && !activeReminder && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-6 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1A1A1B] border border-sage/30 rounded-3xl w-full shadow-2xl shadow-sage/5 overflow-hidden">
            {activeCampaign.imageUrl && (
              <img src={activeCampaign.imageUrl} alt="" className="w-full h-40 object-cover" />
            )}
            <div className="p-8">
              <h3 className="text-xl font-serif text-center mb-3">{activeCampaign.title}</h3>
              <p className="text-sm text-white/60 text-center leading-relaxed mb-6">{activeCampaign.message}</p>
              {activeCampaign.ctaLabel && activeCampaign.ctaUrl && (
                <a
                  href={activeCampaign.ctaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={closeCampaign}
                  className="block w-full py-3 bg-sage text-[#1A1A1B] font-bold rounded-2xl text-center mb-3"
                >
                  {activeCampaign.ctaLabel}
                </a>
              )}
              <button onClick={closeCampaign} className="w-full py-3 bg-white/5 border border-white/10 text-white/60 text-sm rounded-2xl">
                {campaignQueue.length > 1 ? `Fechar (${campaignQueue.length - 1} restante${campaignQueue.length > 2 ? 's' : ''})` : 'Fechar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-sm font-light text-white/60">Olá, {firstName}</h2>
          <p className="text-lg font-serif">Sua Jornada VIP</p>
        </div>
        <div className="bg-sage/10 border border-sage/20 rounded-full px-4 py-2 flex items-center space-x-2">
          <span className="text-xs font-semibold text-sage">{rewards.total} pts</span>
          <div className="w-2 h-2 rounded-full bg-sage animate-pulse" />
        </div>
      </div>

      {/* ── Check-in de Humor ────────────────────────────────────────────────── */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-5">
        <h3 className="text-[10px] uppercase tracking-widest text-white/40 mb-3 text-center">Como você está se sentindo hoje?</h3>
        <div className="flex justify-around">
          {['😔', '😐', '😊', '✨'].map((emoji, idx) => (
            <button
              key={idx}
              onClick={() => {
                onMoodCheckin(emoji);
                trackFeature(profile.id, 'mood_checkin');
              }}
              className="text-2xl hover:scale-125 transition-transform p-2 grayscale hover:grayscale-0"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* ── Bloco de Próximo Atendimento ─────────────────────────────────────── */}
      <div className="bg-white/5 border-l-4 border-sage rounded-xl p-5">
        <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Seu próximo atendimento</span>
        <h3 className="text-lg font-serif sage-green mt-1">Sexta-feira, 25 de Outubro</h3>
        <p className="text-[10px] text-white/60 mt-0.5">Horário: 14:30h • Dra. Sofia</p>
      </div>

      {/* ── Grid Features ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4">
        {[
          {
            step: AppStep.PRE_PROCEDURE, feature: 'pre_procedure',
            icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />,
            label: 'Pré-Procedimento', sub: 'Prepare-se'
          },
          {
            step: AppStep.POST_PROCEDURE, feature: 'post_procedure',
            icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />,
            label: 'Pós-Procedimento', sub: 'Cuide-se'
          },
          {
            step: AppStep.REWARDS, feature: 'rewards',
            icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />,
            label: 'Indicar', sub: 'Ganhe prêmios'
          },
          {
            step: AppStep.EVOLUTION, feature: 'evolution',
            icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />,
            label: 'Evolução', sub: 'Acompanhe fotos'
          },
        ].map(item => (
          <button
            key={item.label}
            onClick={() => { onNavigate(item.step); trackFeature(profile.id, item.feature); }}
            className="bg-white/5 border border-white/10 rounded-2xl p-5 text-left flex flex-col justify-between h-32 hover:bg-white/10 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sage-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {item.icon}
            </svg>
            <div>
              <span className="text-sm font-semibold block">{item.label}</span>
              <span className="text-[10px] text-white/40">{item.sub}</span>
            </div>
          </button>
        ))}
      </div>

      {/* ── Botão WhatsApp ────────────────────────────────────────────────────── */}
      <button
        onClick={openWhatsApp}
        className="w-full py-4 bg-[#25D366]/10 border border-[#25D366]/30 rounded-2xl flex items-center justify-center space-x-3 hover:bg-[#25D366]/20 transition-all"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        <span className="text-sm font-semibold text-[#25D366]">Falar com a Clínica</span>
      </button>
    </div>
  );
};

export default DashboardView;
