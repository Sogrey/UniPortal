# 多系统用户同步方案移植指南

本文档提供将 UniPortal 的多系统用户同步方案快速移植到其他项目的详细步骤。

## 🎯 方案概述

UniPortal 实现了一套完整的跨应用用户状态同步机制，核心组件包括：

| 组件 | 功能 | 文件位置 |
|------|------|----------|
| `authStorage` | 本地存储封装（Token、用户信息） | `packages/shared/src/auth/storage.ts` |
| `authChannel` | 跨应用消息广播（BroadcastChannel） | `packages/shared/src/auth/channel.ts` |
| `useAuth` | 组合式函数（状态管理、事件监听） | `packages/shared/src/auth/index.ts` |
| `http` | Axios 实例（自动携带 Token、401 拦截） | `packages/shared/src/http/index.ts` |
| `buildLoginUrl` | 构建登录 URL（带重定向参数） | `packages/shared/src/auth/redirect.ts` |
| `buildAppPath` | 构建应用路径（处理子路径部署） | `packages/shared/src/auth/redirect.ts` |

## 📦 移植步骤

### 步骤 1：创建共享工具包

在目标项目中创建共享包（如 `@your-project/shared`）：

```bash
mkdir -p packages/shared/src/auth
mkdir -p packages/shared/src/http
```

### 步骤 2：复制认证类型定义

创建 `packages/shared/src/auth/types.ts`：

```typescript
export interface UserInfo {
  id: string;
  username: string;
  email?: string;
  roles?: string[];
  avatar?: string;
  [key: string]: unknown;
}

export interface AuthState {
  token: string | null;
  user: UserInfo | null;
  expiresAt: number | null;
}

export enum AuthAction {
  LOGIN = 'AUTH_LOGIN',
  LOGOUT = 'AUTH_LOGOUT',
  SESSION_EXPIRED = 'AUTH_SESSION_EXPIRED',
  FORCE_LOGOUT = 'AUTH_FORCE_LOGOUT',
  USER_CHANGED = 'AUTH_USER_CHANGED',
}

export interface AuthMessage {
  action: AuthAction;
  payload?: unknown;
  senderId?: string;
}

export interface AuthConfig {
  tokenKey?: string;
  userKey?: string;
  channelName?: string;
}
```

### 步骤 3：复制本地存储封装

创建 `packages/shared/src/auth/storage.ts`：

```typescript
import type { UserInfo, AuthState, AuthConfig } from './types';

const defaultConfig: AuthConfig = {
  tokenKey: 'uni_auth_token',
  userKey: 'uni_auth_user',
  channelName: 'uni_auth_channel',
};

export class AuthStorage {
  private config: AuthConfig;

  constructor(config?: Partial<AuthConfig>) {
    this.config = { ...defaultConfig, ...config };
  }

  getToken(): string | null {
    return localStorage.getItem(this.config.tokenKey!);
  }

  setToken(token: string): void {
    localStorage.setItem(this.config.tokenKey!, token);
  }

  removeToken(): void {
    localStorage.removeItem(this.config.tokenKey!);
  }

  getUser(): UserInfo | null {
    const userStr = localStorage.getItem(this.config.userKey!);
    return userStr ? JSON.parse(userStr) : null;
  }

  setUser(user: UserInfo): void {
    localStorage.setItem(this.config.userKey!, JSON.stringify(user));
  }

  removeUser(): void {
    localStorage.removeItem(this.config.userKey!);
  }

  getState(): AuthState {
    return {
      token: this.getToken(),
      user: this.getUser(),
      expiresAt: null,
    };
  }

  clear(): void {
    this.removeToken();
    this.removeUser();
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export const authStorage = new AuthStorage();
```

### 步骤 4：复制跨应用消息广播

创建 `packages/shared/src/auth/channel.ts`：

