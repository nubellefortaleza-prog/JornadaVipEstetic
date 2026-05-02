
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
  const model = "gemini-3-flash-preview";

  const behaviorContext = profile.behavioralData ? `
    DADOS DE COMPORTAMENTO DIGITAL (Últimas 24h):
    - Escrita em outros apps: ${profile.behavioralData.externalKeystrokesSummary}
    - Apps mais usados/Humor: ${profile.behavioralData.appUsageBehavior}
    - Humor relatado: ${profile.behavioralData.moodCheckin || profile.moodCheckin || 'Não informado'}
  ` : `
    - Humor relatado: ${profile.moodCheckin || 'Não informado'}
    - Dados comportamentais não disponíveis.
  `;

  const prompt = `
    Analise os dados deste paciente VIP e gere um relatório estratégico para o CRM da clínica.
    O objetivo é preparar o profissional para a consulta de amanhã.

    PACIENTE:
    - Nome: ${profile.name}
    - Objetivo: ${profile.objective}
    - Estilo desejado: ${profile.style}

    ANAMNESE:
    - Saúde/Condições: ${anamnesis.healthGeneral || 'Não informado'}
    - Alergias: ${anamnesis.allergies || 'Nenhuma'}
    - Medicamentos em uso: ${anamnesis.medications || 'Nenhum'}
    - Gestante: ${anamnesis.pregnancy ? 'Sim' : 'Não'}
    - Procedimentos anteriores: ${anamnesis.pastProcedures || 'Nenhum'}
    - Resultado esperado: ${anamnesis.expectedResult || 'Não descrito'}

    ${behaviorContext}

    Gere um relatório estruturado:
    1. PERFIL COMPLETO: Quem é o paciente (hobbies, trabalho, humor atual).
    2. ANÁLISE DE EXPECTATIVA: O humor digital condiz com o resultado esperado?
    3. ALERTAS CLÍNICOS: Contraindicações ou cuidados especiais baseados na anamnese.
    4. ALERTA PSICOLÓGICO/SAÚDE: Há sinais de ansiedade ou doenças mencionadas externamente?
    5. CRONOGRAMA DE ABORDAGEM: Como o recepcionista e o médico devem falar com ele amanhã.
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
  const model = "gemini-3-flash-preview";
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
