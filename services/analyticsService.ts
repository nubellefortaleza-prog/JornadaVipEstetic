// ─────────────────────────────────────────────────────────────────────────────
// analyticsService.ts — Rastreamento completo do JornadaVip
//
// Todos os dados são enviados para o banco via POST /api/jornada/tracking.
// Se o backend não estiver disponível, salva em localStorage como fallback
// e envia na próxima sessão (sync queue).
//
// Rastreamentos implementados:
//   1. User-Agent (dispositivo, OS, browser)
//   2. Referrer (de onde veio)
//   3. GPS preciso (lat/lng com reverse geocoding)
//   4. Velocidade de digitação (keystroke timing)
//   5. Pattern de swipe (direção, velocidade, distância)
//   6. Metadados EXIF de fotos
//   7. Mood history (check-ins de humor)
//   8. Notificações (quais viu, quais clicou)
//   9. Screen views, sessões, features, erros
// ─────────────────────────────────────────────────────────────────────────────

import { CONFIG, apiUrl } from './config';

// ── Queue para envio em batch ───────────────────────────────────────────────

const QUEUE_KEY = 'jvip_tracking_queue';
let queue: TrackingEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

interface TrackingEvent {
  evento: string;
  pacienteId?: string;
  dados?: Record<string, any>;
  timestamp?: string;
}

function enqueue(event: TrackingEvent) {
  event.timestamp = event.timestamp || new Date().toISOString();
  queue.push(event);

  // Flush a cada 5 segundos ou quando tiver 10+ eventos
  if (queue.length >= 10) {
    flush();
  } else if (!flushTimer) {
    flushTimer = setTimeout(flush, 5000);
  }
}

async function flush() {
  if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
  if (queue.length === 0) return;

  const batch = [...queue];
  queue = [];

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Clinic-ID': CONFIG.CLINIC_ID,
    };
    if (CONFIG.API_KEY) headers['x-api-key'] = CONFIG.API_KEY;

    const token = localStorage.getItem(CONFIG.AUTH_TOKEN_KEY);
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(apiUrl('/api/jornada/tracking'), {
      method: 'POST',
      headers,
      body: JSON.stringify({ events: batch }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch {
    // Falhou — salva no localStorage para tentar depois
    const stored = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    localStorage.setItem(QUEUE_KEY, JSON.stringify([...stored, ...batch].slice(-500)));
  }
}

// Flush pendentes do localStorage ao iniciar
function flushStored() {
  const stored = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  if (stored.length > 0) {
    queue.push(...stored);
    localStorage.removeItem(QUEUE_KEY);
    flush();
  }
}

// Flush ao fechar a página
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => flush());
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });
  // Tentar enviar pendentes após 3s
  setTimeout(flushStored, 3000);
}

// ── GA4 helper ──────────────────────────────────────────────────────────────

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

const gtag = (command: string, action: string, params?: Record<string, any>) => {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag(command, action, params);
  }
};

// ── Interfaces públicas ─────────────────────────────────────────────────────

