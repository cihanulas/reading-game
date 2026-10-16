/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'CREDITS.txt'],
      manifest: {
        name: 'Okuma Adası',
        short_name: 'Okuma Adası',
        description: 'Okuma hızı geliştirme oyunu',
        lang: 'tr',
        theme_color: '#0b6e99',
        background_color: '#f6e7c1',
        display: 'standalone',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
    }),
  ],
  test: {
    environment: 'node',
  },
});
