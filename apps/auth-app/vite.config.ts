import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

const BASE_URL = process.env.DEPLOY_BASE || '/auth/';

export default defineConfig({
  plugins: [vue()],
  base: BASE_URL,
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@my-monorepo/shared': resolve(__dirname, '../../packages/shared/src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router'],
        },
      },
    },
  },
  server: {
    allowedHosts: ['.localhost'],
    host: '127.0.0.1',
    port: 3001,
    proxy: {
      '/app-a/': {
        target: 'http://127.0.0.1:3002',
        changeOrigin: true,
        followRedirects: true,
      },
      '/app-b/': {
        target: 'http://127.0.0.1:3003',
        changeOrigin: true,
        followRedirects: true,
      },
    },
  },
});