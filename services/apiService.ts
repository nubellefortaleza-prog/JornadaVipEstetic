// ─────────────────────────────────────────────────────────────────────────────
// apiService.ts — Camada de abstração de dados (Repository Pattern)
//
// Esta é a peça central da integração CRM ↔ JornadaVip.
//
// COMO FUNCIONA:
//   - Se VITE_API_BASE_URL estiver definido no .env → usa o backend CRM (REST API)
//   - Se não → usa localStorage como fallback (modo offline / desenvolvimento)
//
// Quando o CRM estiver pronto, basta:
//   1. Definir VITE_API_BASE_URL=https://crm.vipestetic.com.br no .env
//   2. O app automaticamente passa a consumir a API do CRM
//   3. localStorage funciona como cache offline (futuro: sync queue)
//
// ENDPOINTS DO CRM (contrato de integração):
//   GET    /api/jornada/patients/:id          → dados do paciente
//   POST   /api/jornada/patients              → criar paciente
//   PUT    /api/jornada/patients/:id          → atualizar paciente
//   GET    /api/jornada/patients/:id/anamnesis → anamnese
//   POST   /api/jornada/patients/:id/anamnesis → salvar anamnese
//   GET    /api/jornada/patients/:id/reminders → lembretes
//   POST   /api/jornada/patients/:id/reminders → criar lembrete
//   PUT    /api/jornada/patients/:id/reminders/:rid/read → marcar como lido
//   GET    /api/jornada/campaigns              → campanhas
//   POST   /api/jornada/campaigns              → criar campanha
//   GET    /api/jornada/campaigns/pending/:patientId → campanhas pendentes
//   POST   /api/jornada/campaigns/:id/read     → marcar campanha lida
//   POST   /api/jornada/auth/login             → login admin
//   POST   /api/jornada/auth/patient-login     → login paciente (OAuth)
//   POST   /api/ai/chat                        → proxy Gemini chat
//   POST   /api/ai/summary                     → proxy Gemini summary
//   POST   /api/jornada/analytics/event        → registrar evento
//   POST   /api/jornada/analytics/session       → registrar sessão
//   GET    /api/jornada/analytics/engagement/:patientId → engajamento
// ─────────────────────────────────────────────────────────────────────────────

import { PatientProfile, AnamnesisData, PatientRecord, Reminder, AdminUser } from '../types';
import { PopupCampaign } from './notificationService';
import { CONFIG, hasBackend } from './config';
import { httpClient, setTokens, clearTokens } from './httpClient';
import { sanitizeObject, sanitizeText } from './validation';

// ── Helpers localStorage ────────────────────────────────────────────────────

const getRecords = (): PatientRecord[] =>
  JSON.parse(localStorage.getItem(CONFIG.LS_KEYS.RECORDS) || '[]');

const saveRecords = (records: PatientRecord[]): void =>
  localStorage.setItem(CONFIG.LS_KEYS.RECORDS, JSON.stringify(records));

