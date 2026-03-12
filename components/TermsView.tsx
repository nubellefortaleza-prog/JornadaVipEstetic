
import React from 'react';

interface Props {
  onAccept: () => void;
}

const TermsView: React.FC<Props> = ({ onAccept }) => {
  return (
    <div className="flex flex-col flex-1">
      <h2 className="text-2xl font-serif mb-8 text-white/90">Privacidade e Consentimento</h2>
      
      <div className="space-y-6 overflow-y-auto max-h-[60vh] pr-2 custom-scroll">
        <section className="bg-white/5 p-4 rounded-xl border border-white/10">
          <div className="flex items-start space-x-4">
            <input type="checkbox" defaultChecked className="mt-1 accent-sage" />
            <div>
              <h3 className="text-sm font-semibold mb-1">Consentimento LGPD</h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Autorizo o tratamento de meus dados pessoais sensíveis para fins de acompanhamento clínico.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-sage/5 p-4 rounded-xl border border-sage/30 ring-1 ring-sage/20">
          <div className="flex items-start space-x-4">
            <input type="checkbox" defaultChecked className="mt-1 accent-sage" />
            <div>
              <h3 className="text-sm font-semibold mb-1 sage-green">Rastreamento de Comportamento Digital</h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Autorizo o rastreio anônimo de comportamento em outros apps e padrões de digitação para que a clínica entenda meu humor e necessidades psicológicas, personalizando minha jornada.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-white/5 p-4 rounded-xl border border-white/10">
          <div className="flex items-start space-x-4">
            <input type="checkbox" defaultChecked className="mt-1 accent-sage" />
            <div>
              <h3 className="text-sm font-semibold mb-1">Uso de Imagens</h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Autorizo o armazenamento de fotos para o meu diário de evolução pessoal.
              </p>
            </div>
          </div>
        </section>
      </div>

      <button 
        onClick={onAccept}
        className="mt-12 w-full py-4 bg-sage text-[#1A1A1B] font-semibold rounded-2xl hover:bg-sage/90 transition-all active:scale-95 shadow-lg shadow-sage/10"
      >
        Aceitar e Continuar
      </button>
    </div>
  );
};

export default TermsView;
