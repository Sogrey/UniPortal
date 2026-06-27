import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import router from './router';

(window as any).__VITE_REPO_NAME__ = import.meta.env.VITE_REPO_NAME || '';

const app = createApp(App);
app.use(router);
app.mount('#app');

const redirectPath = sessionStorage.getItem('UniPortal.redirect');
if (redirectPath) {
  sessionStorage.removeItem('UniPortal.redirect');
  const repoName = import.meta.env.VITE_REPO_NAME || '';
  const basePath = import.meta.env.VITE_BASE_PATH || '/app-a/';
  const routerBase = repoName ? `/${repoName}${basePath}` : basePath;
  const relativePath = redirectPath.replace(routerBase, '/');
  router.replace(relativePath);
}