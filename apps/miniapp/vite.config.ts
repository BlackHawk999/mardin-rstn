import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import { qrcode } from 'vite-plugin-qrcode';
import { fileURLToPath, URL } from 'node:url';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8')) as { version: string };

export default defineConfig({
  // qrcode() prints a QR of the Network URL in the terminal so a phone on the same Wi-Fi can scan it.
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: [vue(), tailwindcss(), qrcode()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5173,
    // Telegram opens the app through an HTTPS tunnel (cloudflared / ngrok) in dev.
    allowedHosts: true,
    // Same-origin API in dev: the phone / tunnel only needs to reach Vite, which forwards /api to the API process.
    proxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: true },
      '/uploads': { target: 'http://localhost:3000', changeOrigin: true },
    },
  },
});
