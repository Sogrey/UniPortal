import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import router from './router';

(window as any).__VITE_REPO_NAME__ = import.meta.env.VITE_REPO_NAME || '';

const app = createApp(App);
app.use(router);
app.mount('#app');