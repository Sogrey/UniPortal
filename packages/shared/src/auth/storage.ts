import type { UserInfo, AuthState } from './types';

const TOKEN_KEY = 'app_token';
const USER_KEY = 'app_user';
const SYNC_KEY = 'auth_sync_trigger';

function triggerSync() {
  localStorage.setItem(SYNC_KEY, Date.now().toString());
  setTimeout(() => localStorage.removeItem(SYNC_KEY), 100);
}

export const authStorage = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
    triggerSync();
  },
  removeToken() {
    localStorage.removeItem(TOKEN_KEY);
    triggerSync();
  },

  getUser(): UserInfo | null {
    const data = localStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  },
  setUser(user: UserInfo) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    triggerSync();
  },
  removeUser() {
    localStorage.removeItem(USER_KEY);
    triggerSync();
  },

  getState(): AuthState {
    return {
      user: this.getUser(),
      token: this.getToken(),
      isAuthenticated: !!this.getToken() && !!this.getUser(),
    };
  },

  clear() {
    this.removeToken();
    this.removeUser();
  },

  watch(callback: () => void): () => void {
    const handler = (e: StorageEvent) => {
      if ([TOKEN_KEY, USER_KEY, SYNC_KEY].includes(e.key || '')) {
        callback();
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  },
};