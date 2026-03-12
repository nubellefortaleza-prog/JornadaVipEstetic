
import React, { useState } from 'react';

const WHATSAPP_NUMBER = '5500000000000'; // Configure com o número da clínica

interface Props {
  onBack: () => void;
}

const PreProcedureView: React.FC<Props> = ({ onBack }) => {
  const [showMythsFacts, setShowMythsFacts] = useState(false);

  const steps = [
    { title: "D-7", desc: "Evite sol intenso e use protetor solar 3x ao dia.", done: true },
    { title: "D-3", desc: "Suspenda o uso de ácidos e esfoliantes faciais.", done: true },
    { title: "D-1", desc: "Beba bastante água. Evite álcool nas últimas 24h.", done: false },
    { title: "Dia X", desc: "Venha com o rosto limpo, sem maquiagem ou cremes.", done: false }
  ];

  const mythsFacts = [
    { myth: true, text: "O preenchimento deixa o rosto inchado permanentemente." },
    { myth: false, text: "O inchaço pós-procedimento é temporário e regride em poucos dias." },
    { myth: true, text: "Botox paralisa completamente a expressão facial." },
    { myth: false, text: "Aplicado corretamente, o Botox preserva as expressões naturais." },
  ];

  const openWhatsApp = () => {
    const msg = encodeURIComponent('Olá! Tenho dúvidas sobre minha preparação para o procedimento.');
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank');
  };

  return (
    <div className="flex flex-col flex-1 pb-10">
      <div className="flex items-center space-x-4 mb-8">
        <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-xl font-serif">Preparação VIP</h2>
      </div>

      {/* Conteúdo Educativo */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 mb-6">
        <h3 className="text-sm font-semibold mb-2">O que esperar?</h3>
        <p className="text-xs text-white/60 leading-relaxed mb-4">
          O preenchimento é um procedimento minimamente invasivo. Você pode sentir uma leve pressão, mas usamos anestésico para seu total conforto.
        </p>
        <div className="p-3 bg-sage/5 rounded-xl border border-sage/10 text-[10px] sage-green italic">
          "A beleza natural é o resultado de um preparo cuidadoso."
        </div>
      </div>

      {/* Checklist */}
      <div className="space-y-4 mb-6">
        <h4 className="text-xs uppercase tracking-widest text-white/40 px-1">Checklist de Preparo</h4>
        {steps.map((step, i) => (
          <div key={i} className={`flex items-start space-x-4 p-4 rounded-2xl border transition-all ${step.done ? 'bg-sage/5 border-sage/30' : 'bg-white/5 border-white/10'}`}>
            <div className={`mt-1 w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${step.done ? 'bg-sage border-sage' : 'border-white/20'}`}>
              {step.done && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-[#1A1A1B]" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div>
              <p className={`text-xs font-bold ${step.done ? 'sage-green' : 'text-white/40'}`}>{step.title}</p>
              <p className="text-[11px] text-white/60">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Mitos e Verdades */}
      <div className="mb-6">
        <button
          onClick={() => setShowMythsFacts(!showMythsFacts)}
          className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-white/10 transition-all"
        >
          {showMythsFacts ? 'Fechar' : 'Mitos e Verdades sobre o Procedimento'}
        </button>
        {showMythsFacts && (
          <div className="mt-4 space-y-3">
            {mythsFacts.map((item, i) => (
              <div key={i} className={`p-4 rounded-2xl border ${item.myth ? 'bg-red-500/5 border-red-500/20' : 'bg-sage/5 border-sage/20'}`}>
                <span className={`text-[9px] font-bold uppercase tracking-wider ${item.myth ? 'text-red-400' : 'text-sage'}`}>
                  {item.myth ? '✗ Mito' : '✓ Verdade'}
                </span>
                <p className="text-xs text-white/70 mt-1">{item.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Botão WhatsApp */}
      <button
        onClick={openWhatsApp}
        className="w-full py-4 bg-[#25D366]/10 border border-[#25D366]/30 rounded-2xl flex items-center justify-center space-x-3 hover:bg-[#25D366]/20 transition-all"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        <span className="text-sm font-semibold text-[#25D366]">Dúvidas? Fale conosco</span>
      </button>
    </div>
  );
};

export default PreProcedureView;
