import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import Home from '../views/Home.vue';
import Settings from '../views/Settings.vue';
import { authStorage, buildLoginUrl } from '@my-monorepo/shared';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { requiresAuth: true },
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings,
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory('/app-b/'),
  routes,
});

router.beforeEach((to, _from, next) => {
  const isAuthenticated = authStorage.getState().isAuthenticated;
  
  if (to.meta.requiresAuth && !isAuthenticated) {
    const loginUrl = buildLoginUrl(window.location.href);
    window.open(loginUrl, '_blank');
    next(false);
  } else {
    next();
  }
});

export default router;