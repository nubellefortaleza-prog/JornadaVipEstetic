
import React, { useState, useRef } from 'react';
import { AnamnesisData } from '../types';

interface Props {
  onComplete: (data: AnamnesisData, selfieDataUrl?: string) => void;
}

const AnamnesisView: React.FC<Props> = ({ onComplete }) => {
  const [currentBlock, setCurrentBlock] = useState(0);
  const [data, setData] = useState<Partial<AnamnesisData>>({
    pregnancy: false,
    habits: { sun: 'baixa', sleep: '7-8h', smoking: false, skincare: 'básico' }
  });
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const blocks = [
    { title: "Saude", subtitle: "Historico medico e alergias" },
    { title: "Habitos", subtitle: "Estilo de vida e rotina" },
    { title: "Expectativas", subtitle: "Historico e objetivos" },
    { title: "Sua Foto", subtitle: "Registre seu momento atual" },
  ];

  const progress = ((currentBlock + 1) / blocks.length) * 100;

  const handleSelfieSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setSelfiePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleNext = () => {
    if (currentBlock < blocks.length - 1) {
      setCurrentBlock(currentBlock + 1);
    } else {
      onComplete(data as AnamnesisData, selfiePreview || undefined);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-serif text-white/90 mb-1">Anamnese</h2>
        <p className="text-xs text-white/60">{blocks[currentBlock].subtitle}</p>
      </div>

      {/* Barra de Progresso */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          {blocks.map((block, i) => (
            <span
              key={i}
              className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${
                i <= currentBlock ? 'sage-green' : 'text-white/50'
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
          <span className="text-[11px] text-white/50">{currentBlock + 1} de {blocks.length}</span>
        </div>
      </div>

      <div className="space-y-6 flex-1">
        {currentBlock === 0 && (
          <>
            <div>
              <label className="text-xs text-white/60 block mb-2">Possui doencas cronicas ou condicoes de saude?</label>
              <textarea
                className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 min-h-[100px] outline-none focus:border-sage/50 transition-colors"
                placeholder="Ex: Diabetes, Hipertensao..."
                value={data.healthGeneral || ''}
                onChange={(e) => setData({...data, healthGeneral: e.target.value})}
              />
            </div>
            <div>
              <label className="text-xs text-white/60 block mb-2">Possui alergias alimentares ou medicamentosas?</label>
              <input
                className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 outline-none focus:border-sage/50 transition-colors"
                placeholder="Ex: Iodo, Dipirona, Latex..."
                value={data.allergies || ''}
                onChange={(e) => setData({...data, allergies: e.target.value})}
              />
            </div>
            <div>
              <label className="text-xs text-white/60 block mb-2">Faz uso de algum medicamento continuo?</label>
              <input
                className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 outline-none focus:border-sage/50 transition-colors"
                placeholder="Ex: Anticoagulante, Isotretinoina..."
                value={data.medications || ''}
                onChange={(e) => setData({...data, medications: e.target.value})}
              />
            </div>
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/15">
              <span className="text-sm">Gestante ou pode estar gravida?</span>
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
              <label className="text-xs text-white/60 block mb-2">Exposicao solar diaria</label>
              <select
                className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 outline-none focus:border-sage/50 transition-colors"
                value={data.habits?.sun || 'baixa'}
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
                className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 outline-none focus:border-sage/50 transition-colors"
                value={data.habits?.sleep || '7-8h'}
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
                className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 outline-none focus:border-sage/50 transition-colors"
                value={data.habits?.skincare || 'básico'}
                onChange={(e) => setData({...data, habits: {...data.habits!, skincare: e.target.value}})}
              >
                <option value="nenhum">Nenhuma rotina</option>
                <option value="básico">Basica (limpeza + hidratante)</option>
                <option value="completo">Completa (com ativos e FPS)</option>
              </select>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/15">
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
              <label className="text-xs text-white/60 block mb-2">Procedimentos que ja realizou</label>
              <textarea
                className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 min-h-[80px] outline-none focus:border-sage/50 transition-colors"
                placeholder="Ex: Botox ha 6 meses, preenchimento labial..."
                value={data.pastProcedures || ''}
                onChange={(e) => setData({...data, pastProcedures: e.target.value})}
              />
            </div>
            <div>
              <label className="text-xs text-white/60 block mb-2">Qual o resultado esperado ao final do tratamento?</label>
              <textarea
                className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 min-h-[100px] outline-none focus:border-sage/50 transition-colors"
                placeholder="Descreva seu sonho..."
                value={data.expectedResult || ''}
                onChange={(e) => setData({...data, expectedResult: e.target.value})}
              />
            </div>
          </>
        )}

        {/* Bloco 4: Selfie */}
        {currentBlock === 3 && (
          <div className="flex flex-col items-center space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-serif text-white/90 mb-2">Registre seu momento</h3>
              <p className="text-xs text-white/50 max-w-[280px]">
                Tire uma selfie para marcar o inicio da sua jornada. Esta foto sera usada no seu perfil.
              </p>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-40 h-40 rounded-full bg-white/5 border-2 border-dashed border-[#AABAA4]/40 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-all overflow-hidden"
            >
              {selfiePreview ? (
                <img src={selfiePreview} alt="Selfie" className="w-full h-full object-cover rounded-full" />
              ) : (
                <div className="text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#AABAA4]/60 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-xs text-white/40">Toque para tirar foto</span>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={handleSelfieSelect}
            />

            {selfiePreview && (
              <button
                onClick={() => { setSelfiePreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                className="text-xs text-white/40 hover:text-white/60"
              >
                Tirar outra foto
              </button>
            )}

            <p className="text-[10px] text-white/30 text-center">
              {selfiePreview ? 'Foto capturada! Clique em Finalizar.' : 'Voce pode pular esta etapa.'}
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-8 mb-6">
        {currentBlock > 0 && (
          <button
            onClick={() => setCurrentBlock(currentBlock - 1)}
            className="py-4 px-6 bg-white/10 text-white font-medium rounded-2xl transition-all active:scale-95"
          >
            Voltar
          </button>
        )}
        <button
          onClick={handleNext}
          className="flex-1 py-4 bg-sage text-[#1A1A1B] font-semibold rounded-2xl shadow-lg shadow-sage/10 transition-all active:scale-95"
        >
          {currentBlock === blocks.length - 1
            ? (selfiePreview ? 'Finalizar com Foto' : 'Finalizar sem Foto')
            : 'Proximo'}
        </button>
      </div>
    </div>
  );
};

export default AnamnesisView;
