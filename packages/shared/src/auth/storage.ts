import type { UserInfo, AuthState } from './types';

/** localStorage 存储键名常量 */
const TOKEN_KEY = 'app_token';
const USER_KEY = 'app_user';
const SYNC_KEY = 'auth_sync_trigger';

/**
 * 触发跨页面同步事件
 * 通过设置临时 localStorage 键来触发其他页面的 storage 事件
 */
function triggerSync(): void {
  localStorage.setItem(SYNC_KEY, Date.now().toString());
  setTimeout(() => localStorage.removeItem(SYNC_KEY), 100);
}

/**
 * 认证存储工具
 * 封装 localStorage 操作，提供用户信息和 Token 的存取方法
 * 支持跨页面同步监听
 */
export const authStorage = {
  /**
   * 获取用户 Token
   * @returns {string | null} Token 字符串或 null
   */
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  /**
   * 设置用户 Token
   * @param {string} token - Token 字符串
   */
  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    triggerSync();
  },

  /**
   * 移除用户 Token
   */
  removeToken(): void {
    localStorage.removeItem(TOKEN_KEY);
    triggerSync();
  },

  /**
   * 获取用户信息
   * @returns {UserInfo | null} 用户信息对象或 null
   */
  getUser(): UserInfo | null {
    const data = localStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  },

  /**
   * 设置用户信息
   * @param {UserInfo} user - 用户信息对象
   */
  setUser(user: UserInfo): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    triggerSync();
  },

  /**
   * 移除用户信息
   */
  removeUser(): void {
    localStorage.removeItem(USER_KEY);
    triggerSync();
  },

  /**
   * 获取完整的认证状态
   * @returns {AuthState} 包含 user、token、isAuthenticated 的状态对象
   */
  getState(): AuthState {
    return {
      user: this.getUser(),
      token: this.getToken(),
      isAuthenticated: !!this.getToken() && !!this.getUser(),
    };
  },

  /**
   * 清除所有认证信息（登出时调用）
   */
  clear(): void {
    this.removeToken();
    this.removeUser();
  },

  /**
   * 监听认证状态变化
   * 通过 storage 事件实现跨页面状态同步
   * @param {() => void} callback - 状态变化时的回调函数
   * @returns {() => void} 取消监听的函数
   */
  watch(callback: () => void): () => void {
    const handler = (e: StorageEvent): void => {
      if ([TOKEN_KEY, USER_KEY, SYNC_KEY].includes(e.key || '')) {
        callback();
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  },
};