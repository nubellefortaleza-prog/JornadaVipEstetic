
// ─────────────────────────────────────────────────────────────────────────────
// analyticsService.ts — Rastreamento Ético de Comportamento (LGPD Compliant)
//
// APENAS rastreia ações que o usuário faz DENTRO do app, com total transparência.
// Nada é capturado de outros apps, teclado, câmera ou localização sem ação explícita.
//
// Sugestões de rastreamento externo ao app (requerem consentimento explícito):
//   • Google Analytics 4 / Mixpanel — comportamento de navegação no app
//   • Smartlook (já integrado no index.html) — gravação de tela opt-in
//   • OneSignal — frequência de abertura de notificações
//   • Firebase Analytics — sessões, tempo no app, eventos customizados
// ─────────────────────────────────────────────────────────────────────────────

const ANALYTICS_KEY = 'clinic_analytics';

export interface AnalyticsEvent {
  patientId: string;
  event: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface PatientEngagement {
  patientId: string;
  totalSessions: number;
  lastSeen: string;
  screenVisits: Record<string, number>;     // ex: { dashboard: 12, evolution: 3 }
  featuresUsed: string[];                   // ex: ['checklist_post', 'mood_checkin']
  checklistCompletions: number;
  photosUploaded: number;
  moodHistory: { mood: string; date: string }[];
  notificationsOpened: number;
  referralsSent: number;
}

// ── Internals ────────────────────────────────────────────────────────────────

const getEvents = (): AnalyticsEvent[] =>
  JSON.parse(localStorage.getItem(ANALYTICS_KEY) || '[]');

const appendEvent = (event: AnalyticsEvent) => {
  const events = getEvents();
  // Mantém últimos 500 eventos para não estourar o localStorage
  const trimmed = events.length >= 500 ? events.slice(-499) : events;
  localStorage.setItem(ANALYTICS_KEY, JSON.stringify([...trimmed, event]));
};

// ── API Pública ──────────────────────────────────────────────────────────────

export const track = (patientId: string, event: string, metadata?: Record<string, any>) => {
  appendEvent({ patientId, event, metadata, timestamp: new Date().toISOString() });
};

export const trackScreen = (patientId: string, screen: string) =>
  track(patientId, 'screen_view', { screen });

export const trackFeature = (patientId: string, feature: string) =>
  track(patientId, 'feature_used', { feature });

export const trackMood = (patientId: string, mood: string) =>
  track(patientId, 'mood_checkin', { mood });

export const trackNotificationOpened = (patientId: string, campaignId: string) =>
  track(patientId, 'notification_opened', { campaignId });

export const trackPhotoUploaded = (patientId: string) =>
  track(patientId, 'photo_uploaded');

export const trackReferralSent = (patientId: string) =>
  track(patientId, 'referral_sent');

export const trackChecklistItem = (patientId: string, list: string, item: string) =>
  track(patientId, 'checklist_item_checked', { list, item });

// ── Consolidar Engajamento de um Paciente ────────────────────────────────────

export const getEngagement = (patientId: string): PatientEngagement => {
  const events = getEvents().filter(e => e.patientId === patientId);

  const screenVisits: Record<string, number> = {};
  const featuresUsed = new Set<string>();
  const moodHistory: { mood: string; date: string }[] = [];
  let sessions = 0;
  let checklistCompletions = 0;
  let photosUploaded = 0;
  let notificationsOpened = 0;
  let referralsSent = 0;
  let lastSeen = '';

  for (const e of events) {
    if (!lastSeen || e.timestamp > lastSeen) lastSeen = e.timestamp;
    if (e.event === 'screen_view' && e.metadata?.screen) {
      screenVisits[e.metadata.screen] = (screenVisits[e.metadata.screen] || 0) + 1;
      if (e.metadata.screen === 'dashboard') sessions++;
    }
    if (e.event === 'feature_used' && e.metadata?.feature) {
      featuresUsed.add(e.metadata.feature);
    }
    if (e.event === 'mood_checkin' && e.metadata?.mood) {
      moodHistory.push({ mood: e.metadata.mood, date: e.timestamp });
    }
    if (e.event === 'checklist_item_checked') checklistCompletions++;
    if (e.event === 'photo_uploaded') photosUploaded++;
    if (e.event === 'notification_opened') notificationsOpened++;
    if (e.event === 'referral_sent') referralsSent++;
  }

  return {
    patientId,
    totalSessions: sessions,
    lastSeen,
    screenVisits,
    featuresUsed: Array.from(featuresUsed),
    checklistCompletions,
    photosUploaded,
    moodHistory,
    notificationsOpened,
    referralsSent,
  };
};

// ── Resumo de Todos os Pacientes (para o Admin) ──────────────────────────────

export const getAllEngagements = (patientIds: string[]): PatientEngagement[] =>
  patientIds.map(getEngagement);
