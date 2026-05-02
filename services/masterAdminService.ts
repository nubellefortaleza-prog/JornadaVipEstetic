// ─────────────────────────────────────────────────────────────────────────────
// masterAdminService.ts — API para gestão master do JornadaVip
//
// Gerencia autenticação de admins, CRUD de estabelecimentos e admins.
// Todas as chamadas vão para o CRM backend.
// ─────────────────────────────────────────────────────────────────────────────

import { CONFIG, apiUrl } from './config';

// ── Tipos ───────────────────────────────────────────────────────────────────

export interface MasterAdmin {
  id: string;
  nome: string;
  email: string;
  role: 'master' | 'admin_estab';
  estabelecimentoId: string | null;
}

export interface Estabelecimento {
  id: string;
  nome: string;
  cnpj: string | null;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  logo_url: string | null;
  jornada_ativo: boolean;
  crm_integrado: boolean;
  ativo: boolean;
  created_at: string;
}

export interface EstabAdmin {
  id: string;
  nome: string;
  email: string;
  role: string;
  estabelecimento_id: string;
  ativo: boolean;
  ultimo_login: string | null;
  created_at: string;
}

// ── Token Management ────────────────────────────────────────────────────────

const ADMIN_TOKEN_KEY = 'jvip_admin_token';

export const getAdminToken = (): string | null =>
  localStorage.getItem(ADMIN_TOKEN_KEY);

export const setAdminToken = (token: string): void =>
  localStorage.setItem(ADMIN_TOKEN_KEY, token);

export const clearAdminToken = (): void =>
  localStorage.removeItem(ADMIN_TOKEN_KEY);

export const isAdminAuthenticated = (): boolean => !!getAdminToken();

// ── HTTP Helper ─────────────────────────────────────────────────────────────

async function adminFetch<T = any>(
  path: string,
  options: { method?: string; body?: any; skipAuth?: boolean } = {},
): Promise<{ success: boolean; data?: T; error?: string }> {
  const { method = 'GET', body, skipAuth = false } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(CONFIG.API_KEY ? { 'x-api-key': CONFIG.API_KEY } : {}),
  };

  const token = getAdminToken();
  if (!skipAuth && token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(apiUrl(path), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      return { success: false, error: json?.error || `Erro ${res.status}` };
    }

    return { success: true, data: json };
  } catch {
    return { success: false, error: 'Erro de conexão com o servidor' };
  }
}

// ── Auth ────────────────────────────────────────────────────────────────────

export const checkMasterExists = async (): Promise<boolean> => {
  const res = await adminFetch<{ hasMaster: boolean }>(
    '/api/jornada/admin/auth/setup',
    { skipAuth: true },
  );
  return res.data?.hasMaster ?? false;
};

export const setupMaster = async (
  nome: string,
  email: string,
  password: string,
): Promise<{ success: boolean; admin?: MasterAdmin; error?: string }> => {
  const res = await adminFetch<{ admin: MasterAdmin; token: string }>(
    '/api/jornada/admin/auth/setup',
    { method: 'POST', body: { nome, email, password }, skipAuth: true },
  );

  if (res.success && res.data) {
    setAdminToken(res.data.token);
    return { success: true, admin: res.data.admin };
  }

  return { success: false, error: res.error };
};

export const adminLogin = async (
  email: string,
  password: string,
): Promise<{
  success: boolean;
  admin?: MasterAdmin;
  estabelecimentos?: Estabelecimento[];
  error?: string;
}> => {
  const res = await adminFetch<{
    admin: MasterAdmin;
    estabelecimentos: Estabelecimento[];
    token: string;
  }>('/api/jornada/admin/auth/login', {
    method: 'POST',
    body: { email, password },
    skipAuth: true,
  });

  if (res.success && res.data) {
    setAdminToken(res.data.token);
    return {
      success: true,
      admin: res.data.admin,
      estabelecimentos: res.data.estabelecimentos,
    };
  }

  return { success: false, error: res.error };
};

export const adminLogout = (): void => {
  clearAdminToken();
};

// ── Estabelecimentos ────────────────────────────────────────────────────────

export const getEstabelecimentos = async (): Promise<Estabelecimento[]> => {
  const res = await adminFetch<{ estabelecimentos: Estabelecimento[] }>(
    '/api/jornada/admin/estabelecimentos',
  );
  return res.data?.estabelecimentos ?? [];
};

