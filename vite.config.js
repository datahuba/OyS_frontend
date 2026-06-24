import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Carga las variables de entorno desde el entorno de compilación de Docker o .env
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Mapeo de compatibilidad hacia atrás para no reescribir sus archivos React .jsx
      'process.env.REACT_APP_API_URL': JSON.stringify(env.REACT_APP_API_URL || ''),
      'process.env.REACT_APP_API_URL2': JSON.stringify(env.REACT_APP_API_URL2 || '')
    },
    server: {
      port: 3000,
      host: true
    }
  };
});