const generateId = (): string =>
  `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;

// ═════════════════════════════════════════════════════════════════════════════
//  PATIENTS
// ═════════════════════════════════════════════════════════════════════════════

export const getPatient = async (patientId: string): Promise<PatientRecord | null> => {
  if (hasBackend()) {
    const res = await httpClient<PatientRecord>(`/api/jornada/patients/${patientId}`);
    return res.success ? res.data! : null;
  }
  return getRecords().find(r => r.profile.id === patientId) ?? null;
};

export const getAllPatients = async (): Promise<PatientRecord[]> => {
  if (hasBackend()) {
    const res = await httpClient<PatientRecord[]>('/api/jornada/patients');
    return res.success ? res.data! : [];
  }
  return getRecords();
};

export const createPatient = async (
  profileData: Omit<PatientProfile, 'id' | 'createdAt'>,
): Promise<PatientRecord> => {
  const sanitized = sanitizeObject(profileData);

  if (hasBackend()) {
    const res = await httpClient<PatientRecord>('/api/jornada/patients', {
      method: 'POST',
      body: sanitized,
    });
    if (res.success) return res.data!;
    throw new Error(res.error || 'Erro ao criar paciente');
  }

  // localStorage fallback
  const profile: PatientProfile = {
    ...sanitized as any,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  const record: PatientRecord = { profile, reminders: [] };
  const records = getRecords();
  records.push(record);
  saveRecords(records);
  return record;
};

export const updatePatient = async (
  patientId: string,
  updates: Partial<PatientProfile>,
): Promise<PatientRecord | null> => {
  const sanitized = sanitizeObject(updates);

  if (hasBackend()) {
    const res = await httpClient<PatientRecord>(`/api/jornada/patients/${patientId}`, {
      method: 'PUT',
      body: sanitized,
    });
    return res.success ? res.data! : null;
  }

  const records = getRecords();
  const idx = records.findIndex(r => r.profile.id === patientId);
  if (idx < 0) return null;
  records[idx].profile = { ...records[idx].profile, ...sanitized };
  saveRecords(records);
  return records[idx];
};

export const deletePatient = async (patientId: string): Promise<boolean> => {
  if (hasBackend()) {
    const res = await httpClient(`/api/jornada/patients/${patientId}`, { method: 'DELETE' });
    return res.success;
  }
  const records = getRecords().filter(r => r.profile.id !== patientId);
  saveRecords(records);
  return true;
};

// ═════════════════════════════════════════════════════════════════════════════
//  ANAMNESIS
// ═════════════════════════════════════════════════════════════════════════════

export const getAnamnesis = async (patientId: string): Promise<AnamnesisData | null> => {
  if (hasBackend()) {
    const res = await httpClient<AnamnesisData>(`/api/jornada/patients/${patientId}/anamnesis`);
    return res.success ? res.data! : null;
  }
  const record = getRecords().find(r => r.profile.id === patientId);
  return record?.anamnesis ?? null;
};

export const saveAnamnesis = async (
  patientId: string,
  anamnesis: AnamnesisData,
): Promise<boolean> => {
  const sanitized = sanitizeObject(anamnesis);

  if (hasBackend()) {
    const res = await httpClient(`/api/jornada/patients/${patientId}/anamnesis`, {
      method: 'POST',
      body: sanitized,
    });
    return res.success;
  }

  const records = getRecords();
  const idx = records.findIndex(r => r.profile.id === patientId);
  if (idx < 0) return false;
  records[idx].anamnesis = sanitized as AnamnesisData;
  saveRecords(records);
  return true;
};

// ═════════════════════════════════════════════════════════════════════════════
//  REMINDERS
// ═════════════════════════════════════════════════════════════════════════════

export const getReminders = async (patientId: string): Promise<Reminder[]> => {
  if (hasBackend()) {
    const res = await httpClient<Reminder[]>(`/api/jornada/patients/${patientId}/reminders`);
    return res.success ? res.data! : [];
  }
  const record = getRecords().find(r => r.profile.id === patientId);
  return record?.reminders ?? [];
};

export const createReminder = async (
  patientId: string,
  reminder: Omit<Reminder, 'id' | 'patientId' | 'read'>,
): Promise<Reminder> => {
  const sanitized = sanitizeObject(reminder);
  const full: Reminder = {
    ...sanitized as any,
    id: generateId(),
    patientId,
    read: false,
  };

  if (hasBackend()) {
    const res = await httpClient<Reminder>(`/api/jornada/patients/${patientId}/reminders`, {
      method: 'POST',
      body: full,
    });
    return res.success ? res.data! : full;
  }

  const records = getRecords();
  const idx = records.findIndex(r => r.profile.id === patientId);
  if (idx >= 0) {
    records[idx].reminders.push(full);
    saveRecords(records);
  }
  return full;
};

export const markReminderRead = async (patientId: string, reminderId: string): Promise<boolean> => {
  if (hasBackend()) {
    const res = await httpClient(`/api/jornada/patients/${patientId}/reminders/${reminderId}/read`, {
      method: 'PUT',
    });
    return res.success;
  }

  const records = getRecords();
  const idx = records.findIndex(r => r.profile.id === patientId);
  if (idx < 0) return false;
  const rIdx = records[idx].reminders.findIndex(r => r.id === reminderId);
  if (rIdx < 0) return false;
  records[idx].reminders[rIdx].read = true;
  saveRecords(records);
  return true;
};

// ═════════════════════════════════════════════════════════════════════════════
//  CAMPAIGNS
// ═════════════════════════════════════════════════════════════════════════════

export const getCampaigns = async (): Promise<PopupCampaign[]> => {
  if (hasBackend()) {
    const res = await httpClient<PopupCampaign[]>('/api/jornada/campaigns');
    return res.success ? res.data! : [];
  }
  return JSON.parse(localStorage.getItem(CONFIG.LS_KEYS.CAMPAIGNS) || '[]');
};

export const createCampaign = async (
  campaign: Omit<PopupCampaign, 'id' | 'createdAt' | 'readBy'>,
): Promise<PopupCampaign> => {
  const sanitized = sanitizeObject(campaign);
  const full: PopupCampaign = {
    ...sanitized as any,
    id: generateId(),
    createdAt: new Date().toISOString(),
    readBy: [],
  };

  if (hasBackend()) {
    const res = await httpClient<PopupCampaign>('/api/jornada/campaigns', {
      method: 'POST',
      body: full,
    });
    return res.success ? res.data! : full;
  }

  const campaigns = JSON.parse(localStorage.getItem(CONFIG.LS_KEYS.CAMPAIGNS) || '[]');
  campaigns.push(full);
  localStorage.setItem(CONFIG.LS_KEYS.CAMPAIGNS, JSON.stringify(campaigns));
  return full;
};

export const getPendingCampaigns = async (patientId: string): Promise<PopupCampaign[]> => {
  if (hasBackend()) {
    const res = await httpClient<PopupCampaign[]>(`/api/jornada/campaigns/pending/${patientId}`);
    return res.success ? res.data! : [];
  }

  const now = new Date();
  const campaigns: PopupCampaign[] = JSON.parse(
    localStorage.getItem(CONFIG.LS_KEYS.CAMPAIGNS) || '[]',
  );
  return campaigns.filter(c => {
    if (c.readBy.includes(patientId)) return false;
    if (c.scheduledAt && new Date(c.scheduledAt) > now) return false;
    if (c.targetPatientIds === 'all') return true;
    return (c.targetPatientIds as string[]).includes(patientId);
  });
};

export const markCampaignRead = async (campaignId: string, patientId: string): Promise<boolean> => {
  if (hasBackend()) {
    const res = await httpClient(`/api/jornada/campaigns/${campaignId}/read`, {
      method: 'POST',
      body: { patientId },
    });
    return res.success;
  }

  const campaigns: PopupCampaign[] = JSON.parse(
    localStorage.getItem(CONFIG.LS_KEYS.CAMPAIGNS) || '[]',
  );
  const updated = campaigns.map(c =>
    c.id === campaignId ? { ...c, readBy: [...c.readBy, patientId] } : c,
  );
  localStorage.setItem(CONFIG.LS_KEYS.CAMPAIGNS, JSON.stringify(updated));
  return true;
};

// ═════════════════════════════════════════════════════════════════════════════
//  AUTH — Admin
// ═════════════════════════════════════════════════════════════════════════════

export interface LoginResult {
  success: boolean;
  user?: AdminUser;
  error?: string;
}

export const adminLogin = async (username: string, password: string): Promise<LoginResult> => {
  const cleanUser = sanitizeText(username);

  if (hasBackend()) {
    const res = await httpClient<{ user: AdminUser; accessToken: string; refreshToken: string }>(
      '/api/jornada/auth/login',
      { method: 'POST', body: { username: cleanUser, password }, skipAuth: true },
    );
    if (res.success && res.data) {
      setTokens(res.data.accessToken, res.data.refreshToken);
      return { success: true, user: res.data.user };
    }
    return { success: false, error: res.error || 'Credenciais inválidas' };
  }

  // localStorage fallback — usa adminAuthService existente
  const { adminLogin: localLogin } = await import('./adminAuthService');
  const user = localLogin(cleanUser, password);
  if (user) {
    const { setAdminSession } = await import('./adminAuthService');
    setAdminSession(user);
    return { success: true, user };
  }
  return { success: false, error: 'Credenciais inválidas' };
};

export const adminLogout = async (): Promise<void> => {
  if (hasBackend()) {
    await httpClient('/api/jornada/auth/logout', { method: 'POST' }).catch(() => {});
    clearTokens();
    return;
  }
  const { clearAdminSession } = await import('./adminAuthService');
  clearAdminSession();
};

// ═════════════════════════════════════════════════════════════════════════════
//  AUTH — Patient (OAuth flow)
// ═════════════════════════════════════════════════════════════════════════════

export interface PatientLoginResult {
  success: boolean;
  patient?: PatientRecord;
  isNewPatient?: boolean;
  error?: string;
}

export const patientLogin = async (
  provider: 'google' | 'apple',
  oauthToken: string,
): Promise<PatientLoginResult> => {
  if (hasBackend()) {
    const res = await httpClient<{
      patient: PatientRecord;
      isNewPatient: boolean;
      accessToken: string;
      refreshToken: string;
    }>('/api/jornada/auth/patient-login', {
      method: 'POST',
      body: { provider, token: oauthToken },
      skipAuth: true,
    });
    if (res.success && res.data) {
      setTokens(res.data.accessToken, res.data.refreshToken);
      return {
        success: true,
        patient: res.data.patient,
        isNewPatient: res.data.isNewPatient,
      };
    }
    return { success: false, error: res.error || 'Falha no login' };
  }

  // Modo local: simula login (mesmo comportamento atual)
  return { success: true, isNewPatient: true };
};

// ═════════════════════════════════════════════════════════════════════════════
//  AI — Proxy para Gemini
// ═════════════════════════════════════════════════════════════════════════════

export const aiChat = async (
  message: string,
  history: { role: string; parts: string }[],
): Promise<string> => {
  if (hasBackend()) {
    const res = await httpClient<{ response: string }>('/api/ai/chat', {
      method: 'POST',
      body: { message: sanitizeText(message), history },
    });
    return res.success ? res.data!.response : 'Desculpe, estou com dificuldades. Tente novamente.';
  }

  // Modo local: usa Gemini direto (apenas para dev)
  const { chatWithGemini } = await import('./geminiService');
  return (await chatWithGemini(message, history)) || 'Erro ao processar mensagem.';
};

export const aiSummary = async (
  profile: PatientProfile,
  anamnesis: AnamnesisData,
): Promise<string> => {
  if (hasBackend()) {
    const res = await httpClient<{ summary: string }>('/api/ai/summary', {
      method: 'POST',
      body: { patientId: profile.id },
    });
    return res.success ? res.data!.summary : 'Erro ao gerar resumo.';
  }

  const { getGeminiSummaryForClinic } = await import('./geminiService');
  return (await getGeminiSummaryForClinic(profile, anamnesis)) || 'Erro ao gerar resumo.';
};

// ═════════════════════════════════════════════════════════════════════════════
//  ANALYTICS
// ═════════════════════════════════════════════════════════════════════════════

export const trackEvent = async (
  patientId: string,
  event: string,
  metadata?: Record<string, any>,
): Promise<void> => {
  if (hasBackend()) {
    await httpClient('/api/jornada/analytics/event', {
      method: 'POST',
      body: { patientId, event, metadata, timestamp: new Date().toISOString() },
    }).catch(() => {}); // analytics são fire-and-forget
    return;
  }

  // localStorage fallback
  const { track } = await import('./analyticsService');
  track(patientId, event, metadata);
};

export const trackSessionEvent = async (
  patientId: string,
  context: Record<string, any>,
): Promise<void> => {
  if (hasBackend()) {
    await httpClient('/api/jornada/analytics/session', {
      method: 'POST',
      body: { patientId, ...context },
    }).catch(() => {});
    return;
  }

  const { trackSessionStart } = await import('./analyticsService');
  await trackSessionStart(patientId);
};

// ═════════════════════════════════════════════════════════════════════════════
//  WEBHOOKS (admin)
// ═════════════════════════════════════════════════════════════════════════════

export interface WebhookConfig {
  id: string;
  url: string;
  label: string;
  enabled: boolean;
}

export const getWebhooks = async (): Promise<WebhookConfig[]> => {
  if (hasBackend()) {
    const res = await httpClient<WebhookConfig[]>('/api/jornada/webhooks');
    return res.success ? res.data! : [];
  }
  const raw = JSON.parse(localStorage.getItem(CONFIG.LS_KEYS.WEBHOOKS) || '[]');
  return raw.map((w: any, i: number) => ({ ...w, id: w.id || `wh-${i}` }));
};

export const saveWebhookConfig = async (webhooks: WebhookConfig[]): Promise<void> => {
  if (hasBackend()) {
    await httpClient('/api/jornada/webhooks', { method: 'PUT', body: webhooks });
    return;
  }
  localStorage.setItem(CONFIG.LS_KEYS.WEBHOOKS, JSON.stringify(webhooks));
};