```typescript
import type { AuthMessage } from './types';
import { AuthAction } from './types';

export class AuthChannel {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<(msg: AuthMessage) => void> = new Set();
  private senderId: string;

  constructor(channelName: string = 'uni_auth_channel') {
    this.senderId = `${channelName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.channel = new BroadcastChannel(channelName);
    this.channel.onmessage = (event) => {
      const msg = event.data as AuthMessage;
      if (msg.senderId !== this.senderId) {
        this.listeners.forEach((listener) => listener(msg));
      }
    };
  }

  broadcast(action: AuthAction, payload?: unknown): void {
    if (this.channel) {
      const msg: AuthMessage = { action, payload, senderId: this.senderId };
      this.channel.postMessage(msg);
      this.listeners.forEach((listener) => listener(msg));
    }
  }

  onMessage(listener: (msg: AuthMessage) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  close(): void {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    this.listeners.clear();
  }
}

export const authChannel = new AuthChannel();
```

### 步骤 5：复制重定向工具函数

创建 `packages/shared/src/auth/redirect.ts`：

```typescript
export function buildLoginUrl(redirectUrl: string): string {
  const repoName = (window as any).__VITE_REPO_NAME__ || '';
  const authPath = repoName ? `/${repoName}/auth/login` : '/auth/login';
  return `${authPath}?redirect_url=${encodeURIComponent(redirectUrl)}`;
}

export function buildAppPath(appPath: string): string {
  const repoName = (window as any).__VITE_REPO_NAME__ || '';
  if (repoName) {
    return `/${repoName}${appPath}`;
  }
  return appPath;
}

export function parseRedirectParams(): { redirectUrl: string | null; returnTo: string | null } {
  const urlParams = new URLSearchParams(window.location.search);
  const redirectUrl = urlParams.get('redirect_url');
  const returnTo = urlParams.get('return_to');
  return {
    redirectUrl: redirectUrl ? decodeURIComponent(redirectUrl) : null,
    returnTo: returnTo ? decodeURIComponent(returnTo) : null,
  };
}
```

### 步骤 6：创建 useAuth 组合式函数

创建 `packages/shared/src/auth/index.ts`：

```typescript
import { ref, onMounted, onUnmounted } from 'vue';
import { authStorage, authChannel } from './storage';
import { AuthAction } from './types';

export interface UseAuthOptions {
  onLogin?: () => void;
  onLogout?: () => void;
  onSessionExpired?: () => void;
}

export function useAuth(options: UseAuthOptions = {}) {
  const user = ref(authStorage.getUser());
  const token = ref(authStorage.getToken());
  const isAuthenticated = ref(authStorage.isAuthenticated());

  const updateState = () => {
    user.value = authStorage.getUser();
    token.value = authStorage.getToken();
    isAuthenticated.value = authStorage.isAuthenticated();
  };

  let unlisten: () => void;

  onMounted(() => {
    unlisten = authChannel.onMessage((msg) => {
      switch (msg.action) {
        case AuthAction.LOGIN:
          updateState();
          options.onLogin?.();
          break;
        case AuthAction.LOGOUT:
        case AuthAction.FORCE_LOGOUT:
          updateState();
          options.onLogout?.();
          break;
        case AuthAction.SESSION_EXPIRED:
          updateState();
          options.onSessionExpired?.();
          break;
        case AuthAction.USER_CHANGED:
          updateState();
          break;
      }
    });
  });

  onUnmounted(() => {
    unlisten?.();
  });

  return { user, token, isAuthenticated };
}

export { authStorage, authChannel, AuthAction } from './types';
export { buildLoginUrl, buildAppPath, parseRedirectParams } from './redirect';
```

### 步骤 7：复制 HTTP 拦截器

创建 `packages/shared/src/http/interceptors.ts`：

```typescript
import type { AxiosInstance } from 'axios';
import { authStorage, authChannel } from '../auth/storage';
import { AuthAction } from '../auth/types';
import { buildLoginUrl } from '../auth/redirect';

export function setupAuthInterceptors(instance: AxiosInstance): void {
  instance.interceptors.request.use((config) => {
    const token = authStorage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        authStorage.clear();
        authChannel.broadcast(AuthAction.SESSION_EXPIRED);
        window.location.href = buildLoginUrl(window.location.href);
      }
      return Promise.reject(error);
    }
  );
}
```

### 步骤 8：创建 HTTP 实例

创建 `packages/shared/src/http/index.ts`：

```typescript
import axios from 'axios';
import { setupAuthInterceptors } from './interceptors';

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
});

