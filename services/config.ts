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
  // Token JWT armazenado em localStorage
  AUTH_TOKEN_KEY: 'jvip_auth_token',
  AUTH_REFRESH_KEY: 'jvip_refresh_token',
  SESSION_EXPIRY_MS: 8 * 60 * 60 * 1000, // 8 horas

  // ── Multi-tenancy ───────────────────────────────────────────────────────
  // Cada clínica recebe um CLINIC_ID único. No backend com RLS (Row Level Security),
  // este ID isola todos os dados por tenant. Em modo local, prefixa as keys do localStorage.
  CLINIC_ID: import.meta.env.VITE_CLINIC_ID || 'default',
  API_KEY: import.meta.env.VITE_API_KEY || '',

  // ── Clínica ──────────────────────────────────────────────────────────────
  CLINIC_NAME: import.meta.env.VITE_CLINIC_NAME || 'Vip Estétic',
  WHATSAPP_NUMBER: import.meta.env.VITE_WHATSAPP_NUMBER || '5585000000000',
  INSTAGRAM_URL: import.meta.env.VITE_INSTAGRAM_URL || 'https://instagram.com/vipestetic',
  YOUTUBE_URL: import.meta.env.VITE_YOUTUBE_URL || 'https://youtube.com/@vipestetic',

  // ── Analytics ────────────────────────────────────────────────────────────
  GA_MEASUREMENT_ID: import.meta.env.VITE_GA_MEASUREMENT_ID || '',
  SMARTLOOK_PROJECT_KEY: import.meta.env.VITE_SMARTLOOK_KEY || '',

  // ── OAuth ───────────────────────────────────────────────────────────────
  // Client IDs para login social. Obtenha em:
  //   Google: https://console.cloud.google.com/apis/credentials
  //   Apple:  https://developer.apple.com/account/resources/identifiers
  GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  APPLE_CLIENT_ID: import.meta.env.VITE_APPLE_CLIENT_ID || '',
  APPLE_REDIRECT_URI: import.meta.env.VITE_APPLE_REDIRECT_URI || `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/apple/callback`,

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
  // Prefixadas com CLINIC_ID para isolamento multi-tenant em modo local
  LS_KEYS: {
    RECORDS: `clinic_${import.meta.env.VITE_CLINIC_ID || 'default'}_records`,
    ADMIN_USERS: `clinic_${import.meta.env.VITE_CLINIC_ID || 'default'}_admin_users`,
    ADMIN_SESSION: `clinic_${import.meta.env.VITE_CLINIC_ID || 'default'}_admin_session`,
    ANALYTICS: `clinic_${import.meta.env.VITE_CLINIC_ID || 'default'}_analytics`,
    LOCATIONS: `clinic_${import.meta.env.VITE_CLINIC_ID || 'default'}_locations`,
    SESSIONS: `clinic_${import.meta.env.VITE_CLINIC_ID || 'default'}_sessions`,
    CAMPAIGNS: `clinic_${import.meta.env.VITE_CLINIC_ID || 'default'}_campaigns`,
    WEBHOOKS: `clinic_${import.meta.env.VITE_CLINIC_ID || 'default'}_webhooks`,
  },
} as const;

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Verifica se o app está rodando com backend (CRM) conectado */
export const hasBackend = (): boolean => !CONFIG.USE_LOCAL_STORAGE;

/** Monta URL completa da API */
export const apiUrl = (path: string): string =>
  `${CONFIG.API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
