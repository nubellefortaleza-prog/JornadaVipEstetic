import '@testing-library/jest-dom/vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
})();

Object.defineProperty(globalThis, 'sessionStorage', { value: sessionStorageMock });

// Mock crypto.subtle for SHA-256
Object.defineProperty(globalThis, 'crypto', {
  value: {
    subtle: {
      digest: async (_algo: string, data: ArrayBuffer) => {
        // Simple mock hash for testing - just returns a predictable buffer
        const view = new Uint8Array(data);
        const hash = new Uint8Array(32);
        for (let i = 0; i < view.length; i++) {
          hash[i % 32] = (hash[i % 32] + view[i]) % 256;
        }
        return hash.buffer;
      },
    },
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
      return arr;
    },
  },
});

// Mock import.meta.env
(globalThis as any).import = { meta: { env: {} } };

// Clean up between tests
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});