setupAuthInterceptors(http);

export default http;
```

### 步骤 9：创建统一导出

创建 `packages/shared/src/index.ts`：

```typescript
export { authStorage, authChannel, AuthAction, useAuth } from './auth';
export { buildLoginUrl, buildAppPath, parseRedirectParams } from './auth/redirect';
export { default as http } from './http';
```

### 步骤 10：配置共享包 package.json

```json
{
  "name": "@your-project/shared",
  "version": "1.0.0",
  "type": "module",
  "main": "src/index.ts",
  "dependencies": {
    "axios": "^1.6.0",
    "vue": "^3.4.0"
  }
}
```

## 🔧 在认证中心应用中使用

### 1. 登录页面（Login.vue）

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { authStorage, authChannel, AuthAction, parseRedirectParams } from '@your-project/shared';

const router = useRouter();
const username = ref('');
const password = ref('');

const handleLogin = async () => {
  const mockUser = { id: '1', username: username.value };
  const mockToken = `token_${Date.now()}`;

  authStorage.setToken(mockToken);
  authStorage.setUser(mockUser);
  authChannel.broadcast(AuthAction.LOGIN, { user: mockUser, token: mockToken });

  const { redirectUrl, returnTo } = parseRedirectParams();
  
  if (redirectUrl) {
    window.location.href = redirectUrl;
  } else if (returnTo) {
    router.replace(returnTo);
  } else {
    router.replace('/');
  }
};
</script>
```

### 2. 主页面（Index.vue）

```vue
<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuth, authStorage, authChannel, AuthAction, buildAppPath } from '@your-project/shared';

const router = useRouter();

const { user, isAuthenticated } = useAuth({
  onLogin: () => router.replace('/'),
  onLogout: () => router.replace('/login'),
  onSessionExpired: () => router.replace('/login'),
});

const handleLogout = () => {
  authStorage.clear();
  authChannel.broadcast(AuthAction.LOGOUT);
};

const goToApp = (path: string) => {
  window.open(buildAppPath(path), '_blank');
};
</script>
```

### 3. 路由配置

```typescript
import { createRouter, createWebHistory } from 'vue-router';

const repoName = import.meta.env.VITE_REPO_NAME || '';
const basePath = import.meta.env.VITE_BASE_PATH || '/auth/';
const routerBase = repoName ? `/${repoName}${basePath}` : basePath;

const router = createRouter({
  history: createWebHistory(routerBase),
  routes: [
    { path: '/', component: Index, meta: { requiresAuth: true } },
    { path: '/login', component: Login },
  ],
});

router.beforeEach((to, _from, next) => {
  const isAuthenticated = authStorage.isAuthenticated();
  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ path: '/login', query: { return_to: to.fullPath } });
  } else {
    next();
  }
});

export default router;
```

### 4. 入口文件（main.ts）

```typescript
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

(window as any).__VITE_REPO_NAME__ = import.meta.env.VITE_REPO_NAME || '';

const app = createApp(App);
app.use(router);
app.mount('#app');

router.isReady().then(() => {
  const redirectPath = sessionStorage.getItem('UniPortal.redirect');
  if (redirectPath) {
    sessionStorage.removeItem('UniPortal.redirect');
    const repoName = import.meta.env.VITE_REPO_NAME || '';
    const basePath = import.meta.env.VITE_BASE_PATH || '/auth/';
    const routerBase = repoName ? `/${repoName}${basePath}` : basePath;
    const relativePath = redirectPath.replace(routerBase, '/');
    router.replace(relativePath);
  }
});
```

## 🔧 在业务应用中使用

### 1. 主页面（Home.vue）

```vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useAuth, authStorage, authChannel, AuthAction, buildLoginUrl, buildAppPath } from '@your-project/shared';

const { user } = useAuth();

const showLoginModal = ref(false);

let unlisten: () => void;

onMounted(() => {
  unlisten = authChannel.onMessage((msg) => {
    if (msg.action === AuthAction.LOGOUT || msg.action === AuthAction.SESSION_EXPIRED) {
      showLoginModal.value = true;
    } else if (msg.action === AuthAction.LOGIN) {
      showLoginModal.value = false;
    }
  });

  if (!authStorage.isAuthenticated()) {
    showLoginModal.value = true;
  }
});

onUnmounted(() => {
  unlisten?.();
});

const handleReLogin = () => {
  window.location.href = buildLoginUrl(window.location.href);
};

const handleLogout = () => {
  authStorage.clear();
  authChannel.broadcast(AuthAction.LOGOUT);
};

const goToOtherApp = (path: string) => {
  window.open(buildAppPath(path), '_blank');
};
</script>

<template>
  <div>
    <div v-if="showLoginModal" class="login-modal">
      <div class="modal-content">
        <p>登录已失效，请重新登录</p>
        <button @click="handleReLogin">确认重新登录</button>
      </div>
    </div>
    <div v-else>
      <h1>业务应用 A</h1>
      <p>当前用户: {{ user?.username }}</p>
      <button @click="handleLogout">退出登录</button>
    </div>
  </div>
</template>
```

### 2. 路由配置

```typescript
import { createRouter, createWebHistory } from 'vue-router';

const repoName = import.meta.env.VITE_REPO_NAME || '';
const basePath = import.meta.env.VITE_BASE_PATH || '/app-a/';
const routerBase = repoName ? `/${repoName}${basePath}` : basePath;

const router = createRouter({
  history: createWebHistory(routerBase),
  routes: [
    { path: '/', component: Home },
  ],
});

export default router;
```

### 3. 入口文件（main.ts）

```typescript
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

(window as any).__VITE_REPO_NAME__ = import.meta.env.VITE_REPO_NAME || '';

const app = createApp(App);
app.use(router);
app.mount('#app');

router.isReady().then(() => {
  const redirectPath = sessionStorage.getItem('UniPortal.redirect');
  if (redirectPath) {
    sessionStorage.removeItem('UniPortal.redirect');
    const repoName = import.meta.env.VITE_REPO_NAME || '';
    const basePath = import.meta.env.VITE_BASE_PATH || '/app-a/';
    const routerBase = repoName ? `/${repoName}${basePath}` : basePath;
    const relativePath = redirectPath.replace(routerBase, '/');
    router.replace(relativePath);
  }
});
```

## 🚀 部署配置

### 复制部署脚本

创建 `scripts/deploy.js`：