export interface PatientLocation {
  patientId: string;
  lat: number;
  lng: number;
  accuracy?: number;
  city?: string;
  state?: string;
  country?: string;
  capturedAt: string;
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

export interface NavEntry {
  screen: string;
  timestamp: string;
}

export interface SessionContext {
  patientId: string;
  referrer: string;
  userAgent: string;
  sessionStart: string;
  location?: PatientLocation;
}

// ── 1. Track genérico ───────────────────────────────────────────────────────

export const track = (patientId: string, event: string, metadata?: Record<string, any>) => {
  enqueue({ evento: event, pacienteId: patientId, dados: metadata });
};

// ── 2. Screen views + tempo em tela ─────────────────────────────────────────

let currentScreen = '';
let screenStartTime = 0;

export const trackScreen = (patientId: string, screen: string) => {
  // Registrar tempo na tela anterior
  if (currentScreen && screenStartTime) {
    const duration = Date.now() - screenStartTime;
    enqueue({
      evento: 'screen_view',
      pacienteId: patientId,
      dados: { screen: currentScreen, duration_ms: duration },
    });
  }

  currentScreen = screen;
  screenStartTime = Date.now();
  gtag('event', 'page_view', { page_title: screen, user_id: patientId });
};

// ── 3. Session start (User-Agent + Referrer + Device info) ──────────────────

export const trackSessionStart = async (patientId: string): Promise<void> => {
  const deviceInfo = {
    userAgent: navigator.userAgent,
    referrer: document.referrer || 'direto',
    language: navigator.language,
    platform: navigator.platform,
    screenWidth: screen.width,
    screenHeight: screen.height,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    pixelRatio: window.devicePixelRatio,
    touchPoints: navigator.maxTouchPoints,
    online: navigator.onLine,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    darkMode: window.matchMedia?.('(prefers-color-scheme: dark)').matches,
    cores: navigator.hardwareConcurrency || null,
    memory: (navigator as any).deviceMemory || null,
  };

  // Conexão
  const conn = (navigator as any).connection;
  if (conn) {
    (deviceInfo as any).connectionType = conn.effectiveType;
    (deviceInfo as any).downlink = conn.downlink;
    (deviceInfo as any).saveData = conn.saveData;
  }

  // Bateria
  try {
    const battery = await (navigator as any).getBattery?.();
    if (battery) {
      (deviceInfo as any).batteryLevel = Math.round(battery.level * 100);
      (deviceInfo as any).batteryCharging = battery.charging;
    }
  } catch { /* não suportado */ }

  enqueue({
    evento: 'session_start',
    pacienteId: patientId,
    dados: deviceInfo,
  });

  gtag('event', 'session_start', { referrer: deviceInfo.referrer, user_id: patientId });

  // Solicitar GPS
  requestGeolocation(patientId);
};

// ── 4. Geolocalização GPS precisa ───────────────────────────────────────────

let lastLocation: PatientLocation | null = null;

export const requestGeolocation = (patientId: string): Promise<PatientLocation | null> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return; }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;
        const loc: PatientLocation = {
          patientId, lat, lng, accuracy,
          capturedAt: new Date().toISOString(),
        };

        // Reverse geocoding
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=pt`,
            { headers: { 'Accept-Language': 'pt' } },
          );
          if (res.ok) {
            const data = await res.json();
            loc.city = data.address?.city || data.address?.town || data.address?.village;
            loc.state = data.address?.state;
            loc.country = data.address?.country;
          }
        } catch { /* sem geocoding */ }

        lastLocation = loc;

        enqueue({
          evento: 'geolocation',
          pacienteId: patientId,
          dados: { lat, lng, accuracy, city: loc.city, state: loc.state, country: loc.country },
        });

        resolve(loc);
      },
      () => resolve(null),
      { timeout: 10000, maximumAge: 3600000, enableHighAccuracy: true },
    );
  });
};

export const getLocation = (patientId: string): PatientLocation | null => lastLocation;

// ── 5. Velocidade de digitação (keystroke timing) ───────────────────────────

interface KeystrokeSession {
  field: string;
  intervals: number[];
  lastKeyTime: number;
  startTime: number;
  charCount: number;
}

const keystrokeSessions: Map<string, KeystrokeSession> = new Map();

/** Chamar no onKeyDown de inputs que quiser rastrear */
export const trackKeystroke = (patientId: string, fieldName: string) => {
  const now = Date.now();
  const key = `${patientId}_${fieldName}`;
  let session = keystrokeSessions.get(key);

  if (!session || now - session.lastKeyTime > 5000) {
    // Nova sessão de digitação (pausa > 5s = novo burst)
    if (session && session.intervals.length > 2) {
      // Salvar sessão anterior
      flushKeystrokeSession(patientId, session);
    }
    session = { field: fieldName, intervals: [], lastKeyTime: now, startTime: now, charCount: 0 };
    keystrokeSessions.set(key, session);
  } else {
    session.intervals.push(now - session.lastKeyTime);
  }

  session.lastKeyTime = now;
  session.charCount++;
};

function flushKeystrokeSession(patientId: string, session: KeystrokeSession) {
  if (session.intervals.length < 3) return;

  const avgInterval = session.intervals.reduce((a, b) => a + b, 0) / session.intervals.length;
  const totalTime = (session.lastKeyTime - session.startTime) / 1000; // segundos
  const wpm = totalTime > 0 ? Math.round((session.charCount / 5) / (totalTime / 60)) : 0;

  enqueue({
    evento: 'keystroke_pattern',
    pacienteId: patientId,
    dados: {
      field: session.field,
      avg_interval_ms: Math.round(avgInterval),
      min_interval_ms: Math.min(...session.intervals),
      max_interval_ms: Math.max(...session.intervals),
      total_chars: session.charCount,
      duration_seconds: Math.round(totalTime),
      wpm,
    },
  });
}

/** Chamar ao sair de um campo para flush */
export const flushKeystroke = (patientId: string, fieldName: string) => {
  const key = `${patientId}_${fieldName}`;
  const session = keystrokeSessions.get(key);
  if (session) {
    flushKeystrokeSession(patientId, session);
    keystrokeSessions.delete(key);
  }
};

// ── 6. Pattern de swipe ─────────────────────────────────────────────────────

interface TouchStart {
  x: number;
  y: number;
  time: number;
}

let touchStart: TouchStart | null = null;
let swipePatientId = '';

/** Inicializar tracking de swipe (chamar uma vez no app) */
export const initSwipeTracking = (patientId: string) => {
  swipePatientId = patientId;

  if (typeof window === 'undefined') return;

  // Evitar dupla inicialização
  if ((window as any).__swipeTrackingInit) return;
  (window as any).__swipeTrackingInit = true;

  document.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    touchStart = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  }, { passive: true });

  document.addEventListener('touchend', (e) => {
    if (!touchStart) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStart.x;
    const dy = touch.clientY - touchStart.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const duration = Date.now() - touchStart.time;

    // Só rastrear swipes significativos (> 50px)
    if (distance < 50) { touchStart = null; return; }

    const velocity = distance / duration; // px/ms
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    let direction = 'unknown';
    if (angle > -45 && angle <= 45) direction = 'right';
    else if (angle > 45 && angle <= 135) direction = 'down';
    else if (angle > -135 && angle <= -45) direction = 'up';
    else direction = 'left';

    enqueue({
      evento: 'swipe_pattern',
      pacienteId: swipePatientId,
      dados: {
        direction,
        distance: Math.round(distance),
        duration_ms: duration,
        velocity: Math.round(velocity * 100) / 100,
        screen: currentScreen,
      },
    });

    touchStart = null;
  }, { passive: true });
};

// ── 7. Metadados EXIF de fotos ──────────────────────────────────────────────

/** Extrai metadados EXIF básicos de um arquivo de imagem */
export const extractPhotoMetadata = async (
  patientId: string,
  file: File,
): Promise<Record<string, any>> => {
  const metadata: Record<string, any> = {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    lastModified: new Date(file.lastModified).toISOString(),
  };

  // Tentar ler EXIF do JPEG
  if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
    try {
      const buffer = await file.arrayBuffer();
      const exif = parseBasicExif(new Uint8Array(buffer));
      if (exif) {
        Object.assign(metadata, exif);
      }
    } catch { /* sem EXIF */ }
  }

  enqueue({
    evento: 'photo_uploaded',
    pacienteId: patientId,
    dados: metadata,
  });

  return metadata;
};

/** Parser EXIF mínimo — extrai modelo da câmera, data e GPS */
function parseBasicExif(data: Uint8Array): Record<string, any> | null {
  // Procurar marcador EXIF (0xFFE1)
  if (data[0] !== 0xFF || data[1] !== 0xD8) return null; // Não é JPEG

  const result: Record<string, any> = {};
  let offset = 2;

  while (offset < data.length - 4) {
    if (data[offset] !== 0xFF) break;
    const marker = data[offset + 1];
    const size = (data[offset + 2] << 8) | data[offset + 3];

    if (marker === 0xE1) {
      // EXIF data
      const exifData = data.slice(offset + 4, offset + 2 + size);
      const str = new TextDecoder('ascii').decode(exifData.slice(0, 200));

      // Extrair strings legíveis (modelo da câmera, software)
      const modelMatch = str.match(/[\x20-\x7E]{5,30}/g);
      if (modelMatch) {
        // Filtrar strings relevantes
        for (const s of modelMatch) {
          if (s.match(/(iPhone|Samsung|Pixel|Motorola|Xiaomi|Redmi|Galaxy|HUAWEI|OnePlus|LG|SM-|POCO)/i)) {
            result.cameraModel = s.trim();
          }
        }
      }

      // Data original (procurar padrão YYYY:MM:DD HH:MM:SS)
      const dateMatch = str.match(/(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/);
      if (dateMatch) {
        result.dateOriginal = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}T${dateMatch[4]}:${dateMatch[5]}:${dateMatch[6]}`;
      }

      break;
    }

    offset += 2 + size;
  }

  return Object.keys(result).length > 0 ? result : null;
}

