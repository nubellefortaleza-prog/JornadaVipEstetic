
import React, { useState } from 'react';
import { CONFIG } from '../services/config';

const WHATSAPP_NUMBER = CONFIG.WHATSAPP_NUMBER;

interface Props {
  onBack: () => void;
}

const PostProcedureView: React.FC<Props> = ({ onBack }) => {
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

  const careItems = [
    { period: "Primeiras 4h", desc: "Não toque na área tratada. Evite maquiagem.", icon: "🚫" },
    { period: "1º dia", desc: "Mantenha o local limpo e hidratado com o produto indicado.", icon: "💧" },
    { period: "D+2 a D+5", desc: "Use protetor solar SPF 50 mesmo em dias nublados.", icon: "☀️" },
    { period: "1ª semana", desc: "Evite atividades físicas intensas e saunas.", icon: "🏃" },
    { period: "15 dias", desc: "Não faça procedimentos estéticos na mesma área.", icon: "⏰" },
    { period: "1 mês", desc: "Retorno de avaliação com a especialista.", icon: "📅" },
  ];

  const toggleItem = (i: number) => {
    setCheckedItems(prev => ({ ...prev, [i]: !prev[i] }));
  };

  const completedCount = Object.values(checkedItems).filter(Boolean).length;
  const progress = (completedCount / careItems.length) * 100;

  const openWhatsApp = () => {
    const msg = encodeURIComponent('Olá! Preciso de ajuda com os cuidados pós-procedimento.');
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank');
  };

  return (
    <div className="flex flex-col flex-1 pb-10">
      <div className="flex items-center space-x-4 mb-6">
        <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h2 className="text-xl font-serif">Cuidados Pós-Procedimento</h2>
          <p className="text-xs text-white/60">Protocolo VIP de recuperação</p>
        </div>
      </div>

      {/* Progresso dos Cuidados */}
      <div className="bg-sage/5 border border-sage/20 rounded-3xl p-5 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-white/60">Seu protocolo de cuidados</span>
          <span className="text-xs font-bold sage-green">{completedCount}/{careItems.length} concluídos</span>
        </div>
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-sage rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Lista de Cuidados */}
      <div className="space-y-3 mb-6">
        <h4 className="text-xs uppercase tracking-widest text-white/60 px-1">Protocolo de Recuperação</h4>
        {careItems.map((item, i) => (
          <button
            key={i}
            onClick={() => toggleItem(i)}
            className={`w-full flex items-center space-x-4 p-4 rounded-2xl border text-left transition-all ${
              checkedItems[i] ? 'bg-sage/5 border-sage/30' : 'bg-white/5 border-white/15 hover:bg-white/8'
            }`}
          >
            <span className="text-xl flex-shrink-0">{item.icon}</span>
            <div className="flex-1">
              <p className={`text-xs font-bold ${checkedItems[i] ? 'sage-green' : 'text-white/60'}`}>{item.period}</p>
              <p className={`text-[11px] ${checkedItems[i] ? 'text-white/50 line-through' : 'text-white/70'}`}>{item.desc}</p>
            </div>
            <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${checkedItems[i] ? 'bg-sage border-sage' : 'border-white/30'}`}>
              {checkedItems[i] && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-[#1A1A1B]" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Alerta Importante */}
      <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 mb-6">
        <p className="text-[11px] font-bold uppercase tracking-wider text-red-400 mb-1">⚠️ Sinais de Alerta</p>
        <p className="text-xs text-white/60 leading-relaxed">
          Em caso de dor intensa, inchaço excessivo, febre ou vermelhidão persistente após 48h, entre em contato imediatamente com a clínica.
        </p>
      </div>

      {/* Botão WhatsApp */}
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

export default PostProcedureView;
