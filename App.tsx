// ─────────────────────────────────────────────────────────────────────────────
// validation.ts — Validação e sanitização de dados
//
// Previne XSS, injection e dados mal-formados antes de salvar/enviar.
// ─────────────────────────────────────────────────────────────────────────────

// ── Sanitização ─────────────────────────────────────────────────────────────

/** Remove tags HTML e scripts do texto */
export const sanitizeText = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
};

/** Sanitiza um objeto recursivamente */
export const sanitizeObject = <T extends Record<string, any>>(obj: T): T => {
  const clean = { ...obj };
  for (const key of Object.keys(clean)) {
    if (typeof clean[key] === 'string') {
      (clean as any)[key] = sanitizeText(clean[key]);
    } else if (typeof clean[key] === 'object' && clean[key] !== null && !Array.isArray(clean[key])) {
      (clean as any)[key] = sanitizeObject(clean[key]);
    }
  }
  return clean;
};

// ── Validações de formato ───────────────────────────────────────────────────

export const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const isValidPhone = (phone: string): boolean =>
  /^\d{10,11}$/.test(phone.replace(/\D/g, ''));

export const isValidCPF = (cpf: string): boolean => {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false; // todos iguais
  // Validação dos dígitos verificadores
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(digits[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  return remainder === parseInt(digits[10]);
};

export const isValidDate = (date: string): boolean => {
  const d = new Date(date);
  return !isNaN(d.getTime()) && d < new Date();
};

export const isValidUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

// ── Validação de perfil do paciente ─────────────────────────────────────────

export interface ValidationError {
  field: string;
  message: string;
}

export const validatePatientProfile = (data: Record<string, any>): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!data.name || data.name.trim().length < 3) {
    errors.push({ field: 'name', message: 'Nome deve ter pelo menos 3 caracteres' });
  }
  if (data.name && data.name.length > 100) {
    errors.push({ field: 'name', message: 'Nome deve ter no máximo 100 caracteres' });
  }
  if (!data.phone || !isValidPhone(data.phone)) {
    errors.push({ field: 'phone', message: 'Telefone inválido (DDD + número)' });
  }
  if (!data.cpf || !isValidCPF(data.cpf)) {
    errors.push({ field: 'cpf', message: 'CPF inválido' });
  }
  if (!data.email || !isValidEmail(data.email)) {
    errors.push({ field: 'email', message: 'E-mail inválido' });
  }
  if (!data.birthDate || !isValidDate(data.birthDate)) {
    errors.push({ field: 'birthDate', message: 'Data de nascimento inválida' });
  }
  if (!data.city || data.city.trim().length < 2) {
    errors.push({ field: 'city', message: 'Cidade é obrigatória' });
  }
  if (!data.objective || data.objective.trim().length < 3) {
    errors.push({ field: 'objective', message: 'Objetivo é obrigatório' });
  }
  if (!['natural', 'marcante', 'discreto'].includes(data.style)) {
    errors.push({ field: 'style', message: 'Estilo inválido' });
  }
  if (!['tecnico', 'simples'].includes(data.commPreference)) {
    errors.push({ field: 'commPreference', message: 'Preferência de comunicação inválida' });
  }

  return errors;
};

// ── Validação de anamnese ───────────────────────────────────────────────────

export const validateAnamnesis = (data: Record<string, any>): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!data.healthGeneral || data.healthGeneral.trim().length < 2) {
    errors.push({ field: 'healthGeneral', message: 'Informar condições de saúde' });
  }
  if (data.expectedResult && data.expectedResult.length > 2000) {
    errors.push({ field: 'expectedResult', message: 'Resultado esperado muito longo (máx 2000 caracteres)' });
  }
  if (typeof data.pregnancy !== 'boolean') {
    errors.push({ field: 'pregnancy', message: 'Informar se está gestante' });
  }
  if (!data.habits || typeof data.habits !== 'object') {
    errors.push({ field: 'habits', message: 'Informar hábitos' });
  }

  return errors;
};

// ── Validação de credenciais admin ──────────────────────────────────────────

export const validateAdminCredentials = (username: string, password: string): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!username || username.length < 3) {
    errors.push({ field: 'username', message: 'Usuário deve ter pelo menos 3 caracteres' });
  }
  if (!password || password.length < 8) {
    errors.push({ field: 'password', message: 'Senha deve ter pelo menos 8 caracteres' });
  }
  if (password && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    errors.push({ field: 'password', message: 'Senha deve conter letras maiúsculas, minúsculas e números' });
  }

  return errors;
};
