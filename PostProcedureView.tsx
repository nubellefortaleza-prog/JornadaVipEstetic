
import React, { useState } from 'react';
import { AnamnesisData } from '../types';

interface Props {
  onComplete: (data: AnamnesisData) => void;
}

const AnamnesisView: React.FC<Props> = ({ onComplete }) => {
  const [currentBlock, setCurrentBlock] = useState(0);
  const [data, setData] = useState<Partial<AnamnesisData>>({
    pregnancy: false,
    habits: { sun: 'baixa', sleep: '7-8h', smoking: false, skincare: 'básico' }
  });

  const blocks = [
    { title: "Saúde Geral", subtitle: "Histórico médico e alergias" },
    { title: "Hábitos", subtitle: "Estilo de vida e rotina" },
    { title: "Expectativas", subtitle: "Histórico e objetivos" }
  ];

  const progress = ((currentBlock + 1) / blocks.length) * 100;

  const handleNext = () => {
    if (currentBlock < blocks.length - 1) {
      setCurrentBlock(currentBlock + 1);
    } else {
      onComplete(data as AnamnesisData);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-serif text-white/90 mb-1">Anamnese</h2>
        <p className="text-xs text-white/40">{blocks[currentBlock].subtitle}</p>
      </div>

      {/* Barra de Progresso */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          {blocks.map((block, i) => (
            <span
              key={i}
              className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${
                i <= currentBlock ? 'sage-green' : 'text-white/20'
              }`}
            >
              {block.title}
            </span>
          ))}
        </div>
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-sage rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-end mt-1">
          <span className="text-[10px] text-white/30">{currentBlock + 1} de {blocks.length}</span>
        </div>
      </div>

      <div className="space-y-6 flex-1">
        {currentBlock === 0 && (
          <>
            <div>
              <label className="text-xs text-white/60 block mb-2">Possui doenças crônicas ou condições de saúde?</label>
              <textarea
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 min-h-[100px] outline-none focus:border-sage/50 transition-colors"
                placeholder="Ex: Diabetes, Hipertensão..."
                onChange={(e) => setData({...data, healthGeneral: e.target.value})}
              />
            </div>
            <div>
              <label className="text-xs text-white/60 block mb-2">Possui alergias alimentares ou medicamentosas?</label>
              <input
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-sage/50 transition-colors"
                placeholder="Ex: Iodo, Dipirona, Latex..."
                onChange={(e) => setData({...data, allergies: e.target.value})}
              />
            </div>
            <div>
              <label className="text-xs text-white/60 block mb-2">Faz uso de algum medicamento contínuo?</label>
              <input
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-sage/50 transition-colors"
                placeholder="Ex: Anticoagulante, Isotretinoína..."
                onChange={(e) => setData({...data, medications: e.target.value})}
              />
            </div>
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
              <span className="text-sm">Gestante ou pode estar grávida?</span>
              <button
                onClick={() => setData({...data, pregnancy: !data.pregnancy})}
                className={`w-12 h-6 rounded-full relative transition-colors ${data.pregnancy ? 'bg-sage' : 'bg-white/10'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${data.pregnancy ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
          </>
        )}

        {currentBlock === 1 && (
          <>
            <div>
              <label className="text-xs text-white/60 block mb-2">Exposição solar diária</label>
              <select
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-sage/50 transition-colors"
                onChange={(e) => setData({...data, habits: {...data.habits!, sun: e.target.value}})}
              >
                <option value="baixa">Baixa (Ambiente interno)</option>
                <option value="moderada">Moderada (Uso casual)</option>
                <option value="alta">Alta (Atividades externas)</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-white/60 block mb-2">Horas de sono por noite</label>
              <select
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-sage/50 transition-colors"
                onChange={(e) => setData({...data, habits: {...data.habits!, sleep: e.target.value}})}
              >
                <option value="menos de 6h">Menos de 6h</option>
                <option value="6-7h">6 a 7h</option>
                <option value="7-8h">7 a 8h</option>
                <option value="mais de 8h">Mais de 8h</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-white/60 block mb-2">Rotina de skincare</label>
              <select
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-sage/50 transition-colors"
                onChange={(e) => setData({...data, habits: {...data.habits!, skincare: e.target.value}})}
              >
                <option value="nenhum">Nenhuma rotina</option>
                <option value="básico">Básica (limpeza + hidratante)</option>
                <option value="completo">Completa (com ativos e FPS)</option>
              </select>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
              <span className="text-sm">Tabagismo</span>
              <button
                onClick={() => setData({...data, habits: {...data.habits!, smoking: !data.habits?.smoking}})}
                className={`w-12 h-6 rounded-full relative transition-colors ${data.habits?.smoking ? 'bg-sage' : 'bg-white/10'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${data.habits?.smoking ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
          </>
        )}

        {currentBlock === 2 && (
          <>
            <div>
              <label className="text-xs text-white/60 block mb-2">Procedimentos que já realizou</label>
              <textarea
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 min-h-[80px] outline-none focus:border-sage/50 transition-colors"
                placeholder="Ex: Botox há 6 meses, preenchimento labial..."
                onChange={(e) => setData({...data, pastProcedures: e.target.value})}
              />
            </div>
            <div>
              <label className="text-xs text-white/60 block mb-2">Qual o resultado esperado ao final do tratamento?</label>
              <textarea
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 min-h-[100px] outline-none focus:border-sage/50 transition-colors"
                placeholder="Descreva seu sonho..."
                onChange={(e) => setData({...data, expectedResult: e.target.value})}
              />
            </div>
          </>
        )}
      </div>

      <button
        onClick={handleNext}
        className="mt-8 mb-6 w-full py-4 bg-sage text-[#1A1A1B] font-semibold rounded-2xl shadow-lg shadow-sage/10 transition-all active:scale-95"
      >
        {currentBlock === blocks.length - 1 ? "Confirmar e Finalizar" : "Próximo"}
      </button>
    </div>
  );
};

export default AnamnesisView;
