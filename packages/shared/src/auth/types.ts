export interface UserInfo {
  id: string;
  username: string;
  email: string;
  roles: string[];
  avatar?: string;
}

export interface AuthState {
  user: UserInfo | null;
  token: string | null;
  isAuthenticated: boolean;
}

export enum AuthAction {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  USER_CHANGED = 'USER_CHANGED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  FORCE_LOGOUT = 'FORCE_LOGOUT',
}