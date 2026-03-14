
// ─────────────────────────────────────────────────────────────────────────────
// geminiService.ts — Acesso direto ao Gemini (apenas modo dev sem backend)
//
// Em produção, NUNCA use este service diretamente.
// Use apiService.aiChat() e apiService.aiSummary() que fazem proxy pelo CRM.
// Este arquivo só é importado dinamicamente pelo apiService quando USE_LOCAL_STORAGE=true.
// ─────────────────────────────────────────────────────────────────────────────

import { GoogleGenAI } from "@google/genai";
import { PatientProfile, AnamnesisData } from "../types";
import { CONFIG } from "./config";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

export const getGeminiSummaryForClinic = async (profile: PatientProfile, anamnesis: AnamnesisData) => {
  const model = "gemini-2.0-flash";

  const prompt = `
    Analise os dados deste paciente VIP e gere um relatório estratégico para o CRM da clínica.
    O objetivo é preparar o profissional para a consulta.

    PACIENTE:
    - Nome: ${profile.name}
    - Objetivo: ${profile.objective}
    - Estilo desejado: ${profile.style}
    - Humor relatado: ${profile.moodCheckin || 'Não informado'}

    ANAMNESE:
    - Saúde/Condições: ${anamnesis.healthGeneral || 'Não informado'}
    - Alergias: ${anamnesis.allergies || 'Nenhuma'}
    - Medicamentos em uso: ${anamnesis.medications || 'Nenhum'}
    - Gestante: ${anamnesis.pregnancy ? 'Sim' : 'Não'}
    - Procedimentos anteriores: ${anamnesis.pastProcedures || 'Nenhum'}
    - Resultado esperado: ${anamnesis.expectedResult || 'Não descrito'}

    Gere um relatório estruturado:
    1. PERFIL DO PACIENTE: Resumo de quem é o paciente e seus objetivos.
    2. ANÁLISE DE EXPECTATIVA: O resultado esperado é realista para os procedimentos disponíveis?
    3. ALERTAS CLÍNICOS: Contraindicações ou cuidados especiais baseados na anamnese.
    4. ABORDAGEM RECOMENDADA: Como a equipe deve conduzir o atendimento.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Erro ao gerar resumo da IA.";
  }
};

export const chatWithGemini = async (message: string, history: { role: string, parts: string }[]) => {
  const model = "gemini-2.0-flash";
  try {
    const chat = ai.chats.create({
      model,
      config: {
        systemInstruction: `Você é o assistente virtual da ${CONFIG.CLINIC_NAME}. Seja extremamente educado, refinado e utilize termos que transmitam segurança e exclusividade. Ajude o paciente com dúvidas sobre pré e pós-procedimento baseado em protocolos de estética avançada. Nunca faça diagnósticos ou receite medicamentos.`,
      }
    });
    const response = await chat.sendMessage({ message });
    return response.text;
  } catch (error) {
    return "Desculpe, estou tendo dificuldades técnicas.";
  }
};
