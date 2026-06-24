import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      'process.env.REACT_APP_API_URL': JSON.stringify(env.REACT_APP_API_URL || ''),
      'process.env.REACT_APP_API_URL2': JSON.stringify(env.REACT_APP_API_URL2 || '')
    },
    server: {
      port: 3000,
      host: true
    },
    build: {
      // Se eleva el límite de advertencia para evitar spam en consola de CI/CD
      chunkSizeWarningLimit: 1500
    }
  };
});