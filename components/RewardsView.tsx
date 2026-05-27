
import React from 'react';
import { RewardPoints } from '../types';
import { trackReferralSent } from '../services/analyticsService';

const APP_URL = 'https://jornadavip.vipestetic.com.br';

interface Props {
  rewards: RewardPoints;
  patientId: string;
  patientName: string;
  onBack: () => void;
}

const RewardsView: React.FC<Props> = ({ rewards, patientId, patientName, onBack }) => {
  const referralLink = `${APP_URL}/ref/${patientId}`;

  const handleShare = () => {
    const firstName = patientName.split(' ')[0];
    const text = `Olá! Estou amando minha jornada na VIP Estética 🌿✨\n\nVocê merece se cuidar também! Use meu link exclusivo e ganhe um mimo especial na sua primeira consulta:\n👉 ${referralLink}\n\nBeijo, ${firstName} 💚`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    trackReferralSent(patientId);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      alert('Link copiado! Compartilhe com seus amigos.');
    } catch {
      alert(`Seu link: ${referralLink}`);
    }
    trackReferralSent(patientId);
  };

  const nextLevelPts: Record<string, number> = {
    Iniciante: 500,
    'Avançado': 1500,
    Premium: Infinity,
  };
  const progressToNext = Math.min((rewards.total / (nextLevelPts[rewards.level] || 500)) * 100, 100);

  return (
    <div className="flex flex-col flex-1 pb-10">
      <div className="flex items-center space-x-4 mb-8">
        <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-xl font-serif">Indicações e Prêmios</h2>
      </div>

      {/* Card de nível com barra de progresso */}
      <div className="bg-sage/10 border border-sage/20 rounded-3xl p-6 text-center mb-6">
        <p className="text-[11px] uppercase tracking-widest text-sage mb-2">Nível atual</p>
        <h3 className="text-3xl font-serif mb-1">{rewards.level}</h3>
        <p className="text-xs text-white/60 mb-4">{rewards.total} pontos acumulados</p>
        {rewards.level !== 'Premium' && (
          <>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-sage rounded-full transition-all duration-700" style={{ width: `${progressToNext}%` }} />
            </div>
            <p className="text-[11px] text-white/50 mt-1.5">
              {Math.max(0, (nextLevelPts[rewards.level] || 500) - rewards.total)} pts para o próximo nível
            </p>
          </>
        )}
      </div>

      {/* Contadores */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white/5 border border-white/15 rounded-2xl p-4">
          <p className="text-[11px] uppercase tracking-widest text-white/60 mb-1">Indicados</p>
          <p className="text-2xl font-serif">{rewards.referralsCount}</p>
        </div>
        <div className="bg-white/5 border border-white/15 rounded-2xl p-4">
          <p className="text-[11px] uppercase tracking-widest text-white/60 mb-1">Convertidos</p>
          <p className="text-2xl font-serif sage-green">{rewards.registeredCount}</p>
        </div>
      </div>

      {/* Link de indicação pessoal */}
      <div className="bg-white/5 border border-white/15 rounded-2xl p-4 mb-6">
        <p className="text-[11px] uppercase tracking-widest text-white/60 mb-2">Seu link exclusivo</p>
        <div className="flex items-center space-x-2">
          <p className="text-xs text-sage flex-1 truncate font-mono">{referralLink}</p>
          <button
            onClick={handleCopyLink}
            className="flex-shrink-0 px-3 py-1.5 bg-white/10 text-[11px] font-bold rounded-lg hover:bg-white/15 transition-all"
          >
            Copiar
          </button>
        </div>
      </div>

      {/* Regras */}
      <div className="space-y-3 mb-8">
        <h4 className="text-xs uppercase tracking-widest text-white/60 px-1">Regras de Ouro</h4>
        <div className="bg-white/5 border border-white/15 rounded-2xl p-4 space-y-3">
          {[
            { label: 'Indicou um amigo', pts: '+50 pts' },
            { label: 'Amigo realizou procedimento', pts: '+200 pts' },
            { label: '3 convertidos → nível Avançado', pts: '🏆' },
            { label: '10 convertidos → sorteio de procedimento grátis', pts: '🎁' },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between text-xs">
              <span className="text-white/60">{item.label}</span>
              <span className="sage-green font-bold">{item.pts}</span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleShare}
        className="mt-auto w-full py-4 bg-sage text-[#1A1A1B] font-semibold rounded-2xl flex items-center justify-center space-x-2 shadow-lg shadow-sage/20 active:scale-95 transition-all"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.445 0 .081 5.391.079 11.99c0 2.108.552 4.167 1.599 5.996L0 24l6.135-1.61a11.893 11.893 0 005.912 1.569h.005c6.608 0 11.971-5.391 11.973-11.99a11.85 11.85 0 00-3.488-8.482"/>
        </svg>
        <span>Convidar via WhatsApp</span>
      </button>
    </div>
  );
};

export default RewardsView;