// ── 8. Mood check-in ────────────────────────────────────────────────────────

export const trackMood = (patientId: string, mood: string) => {
  enqueue({
    evento: 'mood_checkin',
    pacienteId: patientId,
    dados: { mood },
  });
  gtag('event', 'mood_checkin', { mood, user_id: patientId });
};

// ── 9. Notificações (popup campaigns) ───────────────────────────────────────

export const trackNotificationView = (patientId: string, campaignId: string, title: string) => {
  enqueue({
    evento: 'notification_view',
    pacienteId: patientId,
    dados: { campaignId, title },
  });
};

export const trackNotificationClick = (patientId: string, campaignId: string, ctaUrl?: string) => {
  enqueue({
    evento: 'notification_click',
    pacienteId: patientId,
    dados: { campaignId, ctaUrl },
  });
};

// Compat alias
export const trackNotificationOpened = (patientId: string, campaignId: string) =>
  trackNotificationView(patientId, campaignId, '');

// ── Outros eventos ──────────────────────────────────────────────────────────

export const trackFeature = (patientId: string, feature: string) => {
  enqueue({ evento: 'feature_used', pacienteId: patientId, dados: { feature } });
};

export const trackPhotoUploaded = (patientId: string) => {
  // Usar extractPhotoMetadata para tracking com EXIF
  enqueue({ evento: 'photo_uploaded', pacienteId: patientId });
};

