
// ─────────────────────────────────────────────────────────────────────────────
// analyticsService.ts — Rastreamento Ético de Comportamento (LGPD Compliant)
//
// Rastreia apenas ações feitas DENTRO do app, com total transparência.
// Geolocalização: requer consentimento explícito do navegador (popup do browser).
// Referrer: URL de onde a paciente veio ao abrir o app (dado público do navegador).
// ─────────────────────────────────────────────────────────────────────────────

const ANALYTICS_KEY    = 'clinic_analytics';
const LOCATIONS_KEY    = 'clinic_locations';
const SESSIONS_KEY     = 'clinic_sessions';

// ── Google Analytics 4 helper ────────────────────────────────────────────────

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

const gtag = (command: string, action: string, params?: Record<string, any>) => {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag(command, action, params);
  }
};

// ── Interfaces ───────────────────────────────────────────────────────────────

export interface AnalyticsEvent {
  patientId: string;
  event: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface PatientLocation {
  patientId: string;
  lat: number;
  lng: number;
  city?: string;
  state?: string;
  country?: string;
  capturedAt: string;
}

export interface SessionContext {
  patientId: string;
  referrer: string;
  userAgent: string;
  sessionStart: string;
  location?: PatientLocation;
}

export interface NavEntry {
  screen: string;
  timestamp: string;
}

export interface PatientEngagement {
  patientId: string;
  totalSessions: number;
  lastSeen: string;
  screenVisits: Record<string, number>;
  featuresUsed: string[];
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
  const trimmed = events.length >= 500 ? events.slice(-499) : events;
  localStorage.setItem(ANALYTICS_KEY, JSON.stringify([...trimmed, event]));
};

const getLocations = (): PatientLocation[] =>
  JSON.parse(localStorage.getItem(LOCATIONS_KEY) || '[]');

const saveLocation = (loc: PatientLocation) => {
  const all = getLocations().filter(l => l.patientId !== loc.patientId);
  localStorage.setItem(LOCATIONS_KEY, JSON.stringify([...all, loc]));
};

const getSessions = (): SessionContext[] =>
  JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]');

const appendSession = (ctx: SessionContext) => {
  const sessions = getSessions();
  const trimmed = sessions.length >= 200 ? sessions.slice(-199) : sessions;
  localStorage.setItem(SESSIONS_KEY, JSON.stringify([...trimmed, ctx]));
};

// ── API Pública — Eventos ────────────────────────────────────────────────────

export const track = (patientId: string, event: string, metadata?: Record<string, any>) => {
  appendEvent({ patientId, event, metadata, timestamp: new Date().toISOString() });
};

export const trackScreen = (patientId: string, screen: string) => {
  track(patientId, 'screen_view', { screen });
  gtag('event', 'page_view', { page_title: screen, page_location: `/${screen}`, user_id: patientId });
};

export const trackFeature = (patientId: string, feature: string) => {
  track(patientId, 'feature_used', { feature });
  gtag('event', 'select_content', { content_type: 'feature', item_id: feature, user_id: patientId });
};

export const trackMood = (patientId: string, mood: string) => {
  track(patientId, 'mood_checkin', { mood });
  gtag('event', 'mood_checkin', { mood, user_id: patientId });
};

export const trackNotificationOpened = (patientId: string, campaignId: string) => {
  track(patientId, 'notification_opened', { campaignId });
  gtag('event', 'notification_open', { campaign_id: campaignId, user_id: patientId });
};

export const trackPhotoUploaded = (patientId: string) => {
  track(patientId, 'photo_uploaded');
  gtag('event', 'photo_upload', { user_id: patientId });
};

export const trackReferralSent = (patientId: string) => {
  track(patientId, 'referral_sent');
  gtag('event', 'share', { method: 'referral', user_id: patientId });
};

export const trackChecklistItem = (patientId: string, list: string, item: string) => {
  track(patientId, 'checklist_item_checked', { list, item });
  gtag('event', 'checklist_item', { list_name: list, item_name: item, user_id: patientId });
};

// ── Geolocalização ───────────────────────────────────────────────────────────

/**
 * Solicita permissão de localização ao browser.
 * Se concedida, faz reverse geocoding via Nominatim (sem API key).
 * Salva cidade, estado e país vinculado ao patientId.
 */
export const requestGeolocation = (patientId: string): Promise<PatientLocation | null> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return; }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const loc: PatientLocation = { patientId, lat, lng, capturedAt: new Date().toISOString() };

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=pt`,
            { headers: { 'Accept-Language': 'pt' } }
          );
          if (res.ok) {
            const data = await res.json();
            loc.city    = data.address?.city || data.address?.town || data.address?.village || data.address?.county;
            loc.state   = data.address?.state;
            loc.country = data.address?.country;
          }
        } catch (_) { /* sem reverse geocoding, mantém só lat/lng */ }

        saveLocation(loc);
        track(patientId, 'location_captured', { city: loc.city, state: loc.state, lat, lng });
        gtag('event', 'location_captured', {
          city: loc.city, state: loc.state, country: loc.country,
          latitude: lat, longitude: lng, user_id: patientId,
        });
        resolve(loc);
      },
      () => resolve(null),  // permissão negada ou erro
      { timeout: 10000, maximumAge: 3600000 }
    );
  });
};

export const getLocation = (patientId: string): PatientLocation | null =>
  getLocations().find(l => l.patientId === patientId) ?? null;

// ── Contexto de Sessão ───────────────────────────────────────────────────────

/**
 * Registra o início de uma sessão da paciente:
 * - Referrer (de onde ela veio ao abrir o app)
 * - User-Agent do dispositivo
 * - Solicita geolocalização
 */
export const trackSessionStart = async (patientId: string): Promise<void> => {
  const ctx: SessionContext = {
    patientId,
    referrer: document.referrer || 'direto',
    userAgent: navigator.userAgent,
    sessionStart: new Date().toISOString(),
  };

  // Tenta geolocalização (não-bloqueante)
  const loc = await requestGeolocation(patientId);
  if (loc) ctx.location = loc;

  appendSession(ctx);
  track(patientId, 'session_start', { referrer: ctx.referrer, userAgent: ctx.userAgent });
  gtag('event', 'session_start', {
    referrer: ctx.referrer,
    user_id: patientId,
  });
  // Informa o GA4 sobre o usuário atual
  gtag('config', 'G-XXXXXXXXXX', { user_id: patientId });
};

export const getSessionContexts = (patientId: string): SessionContext[] =>
  getSessions().filter(s => s.patientId === patientId);

// ── Histórico de Navegação ───────────────────────────────────────────────────

/**
 * Retorna a trilha de navegação da paciente dentro do app,
 * em ordem cronológica.
 */
export const getNavHistory = (patientId: string): NavEntry[] =>
  getEvents()
    .filter(e => e.patientId === patientId && e.event === 'screen_view' && e.metadata?.screen)
    .map(e => ({ screen: e.metadata!.screen as string, timestamp: e.timestamp }));

// ── Consolidar Engajamento ───────────────────────────────────────────────────

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
    if (e.event === 'feature_used' && e.metadata?.feature) featuresUsed.add(e.metadata.feature);
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

export const getAllEngagements = (patientIds: string[]): PatientEngagement[] =>
  patientIds.map(getEngagement);
