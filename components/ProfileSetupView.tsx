
import React, { useState } from 'react';
import { PatientProfile } from '../types';
import { validatePatientProfile, isValidCPF, isValidPhone, isValidEmail, ValidationError } from '../services/validation';

interface Props {
  onComplete: (data: Omit<PatientProfile, 'id' | 'createdAt'>) => void;
}

const ProfileSetupView: React.FC<Props> = ({ onComplete }) => {
  const [form, setForm] = useState<Partial<PatientProfile>>({
    name: '',
    style: 'natural',
    commPreference: 'simples'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.name || form.name.trim().length < 2) {
      newErrors.name = 'Nome obrigatório (mínimo 2 caracteres)';
    }
    if (form.cpf && !isValidCPF(form.cpf)) {
      newErrors.cpf = 'CPF inválido';
    }
    if (form.phone && !isValidPhone(form.phone)) {
      newErrors.phone = 'Telefone inválido';
    }
    if (form.email && !isValidEmail(form.email)) {
      newErrors.email = 'E-mail inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onComplete(form as Omit<PatientProfile, 'id' | 'createdAt'>);
  };

  const isFormValid = !!form.name && form.name.trim().length > 0;

  return (
    <div className="flex flex-col flex-1 pb-10">
      <h2 className="text-2xl font-serif mb-6 text-white/90">Seu Perfil</h2>
      
      <div className="space-y-5">
        <div>
          <label className="text-[10px] uppercase tracking-widest text-white/40 ml-1">Nome Completo</label>
          <input
            className={`w-full bg-white/5 border rounded-xl px-4 py-3 focus:border-sage outline-none transition-colors ${errors.name ? 'border-red-400/50' : 'border-white/10'}`}
            placeholder="Ex: Maria Silva"
            value={form.name}
            onChange={(e) => { setForm({...form, name: e.target.value}); setErrors(prev => ({ ...prev, name: '' })); }}
          />
          {errors.name && <p className="text-[10px] text-red-400/80 mt-1 ml-1">{errors.name}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-white/40 ml-1">CPF</label>
            <input
              className={`w-full bg-white/5 border rounded-xl px-4 py-3 focus:border-sage outline-none ${errors.cpf ? 'border-red-400/50' : 'border-white/10'}`}
              placeholder="000.000.000-00"
              onChange={(e) => { setForm({...form, cpf: e.target.value}); setErrors(prev => ({ ...prev, cpf: '' })); }}
            />
            {errors.cpf && <p className="text-[10px] text-red-400/80 mt-1 ml-1">{errors.cpf}</p>}
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-white/40 ml-1">Telefone</label>
            <input
              className={`w-full bg-white/5 border rounded-xl px-4 py-3 focus:border-sage outline-none ${errors.phone ? 'border-red-400/50' : 'border-white/10'}`}
              placeholder="(85) 99999-9999"
              onChange={(e) => { setForm({...form, phone: e.target.value}); setErrors(prev => ({ ...prev, phone: '' })); }}
            />
            {errors.phone && <p className="text-[10px] text-red-400/80 mt-1 ml-1">{errors.phone}</p>}
          </div>
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-widest text-white/40 ml-1">Objetivo Principal</label>
          <select 
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-sage outline-none appearance-none"
            onChange={(e) => setForm({...form, objective: e.target.value})}
          >
            <option value="">Selecione...</option>
            <option value="melhorar linhas">Melhorar linhas de expressão</option>
            <option value="realçar lábios">Realçar lábios</option>
            <option value="melhorar manchas">Melhorar manchas</option>
            <option value="contorno facial">Definir contorno facial</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-widest text-white/40 ml-1">Estilo de Resultado</label>
          <div className="flex space-x-2 mt-1">
            {['natural', 'marcante', 'discreto'].map((s) => (
              <button
                key={s}
                onClick={() => setForm({...form, style: s as any})}
                className={`flex-1 py-2 text-xs rounded-lg border transition-all ${form.style === s ? 'bg-sage/20 border-sage text-sage' : 'border-white/10 text-white/60'}`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4">
          <label className="text-[10px] uppercase tracking-widest text-white/40 ml-1">Sua primeira foto (Selfie)</label>
          <div className="mt-2 w-full h-40 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center bg-white/5 hover:bg-white/10 cursor-pointer transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white/20 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-xs text-white/40">Clique para tirar ou enviar</span>
          </div>
        </div>
      </div>

      <button 
        disabled={!isFormValid}
        onClick={handleSubmit}
        className={`mt-8 w-full py-4 bg-sage text-[#1A1A1B] font-semibold rounded-2xl transition-all shadow-lg shadow-sage/10 ${!isFormValid ? 'opacity-50 cursor-not-allowed' : 'hover:bg-sage/90'}`}
      >
        Continuar para Anamnese
      </button>
    </div>
  );
};

export default ProfileSetupView;
