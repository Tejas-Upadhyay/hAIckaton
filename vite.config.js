import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true,
    allowedHosts: ['usmac-9tt7465h3.tailf7fba9.ts.net'],
    proxy: { '/api': 'http://127.0.0.1:8787' },
  },
});