export const getEstabelecimento = async (id: string): Promise<{
  estabelecimento: Estabelecimento;
  admins: EstabAdmin[];
} | null> => {
  const res = await adminFetch<{
    estabelecimento: Estabelecimento;
    admins: EstabAdmin[];
  }>(`/api/jornada/admin/estabelecimentos/${id}`);
  return res.success ? res.data! : null;
};

export const createEstabelecimento = async (data: {
  nome: string;
  cnpj?: string;
  telefone?: string;
  email?: string;
  cidade?: string;
  estado?: string;
  jornadaAtivo?: boolean;
  crmIntegrado?: boolean;
}): Promise<{ success: boolean; estabelecimento?: Estabelecimento; error?: string }> => {
  const res = await adminFetch<{ estabelecimento: Estabelecimento }>(
    '/api/jornada/admin/estabelecimentos',
    { method: 'POST', body: data },
  );
  if (res.success && res.data) {
    return { success: true, estabelecimento: res.data.estabelecimento };
  }
  return { success: false, error: res.error };
};

export const updateEstabelecimento = async (
  id: string,
  data: Partial<{
    nome: string;
    cnpj: string;
    telefone: string;
    email: string;
    cidade: string;
    estado: string;
    jornadaAtivo: boolean;
    crmIntegrado: boolean;
    ativo: boolean;
  }>,
): Promise<{ success: boolean; error?: string }> => {
  const res = await adminFetch(
    `/api/jornada/admin/estabelecimentos/${id}`,
    { method: 'PUT', body: data },
  );
  return { success: res.success, error: res.error };
};

export const deleteEstabelecimento = async (id: string): Promise<boolean> => {
  const res = await adminFetch(`/api/jornada/admin/estabelecimentos/${id}`, { method: 'DELETE' });
  return res.success;
};

// ── Admins ──────────────────────────────────────────────────────────────────

export const getAdmins = async (estabelecimentoId?: string): Promise<EstabAdmin[]> => {
  const query = estabelecimentoId ? `?estabelecimento_id=${estabelecimentoId}` : '';
  const res = await adminFetch<{ admins: EstabAdmin[] }>(
    `/api/jornada/admin/admins${query}`,
  );
  return res.data?.admins ?? [];
};

export const createAdmin = async (data: {
  nome: string;
  email: string;
  password: string;
  estabelecimentoId: string;
}): Promise<{ success: boolean; admin?: EstabAdmin; error?: string }> => {
  const res = await adminFetch<{ admin: EstabAdmin }>(
    '/api/jornada/admin/admins',
    { method: 'POST', body: data },
  );
  if (res.success && res.data) {
    return { success: true, admin: res.data.admin };
  }
  return { success: false, error: res.error };
};

export const updateAdmin = async (
  id: string,
  data: Partial<{ nome: string; email: string; password: string; ativo: boolean }>,
): Promise<{ success: boolean; error?: string }> => {
  const res = await adminFetch(`/api/jornada/admin/admins/${id}`, {
    method: 'PUT',
    body: data,
  });
  return { success: res.success, error: res.error };
};

export const deleteAdmin = async (id: string): Promise<boolean> => {
  const res = await adminFetch(`/api/jornada/admin/admins/${id}`, { method: 'DELETE' });
  return res.success;
};

// ── Pacientes ───────────────────────────────────────────────────────────────

export interface PacienteResumo {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  dataNascimento: string;
  cidade: string;
  estado: string;
  fotoUrl: string;
  ativo: boolean;
  criadoEm: string;
  temAnamnese: boolean;
  tracking: {
    sessoes: number;
    telas: number;
    fotos: number;
    moods: number;
    ultimoAcesso: string;
  };
}

export const getPacientes = async (estabelecimentoId: string): Promise<PacienteResumo[]> => {
  const res = await adminFetch<{ pacientes: PacienteResumo[] }>(
    `/api/jornada/admin/pacientes?estabelecimento_id=${estabelecimentoId}`,
  );
  return res.data?.pacientes ?? [];
};

export const getPacientePerfil = async (id: string): Promise<any> => {
  const res = await adminFetch(`/api/jornada/admin/pacientes/${id}`);
  return res.success ? res.data : null;
};
