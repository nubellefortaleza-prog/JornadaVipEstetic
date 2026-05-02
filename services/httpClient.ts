// ─────────────────────────────────────────────────────────────────────────────
// httpClient.ts — Cliente HTTP unificado para comunicação com o CRM
//
// Gerencia tokens JWT, refresh automático, retry e timeout.
// Usado pelo apiService.ts quando o backend está disponível.
// ─────────────────────────────────────────────────────────────────────────────

import { CONFIG, apiUrl } from './config';

// ── Tipos ───────────────────────────────────────────────────────────────────

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode: number;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ── Token Management ────────────────────────────────────────────────────────

const getToken = (): string | null =>
  localStorage.getItem(CONFIG.AUTH_TOKEN_KEY);

const getRefreshToken = (): string | null =>
  localStorage.getItem(CONFIG.AUTH_REFRESH_KEY);

export const setTokens = (access: string, refresh?: string): void => {
  localStorage.setItem(CONFIG.AUTH_TOKEN_KEY, access);
  if (refresh) localStorage.setItem(CONFIG.AUTH_REFRESH_KEY, refresh);
};

export const clearTokens = (): void => {
  localStorage.removeItem(CONFIG.AUTH_TOKEN_KEY);
  localStorage.removeItem(CONFIG.AUTH_REFRESH_KEY);
};

export const isAuthenticated = (): boolean => !!getToken();

// ── Refresh Token ───────────────────────────────────────────────────────────

let refreshPromise: Promise<boolean> | null = null;

const refreshAccessToken = async (): Promise<boolean> => {
  // Evita múltiplas chamadas simultâneas de refresh
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refresh = getRefreshToken();
    if (!refresh) return false;

    try {
      const res = await fetch(apiUrl('/api/auth/refresh'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refresh }),
      });

      if (!res.ok) {
        clearTokens();
        return false;
      }

      const data = await res.json();
      setTokens(data.accessToken, data.refreshToken);
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

// ── HTTP Client ─────────────────────────────────────────────────────────────

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  timeout?: number;
  skipAuth?: boolean;
  retry?: number;
}

export const httpClient = async <T = any>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> => {
  const {
    method = 'GET',
    body,
    headers = {},
    timeout = CONFIG.API_TIMEOUT,
    skipAuth = false,
    retry = 1,
  } = options;

  const url = apiUrl(path);

  const buildHeaders = (): Record<string, string> => {
    const h: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Clinic-ID': CONFIG.CLINIC_ID,
      ...(CONFIG.API_KEY ? { 'x-api-key': CONFIG.API_KEY } : {}),
      ...headers,
    };
    const token = getToken();
    if (!skipAuth && token) {
      h['Authorization'] = `Bearer ${token}`;
    }
    return h;
  };

  const doFetch = async (attempt: number): Promise<ApiResponse<T>> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const res = await fetch(url, {
        method,
        headers: buildHeaders(),
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timer);

      // Token expirado → tenta refresh e retry
      if (res.status === 401 && !skipAuth && attempt < retry + 1) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          return doFetch(attempt + 1);
        }
        // Refresh falhou — redireciona para login
        clearTokens();
        window.dispatchEvent(new CustomEvent('jvip:auth-expired'));
        return { success: false, error: 'Sessão expirada', statusCode: 401 };
      }

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        return {
          success: false,
          error: json?.error || json?.message || `Erro ${res.status}`,
          statusCode: res.status,
        };
      }

      return { success: true, data: json, statusCode: res.status };
    } catch (err: any) {
      clearTimeout(timer);

      if (err.name === 'AbortError') {
        return { success: false, error: 'Timeout na requisição', statusCode: 0 };
      }

      // Retry em erros de rede
      if (attempt < retry + 1) {
        await new Promise(r => setTimeout(r, 1000 * attempt));
        return doFetch(attempt + 1);
      }

      return { success: false, error: 'Erro de conexão com o servidor', statusCode: 0 };
    }
  };

  return doFetch(1);
};
