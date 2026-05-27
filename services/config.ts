// ─────────────────────────────────────────────────────────────────────────────
// config.ts — Configuração centralizada do JornadaVip
//
// Todas as constantes, URLs e flags em um único lugar.
// Em produção, estas variáveis serão carregadas do .env via Vite.
// ─────────────────────────────────────────────────────────────────────────────

export const CONFIG = {
  // ── App ──────────────────────────────────────────────────────────────────
  APP_NAME: 'JornadaVip',
  APP_VERSION: '2.0.0',

  // ── API / Backend ────────────────────────────────────────────────────────
  // Quando o CRM estiver pronto, basta definir VITE_API_BASE_URL no .env
  // e o app passará a usar o backend automaticamente.
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || '',
  API_TIMEOUT: 15000,

  // Se true, usa localStorage como fallback (modo offline / dev sem backend)
  USE_LOCAL_STORAGE: !import.meta.env.VITE_API_BASE_URL,

  // ── Auth ──────────────────────────────────────────────────────────────────
  // Token JWT armazenado em sessionStorage
  AUTH_TOKEN_KEY: 'jvip_auth_token',
  AUTH_REFRESH_KEY: 'jvip_refresh_token',
  SESSION_EXPIRY_MS: 8 * 60 * 60 * 1000, // 8 horas

  // ── Clínica ──────────────────────────────────────────────────────────────
  CLINIC_NAME: 'Vip Estétic',
  WHATSAPP_NUMBER: import.meta.env.VITE_WHATSAPP_NUMBER || '5585991656767',
  INSTAGRAM_URL: import.meta.env.VITE_INSTAGRAM_URL || 'https://instagram.com/vipestetic',
  YOUTUBE_URL: import.meta.env.VITE_YOUTUBE_URL || 'https://youtube.com/@vipestetic',

  // ── Analytics ────────────────────────────────────────────────────────────
  GA_MEASUREMENT_ID: import.meta.env.VITE_GA_MEASUREMENT_ID || '',
  SMARTLOOK_PROJECT_KEY: import.meta.env.VITE_SMARTLOOK_KEY || '',

  // ── Gemini ───────────────────────────────────────────────────────────────
  // Em produção, chamadas à IA devem ir via backend (proxy) para não expor a key.
  // O proxy será: POST {API_BASE_URL}/api/ai/chat
  // Modo local (sem backend): usa a key diretamente (apenas para dev).
  GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY || '',
  USE_AI_PROXY: !!import.meta.env.VITE_API_BASE_URL,

  // ── Limites ──────────────────────────────────────────────────────────────
  MAX_ANALYTICS_EVENTS: 500,
  MAX_SESSIONS_STORED: 200,
  MAX_FILE_SIZE_MB: 5,
  MAX_PHOTO_DIMENSION: 1920,

  // ── LocalStorage Keys ────────────────────────────────────────────────────
  LS_KEYS: {
    RECORDS: 'clinic_records',
    ADMIN_USERS: 'clinic_admin_users',
    ADMIN_SESSION: 'clinic_admin_session',
    ANALYTICS: 'clinic_analytics',
    LOCATIONS: 'clinic_locations',
    SESSIONS: 'clinic_sessions',
    CAMPAIGNS: 'clinic_campaigns',
    WEBHOOKS: 'clinic_webhooks',
  },
} as const;

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Verifica se o app está rodando com backend (CRM) conectado */
export const hasBackend = (): boolean => !CONFIG.USE_LOCAL_STORAGE;

/** Monta URL completa da API */
export const apiUrl = (path: string): string =>
  `${CONFIG.API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
