import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

const REPO_NAME = process.env.REPO_NAME || '';
const BASE_PATH = process.env.DEPLOY_BASE || '/app-a/';
const BASE_URL = REPO_NAME ? `/${REPO_NAME}${BASE_PATH}` : BASE_PATH;

export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'transform-index-html',
      transformIndexHtml(html) {
        return html.replace(/href="vite\.svg"/g, `href="${BASE_URL}vite.svg"`);
      },
    },
  ],
  base: BASE_URL,
  define: {
    __REPO_NAME__: JSON.stringify(REPO_NAME),
    __BASE_PATH__: JSON.stringify(BASE_PATH),
  },
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
    port: 3002,
    proxy: {
      '/auth/': {
        target: 'http://127.0.0.1:3001',
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