import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Vercel uchun dist papkasi
  build: {
    outDir: "dist",
  },
  server: {
    port: parseInt(process.env.PORT) || 5173,
    host: "127.0.0.1",
    allowedHosts: "all",
    proxy: {
      "/api": {
        // Development da local backend, production da env o'zgaruvchi
        target: process.env.VITE_API_URL || "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});
  