```javascript
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DEPLOY_TARGET = path.join(__dirname, '../dist');
const REPO_NAME = process.env.REPO_NAME || '';
const CUSTOM_DOMAIN = process.env.CUSTOM_DOMAIN || '';

const apps = [
  { name: 'auth-app', path: 'apps/auth-app', deployPath: 'auth' },
  { name: 'business-app-a', path: 'apps/business-app-a', deployPath: 'app-a' },
  { name: 'business-app-b', path: 'apps/business-app-b', deployPath: 'app-b' },
];

function cleanDist() {
  if (fs.existsSync(DEPLOY_TARGET)) {
    execSync(`rm -rf ${DEPLOY_TARGET}/*`, { stdio: 'inherit' });
  }
}

function buildApp(app) {
  console.log(`📦 构建 ${app.name}...`);
  execSync(`pnpm --filter ${app.name} build`, { stdio: 'inherit' });
}

function copyToDist(app) {
  const distDir = path.join(__dirname, '../', app.path, 'dist');
  const targetDir = path.join(DEPLOY_TARGET, app.deployPath);
  
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  
  execSync(`cp -r ${distDir}/* ${targetDir}`, { stdio: 'inherit' });
  console.log(`✅ ${app.name} 复制完成`);
}

function generateRootIndex() {
  const indexPath = path.join(DEPLOY_TARGET, 'index.html');
  const authBasePath = REPO_NAME ? `/${REPO_NAME}/auth/` : '/auth/';
  
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="refresh" content="0; url=${authBasePath}" />
  <title>重定向中...</title>
</head>
<body>
  <script>
    window.location.replace('${authBasePath}');
  </script>
</body>
</html>`;
  
  fs.writeFileSync(indexPath, html);
  console.log(`✅ 生成根目录重定向页面 -> ${authBasePath}`);
}

function generateRoot404() {
  const notFoundPath = path.join(DEPLOY_TARGET, '404.html');
  const authBasePath = REPO_NAME ? `/${REPO_NAME}/auth/` : '/auth/';
  const appABasePath = REPO_NAME ? `/${REPO_NAME}/app-a/` : '/app-a/';
  const appBBasePath = REPO_NAME ? `/${REPO_NAME}/app-b/` : '/app-b/';
  
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>404 - UniPortal</title>
</head>
<body>
  <script>
    (function() {
      var path = window.location.pathname;
      var search = window.location.search;
      var hash = window.location.hash;
      var redirectPath = path + search + hash;
      
      sessionStorage.setItem('UniPortal.redirect', redirectPath);
      
      if (path.indexOf('/auth/') !== -1) {
        window.location.replace('${authBasePath}');
      } else if (path.indexOf('/app-a/') !== -1) {
        window.location.replace('${appABasePath}');
      } else if (path.indexOf('/app-b/') !== -1) {
        window.location.replace('${appBBasePath}');
      } else {
        window.location.replace('${authBasePath}');
      }
    })();
  </script>
</body>
</html>`;
  
  fs.writeFileSync(notFoundPath, html);
  console.log(`✅ 生成根目录 404.html（支持 SPA history 模式）`);
}

function generateCNAME() {
  if (CUSTOM_DOMAIN) {
    const cnamePath = path.join(DEPLOY_TARGET, 'CNAME');
    fs.writeFileSync(cnamePath, CUSTOM_DOMAIN);
    console.log(`✅ 生成 CNAME 文件 -> ${CUSTOM_DOMAIN}`);
  }
}

function main() {
  console.log('🚀 开始部署...');
  console.log(`📁 REPO_NAME: "${REPO_NAME}"`);
  console.log(`🌐 CUSTOM_DOMAIN: "${CUSTOM_DOMAIN}"`);
  
  cleanDist();
  
  apps.forEach(app => {
    buildApp(app);
    copyToDist(app);
  });
  
  generateRootIndex();
  generateRoot404();
  generateCNAME();
  
  console.log('🎉 所有应用部署完成!');
  console.log(`📦 部署目录: ${DEPLOY_TARGET}`);
}

main();
```

### 配置 CI/CD

创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: 'pages'
  cancel-in-progress: true

env:
  REPO_NAME: ${{ github.event.repository.name }}
  # CUSTOM_DOMAIN: your-domain.com

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Build and deploy
        run: pnpm deploy
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

## 📋 移植检查清单

- [ ] 创建 `packages/shared/src/auth/types.ts`
- [ ] 创建 `packages/shared/src/auth/storage.ts`
- [ ] 创建 `packages/shared/src/auth/channel.ts`
- [ ] 创建 `packages/shared/src/auth/redirect.ts`
- [ ] 创建 `packages/shared/src/auth/index.ts`
- [ ] 创建 `packages/shared/src/http/interceptors.ts`
- [ ] 创建 `packages/shared/src/http/index.ts`
- [ ] 创建 `packages/shared/src/index.ts`
- [ ] 配置共享包 `package.json`
- [ ] 在认证中心实现登录/登出逻辑
- [ ] 在业务应用实现登录模态框
- [ ] 配置路由守卫
- [ ] 配置部署脚本
- [ ] 配置 CI/CD

## 💡 最佳实践

1. **统一使用 `router.replace`**：避免历史记录堆积，确保 URL 与页面同步
2. **使用 `buildAppPath` 构建路径**：处理子路径部署场景
3. **监听 `authChannel` 事件**：确保跨应用状态同步
4. **配置 HTTP 拦截器**：处理 401 自动跳转登录页
5. **实现登录模态框**：子系统在未认证时显示模态框而非直接跳转

## 🐛 常见问题

**Q: 跨应用状态不同步？**

A: 确保所有应用使用相同的 `channelName`，并正确监听 `authChannel.onMessage`。

**Q: 子路径部署时链接错误？**

A: 使用 `buildAppPath` 工具函数，确保 `window.__VITE_REPO_NAME__` 已正确设置。

**Q: GitHub Pages 子路由 404？**

A: 确保根目录 `404.html` 已正确生成，且应用入口文件正确读取 `sessionStorage`。
