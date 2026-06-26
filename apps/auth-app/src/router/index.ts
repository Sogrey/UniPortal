import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import Login from '../views/Login.vue';
import Index from '../views/Index.vue';
import { authStorage } from '@my-monorepo/shared';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Index',
    component: Index,
    meta: { requiresAuth: true },
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresGuest: true },
  },
];

const router = createRouter({
  history: createWebHistory('/auth/'),
  routes,
});

router.beforeEach((to, _from, next) => {
  const isAuthenticated = authStorage.getState().isAuthenticated;
  
  if (to.meta.requiresGuest && isAuthenticated) {
    next({ path: '/' });
  } else if (to.meta.requiresAuth && !isAuthenticated) {
    next({ 
      path: '/login', 
      query: { return_to: to.fullPath } 
    });
  } else {
    next();
  }
});

export default router;