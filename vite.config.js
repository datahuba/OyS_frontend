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
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('@mui')) return 'vendor-mui';
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) return 'vendor-react';
              if (id.includes('axios')) return 'vendor-axios';
              return 'vendor-core';
            }
          }
        }
      },
      chunkSizeWarningLimit: 1500
    }
  };
});