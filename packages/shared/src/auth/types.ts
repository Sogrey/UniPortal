/**
 * 用户信息接口定义
 * 用于存储和传递用户的基本信息
 * @interface UserInfo
 */
export interface UserInfo {
  /** 用户唯一标识 */
  id: string;
  /** 用户名/登录名 */
  username: string;
  /** 用户邮箱 */
  email: string;
  /** 用户角色列表 */
  roles: string[];
  /** 用户头像 URL（可选） */
  avatar?: string;
}

/**
 * 认证状态接口定义
 * 封装当前用户的认证信息和登录状态
 * @interface AuthState
 */
export interface AuthState {
  /** 当前用户信息 */
  user: UserInfo | null;
  /** 用户 Token */
  token: string | null;
  /** 是否已认证 */
  isAuthenticated: boolean;
}

/**
 * 认证事件类型枚举
 * 定义跨应用状态同步时的事件类型
 * @enum {string} AuthAction
 */
export enum AuthAction {
  /** 用户登录成功 */
  LOGIN = 'LOGIN',
  /** 用户主动登出 */
  LOGOUT = 'LOGOUT',
  /** 用户信息变更 */
  USER_CHANGED = 'USER_CHANGED',
  /** 会话过期（Token 失效） */
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  /** 管理员强制下线 */
  FORCE_LOGOUT = 'FORCE_LOGOUT',
}