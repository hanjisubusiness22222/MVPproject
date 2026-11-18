import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.VERCEL ? '/' : '/MVPproject/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        guestbook: resolve(__dirname, 'guestbook.html'),
        planetV3: resolve(__dirname, 'planet-v3.html')
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
});
