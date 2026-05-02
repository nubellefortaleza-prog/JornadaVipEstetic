import { describe, it, expect } from 'vitest';
import {
  sanitizeText,
  sanitizeObject,
  isValidEmail,
  isValidPhone,
  isValidCPF,
  isValidDate,
  isValidUrl,
  validatePatientProfile,
  validateAnamnesis,
  validateAdminCredentials,
} from '../services/validation';

// ── sanitizeText ────────────────────────────────────────────────────────────

describe('sanitizeText', () => {
  it('remove script tags', () => {
    expect(sanitizeText('<script>alert("xss")</script>Hello')).toBe('Hello');
  });

  it('remove HTML tags', () => {
    expect(sanitizeText('<b>bold</b> <i>italic</i>')).toBe('bold italic');
  });

  it('remove javascript: protocol', () => {
    expect(sanitizeText('javascript:alert(1)')).toBe('alert(1)');
  });

  it('remove event handlers', () => {
    const result = sanitizeText('onclick= doStuff()');
    expect(result).not.toContain('onclick=');
  });

  it('returns empty string for null/undefined', () => {
    expect(sanitizeText(null as any)).toBe('');
    expect(sanitizeText(undefined as any)).toBe('');
    expect(sanitizeText('')).toBe('');
  });

  it('trims whitespace', () => {
    expect(sanitizeText('  hello  ')).toBe('hello');
  });
});

// ── sanitizeObject ──────────────────────────────────────────────────────────

describe('sanitizeObject', () => {
  it('sanitizes string fields', () => {
    const result = sanitizeObject({ name: '<b>John</b>', age: 30 });
    expect(result.name).toBe('John');
    expect(result.age).toBe(30);
  });

  it('sanitizes nested objects', () => {
    const result = sanitizeObject({ user: { name: '<script>x</script>Ana' } });
    expect(result.user.name).toBe('Ana');
  });

  it('leaves arrays untouched', () => {
    const result = sanitizeObject({ items: ['<b>a</b>', '<i>b</i>'] });
    expect(result.items).toEqual(['<b>a</b>', '<i>b</i>']);
  });
});

// ── isValidEmail ────────────────────────────────────────────────────────────

describe('isValidEmail', () => {
  it('accepts valid emails', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('a.b@c.d.com')).toBe(true);
  });

  it('rejects invalid emails', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('user@')).toBe(false);
    expect(isValidEmail('@domain.com')).toBe(false);
    expect(isValidEmail('user domain.com')).toBe(false);
  });
});

// ── isValidPhone ────────────────────────────────────────────────────────────

describe('isValidPhone', () => {
  it('accepts valid phones (10-11 digits)', () => {
    expect(isValidPhone('11999998888')).toBe(true);
    expect(isValidPhone('1133334444')).toBe(true);
    expect(isValidPhone('(11) 99999-8888')).toBe(true);
  });

  it('rejects invalid phones', () => {
    expect(isValidPhone('123')).toBe(false);
    expect(isValidPhone('123456789012')).toBe(false);
    expect(isValidPhone('')).toBe(false);
  });
});

// ── isValidCPF ──────────────────────────────────────────────────────────────

describe('isValidCPF', () => {
  it('accepts valid CPFs', () => {
    expect(isValidCPF('529.982.247-25')).toBe(true);
    expect(isValidCPF('52998224725')).toBe(true);
  });

  it('rejects all same digits', () => {
    expect(isValidCPF('111.111.111-11')).toBe(false);
    expect(isValidCPF('00000000000')).toBe(false);
  });

  it('rejects wrong check digits', () => {
    expect(isValidCPF('529.982.247-26')).toBe(false);
  });

  it('rejects wrong length', () => {
    expect(isValidCPF('123')).toBe(false);
    expect(isValidCPF('')).toBe(false);
  });
});

// ── isValidDate ─────────────────────────────────────────────────────────────

describe('isValidDate', () => {
  it('accepts past dates', () => {
    expect(isValidDate('1990-01-15')).toBe(true);
    expect(isValidDate('2000-06-30')).toBe(true);
  });

  it('rejects future dates', () => {
    expect(isValidDate('2099-01-01')).toBe(false);
  });

  it('rejects invalid dates', () => {
    expect(isValidDate('not-a-date')).toBe(false);
    expect(isValidDate('')).toBe(false);
  });
});

