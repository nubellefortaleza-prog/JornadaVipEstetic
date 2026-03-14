
import React, { useState, useRef } from 'react';

interface EvolutionEntry {
  id: string;
  date: string;
  note: string;
  photoUrl?: string;
}

// TODO: Migrar para apiService quando endpoint de evolução estiver disponível no CRM
const STORAGE_KEY = 'jvip_evolution_entries';

interface Props {
  onBack: () => void;
}

const EvolutionView: React.FC<Props> = ({ onBack }) => {
  const [entries, setEntries] = useState<EvolutionEntry[]>(() =>
    JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  );
  const [note, setNote] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!note && !previewUrl) return;
    const newEntry: EvolutionEntry = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      note,
      photoUrl: previewUrl || undefined,
    };
    const updated = [newEntry, ...entries];
    setEntries(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setNote('');
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = (id: string) => {
    const updated = entries.filter(e => e.id !== id);
    setEntries(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="flex flex-col flex-1 pb-10">
      <div className="flex items-center space-x-4 mb-6">
        <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h2 className="text-xl font-serif">Diário de Evolução</h2>
          <p className="text-xs text-white/60">Acompanhe sua transformação</p>
        </div>
      </div>

      {/* Formulário de Nova Entrada */}
      <div className="bg-white/5 border border-white/15 rounded-3xl p-5 mb-6">
        <h4 className="text-xs font-bold uppercase tracking-widest text-white/60 mb-4">Registrar Hoje</h4>

        {/* Upload de Foto */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-32 bg-white/5 border border-dashed border-white/30 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition-all mb-4 overflow-hidden"
        >
          {previewUrl ? (
            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover rounded-2xl" />
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white/50 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-xs text-white/50">Toque para adicionar foto</span>
            </>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handlePhotoSelect}
        />

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-sm outline-none focus:border-sage/50 transition-colors min-h-[80px] mb-4"
          placeholder="Como está sua pele hoje? Conte sobre sua evolução..."
        />

        <button
          onClick={handleSave}
          disabled={!note && !previewUrl}
          className="w-full py-3 bg-sage text-[#1A1A1B] font-semibold rounded-xl disabled:opacity-30 transition-all active:scale-95"
        >
          Salvar Registro
        </button>
      </div>

      {/* Histórico */}
      <div className="space-y-4">
        <h4 className="text-xs uppercase tracking-widest text-white/60 px-1">Histórico de Evolução</h4>

        {entries.length === 0 ? (
          <div className="bg-white/5 border border-white/15 rounded-2xl p-8 text-center">
            <p className="text-sm text-white/50">Nenhum registro ainda.</p>
            <p className="text-xs text-white/50 mt-1">Comece documentando sua jornada!</p>
          </div>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="bg-white/5 border border-white/15 rounded-2xl overflow-hidden">
              {entry.photoUrl && (
                <img src={entry.photoUrl} alt="Evolução" className="w-full h-48 object-cover" />
              )}
              <div className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[11px] text-white/50 uppercase tracking-wider">{formatDate(entry.date)}</span>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="text-[11px] text-red-400/50 hover:text-red-400 transition-colors"
                  >
                    Remover
                  </button>
                </div>
                {entry.note && <p className="text-sm text-white/70 leading-relaxed">{entry.note}</p>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default EvolutionView;
