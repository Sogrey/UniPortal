import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import Index from '../views/Index.vue';
import Login from '../views/Login.vue';
import { authStorage } from '@my-monorepo/shared';

/**
 * 路由配置数组
 * @type {RouteRecordRaw[]}
 */
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Index',
    component: Index,
    /** 需要认证才能访问 */
    meta: { requiresAuth: true },
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
  },
];

/**
 * 创建路由实例
 * 使用 HTML5 History 模式，基础路径为 /auth/
 * @type {import('vue-router').Router}
 */
const repoName = import.meta.env.VITE_REPO_NAME || '';
const basePath = import.meta.env.VITE_BASE_PATH || '/auth/';
const routerBase = repoName ? `/${repoName}${basePath}` : basePath;

const router = createRouter({
  history: createWebHistory(routerBase),
  routes,
});

/**
 * 路由守卫 - 全局前置守卫
 * 检查用户认证状态，未认证时重定向到登录页
 * 已认证时访问登录页重定向到首页
 * @param {import('vue-router').RouteLocationNormalized} to - 目标路由
 * @param {import('vue-router').RouteLocationNormalized} _from - 来源路由
 * @param {import('vue-router').NavigationGuardNext} next - 导航控制函数
 */
router.beforeEach((to, _from, next) => {
  const isAuthenticated = authStorage.getState().isAuthenticated;
  
  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ path: '/login', query: { return_to: to.fullPath } });
  } else if (to.path === '/login' && isAuthenticated) {
    next('/');
  } else {
    next();
  }
});

export default router;