// ── isValidUrl ──────────────────────────────────────────────────────────────

describe('isValidUrl', () => {
  it('accepts http and https URLs', () => {
    expect(isValidUrl('https://example.com')).toBe(true);
    expect(isValidUrl('http://example.com/path')).toBe(true);
  });

  it('rejects non-http protocols', () => {
    expect(isValidUrl('ftp://example.com')).toBe(false);
    expect(isValidUrl('javascript:alert(1)')).toBe(false);
  });

  it('rejects invalid URLs', () => {
    expect(isValidUrl('not a url')).toBe(false);
    expect(isValidUrl('')).toBe(false);
  });
});

// ── validatePatientProfile ──────────────────────────────────────────────────

describe('validatePatientProfile', () => {
  const validProfile = {
    name: 'Maria Silva',
    phone: '11999998888',
    cpf: '529.982.247-25',
    email: 'maria@email.com',
    birthDate: '1990-01-15',
    city: 'São Paulo',
    objective: 'Harmonização facial',
    style: 'natural',
    commPreference: 'simples',
  };

  it('returns no errors for valid profile', () => {
    expect(validatePatientProfile(validProfile)).toEqual([]);
  });

  it('returns errors for missing fields', () => {
    const errors = validatePatientProfile({});
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.field === 'name')).toBe(true);
    expect(errors.some(e => e.field === 'cpf')).toBe(true);
    expect(errors.some(e => e.field === 'email')).toBe(true);
  });

  it('validates name length', () => {
    const errors = validatePatientProfile({ ...validProfile, name: 'AB' });
    expect(errors.some(e => e.field === 'name')).toBe(true);
  });

  it('validates invalid style', () => {
    const errors = validatePatientProfile({ ...validProfile, style: 'invalid' });
    expect(errors.some(e => e.field === 'style')).toBe(true);
  });
});

// ── validateAnamnesis ───────────────────────────────────────────────────────

describe('validateAnamnesis', () => {
  const validAnamnesis = {
    healthGeneral: 'Boa saúde geral',
    allergies: 'Nenhuma',
    medications: 'Nenhum',
    pregnancy: false,
    pastProcedures: 'Nenhum',
    expectedResult: 'Pele mais uniforme',
    habits: { sun: 'baixa', sleep: '7-8h', smoking: false, skincare: 'básico' },
  };

  it('returns no errors for valid anamnesis', () => {
    expect(validateAnamnesis(validAnamnesis)).toEqual([]);
  });

  it('requires healthGeneral', () => {
    const errors = validateAnamnesis({ ...validAnamnesis, healthGeneral: '' });
    expect(errors.some(e => e.field === 'healthGeneral')).toBe(true);
  });

  it('requires pregnancy boolean', () => {
    const errors = validateAnamnesis({ ...validAnamnesis, pregnancy: 'no' });
    expect(errors.some(e => e.field === 'pregnancy')).toBe(true);
  });

  it('rejects overly long expectedResult', () => {
    const errors = validateAnamnesis({ ...validAnamnesis, expectedResult: 'x'.repeat(2001) });
    expect(errors.some(e => e.field === 'expectedResult')).toBe(true);
  });
});

// ── validateAdminCredentials ────────────────────────────────────────────────

describe('validateAdminCredentials', () => {
  it('accepts valid credentials', () => {
    expect(validateAdminCredentials('admin', 'Senha123a')).toEqual([]);
  });

  it('rejects short username', () => {
    const errors = validateAdminCredentials('ab', 'Senha123a');
    expect(errors.some(e => e.field === 'username')).toBe(true);
  });

  it('rejects short password', () => {
    const errors = validateAdminCredentials('admin', 'Ab1');
    expect(errors.some(e => e.field === 'password')).toBe(true);
  });

  it('rejects password without mixed case and digits', () => {
    const errors = validateAdminCredentials('admin', 'senhasemcaps');
    expect(errors.some(e => e.field === 'password')).toBe(true);
  });
});
