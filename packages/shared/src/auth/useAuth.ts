import { ref, onMounted, onUnmounted } from 'vue';
import { authChannel, type AuthMessage } from './channel';
import { authStorage } from './storage';
import { AuthAction } from './types';

/**
 * useAuth 配置选项
 * @interface UseAuthOptions
 */
export interface UseAuthOptions {
  /** 登录成功回调 */
  onLogin?: (msg: AuthMessage) => void;
  /** 登出成功回调 */
  onLogout?: (msg: AuthMessage) => void;
  /** 会话过期回调 */
  onSessionExpired?: (msg: AuthMessage) => void;
  /** 用户信息变更回调 */
  onUserChanged?: (msg: AuthMessage) => void;
}

/**
 * useAuth 返回值类型
 * @interface UseAuthReturn
 */
export interface UseAuthReturn {
  /** 当前用户信息 */
  user: import('vue').Ref<typeof authStorage.getUser extends () => infer T ? T : never>;
  /** 当前用户 Token */
  token: import('vue').Ref<typeof authStorage.getToken extends () => infer T ? T : never>;
  /** 是否已认证 */
  isAuthenticated: import('vue').Ref<boolean>;
}

/**
 * 登录状态管理 Composable
 * 封装登录状态监听逻辑，自动处理认证事件并同步更新响应式状态
 * 
 * @param {UseAuthOptions} [options={}] - 配置选项
 * @returns {UseAuthReturn} 用户状态和认证信息
 * 
 * @example
 * // 基础用法
 * const { user, token, isAuthenticated } = useAuth();
 * 
 * @example
 * // 带回调的用法
 * const { user, isAuthenticated } = useAuth({
 *   onLogin: () => router.push('/'),
 *   onLogout: () => router.push('/login'),
 * });
 */
export function useAuth(options: UseAuthOptions = {}): UseAuthReturn {
  const user = ref(authStorage.getUser());
  const token = ref(authStorage.getToken());
  const isAuthenticated = ref(authStorage.getState().isAuthenticated);

  /**
   * 处理认证消息
   * 根据消息类型更新状态并触发对应回调
   * @param {AuthMessage} msg - 认证消息
   */
  const handleAuthMessage = (msg: AuthMessage): void => {
    switch (msg.action) {
      case AuthAction.LOGIN:
        user.value = authStorage.getUser();
        token.value = authStorage.getToken();
        isAuthenticated.value = true;
        options.onLogin?.(msg);
        break;
      case AuthAction.LOGOUT:
        authStorage.clear();
        user.value = null;
        token.value = null;
        isAuthenticated.value = false;
        options.onLogout?.(msg);
        break;
      case AuthAction.SESSION_EXPIRED:
        authStorage.clear();
        user.value = null;
        token.value = null;
        isAuthenticated.value = false;
        options.onSessionExpired?.(msg);
        break;
      case AuthAction.USER_CHANGED:
        user.value = authStorage.getUser();
        options.onUserChanged?.(msg);
        break;
    }
  };

  let unlisten: () => void;

  onMounted(() => {
    unlisten = authChannel.onMessage(handleAuthMessage);
  });

  onUnmounted(() => {
    unlisten?.();
  });

  return {
    user,
    token,
    isAuthenticated,
  };
}

/**
 * useAuthModal 返回值类型
 * @interface UseAuthModalReturn
 */
export interface UseAuthModalReturn {
  /** 是否显示模态框 */
  showModal: { value: boolean };
  /** 模态框消息内容 */
  modalMessage: { value: string };
}

/**
 * 认证模态框管理 Composable
 * 封装登录状态失效时的模态框显示逻辑
 * 自动监听 LOGOUT 和 SESSION_EXPIRED 事件显示弹窗
 * 监听 LOGIN 事件关闭弹窗
 * 
 * @returns {UseAuthModalReturn} 模态框状态
 * 
 * @example
 * const { showModal, modalMessage } = useAuthModal();
 */
export function useAuthModal(): UseAuthModalReturn {
  const showModal = ref(false);
  const modalMessage = ref('');

  /**
   * 处理认证消息
   * 根据消息类型控制模态框显示状态
   * @param {AuthMessage} msg - 认证消息
   */
  const handleAuthMessage = (msg: AuthMessage): void => {
    if (msg.action === AuthAction.LOGOUT || msg.action === AuthAction.SESSION_EXPIRED) {
      authStorage.clear();
      modalMessage.value = msg.action === AuthAction.LOGOUT 
        ? '您的账号已在其他地方登出，请重新登录' 
        : '登录已过期，请重新登录';
      showModal.value = true;
    } else if (msg.action === AuthAction.LOGIN) {
      if (showModal.value) {
        showModal.value = false;
      }
    }
  };

  let unlisten: () => void;

  onMounted(() => {
    unlisten = authChannel.onMessage(handleAuthMessage);
  });

  onUnmounted(() => {
    unlisten?.();
  });

  return {
    showModal,
    modalMessage,
  };
}