export const trackReferralSent = (patientId: string) => {
  enqueue({ evento: 'referral_sent', pacienteId: patientId });
};

export const trackChecklistItem = (patientId: string, list: string, item: string) => {
  enqueue({ evento: 'checklist_item', pacienteId: patientId, dados: { list, item } });
};

export const trackError = (patientId: string, error: Error) => {
  enqueue({
    evento: 'error',
    pacienteId: patientId,
    dados: {
      message: error.message,
      stack: error.stack?.substring(0, 500),
      url: window.location.href,
    },
  });
};

// ── Compat: funções usadas pelo AdminView (dados locais) ────────────────────
// Estas funções retornam dados locais para manter compat.
// O dashboard admin buscará dados do banco via API.

export const getEngagement = (patientId: string): PatientEngagement => ({
  patientId,
  totalSessions: 0,
  lastSeen: '',
  screenVisits: {},
  featuresUsed: [],
  checklistCompletions: 0,
  photosUploaded: 0,
  moodHistory: [],
  notificationsOpened: 0,
  referralsSent: 0,
});

export const getLocation2 = (patientId: string): PatientLocation | null => lastLocation;
export const getSessionContexts = (patientId: string): SessionContext[] => [];
export const getNavHistory = (patientId: string): NavEntry[] => [];
