import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // Gemini API key é exposta APENAS em modo dev (sem backend).
        // Em produção, defina VITE_API_BASE_URL e as chamadas vão pelo proxy do CRM.
        // A key fica acessível via import.meta.env.VITE_GEMINI_API_KEY automaticamente.
        'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || ''),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './__tests__/setup.ts',
        include: ['__tests__/**/*.test.{ts,tsx}'],
      },
    };
});
