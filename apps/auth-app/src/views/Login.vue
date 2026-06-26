<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { authStorage, authChannel, AuthAction, parseRedirectParams } from '@my-monorepo/shared';

const router = useRouter();

/** 用户名输入 */
const username = ref('');
/** 密码输入 */
const password = ref('');
/** 登录加载状态 */
const loading = ref(false);
/** 错误提示信息 */
const error = ref('');

/**
 * 处理登录提交
 * 验证表单、模拟登录请求、存储认证信息、广播登录事件、处理重定向
 */
const handleLogin = async () => {
  if (!username.value || !password.value) {
    error.value = '请输入用户名和密码';
    return;
  }
  
  loading.value = true;
  error.value = '';
  
  try {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockUser = {
      id: '1',
      username: username.value,
      email: `${username.value}@example.com`,
      roles: ['admin'],
      avatar: '',
    };
    const mockToken = `mock_token_${Date.now()}`;
    
    authStorage.setToken(mockToken);
    authStorage.setUser(mockUser);
    
    authChannel.broadcast(AuthAction.LOGIN, { user: mockUser, token: mockToken });
    
    const { redirectUrl, returnTo } = parseRedirectParams();
    
    if (redirectUrl) {
      window.location.href = redirectUrl;
    } else if (returnTo) {
      router.push(returnTo);
    } else {
      router.push('/');
    }
  } catch {
    error.value = '登录失败，请重试';
  } finally {
    loading.value = false;
  }
};

let unlisten: () => void;

onMounted(() => {
  /**
   * 监听其他页面的登录事件
   * 如果其他页签已登录，自动跳转首页
   */
  unlisten = authChannel.onMessage((msg) => {
    if (msg.action === AuthAction.LOGIN) {
      router.push('/');
    }
  });
});

onUnmounted(() => {
  unlisten?.();
});
</script>

<template>
  <div class="login-container">
    <div class="login-box">
      <h2 class="login-title">欢迎登录</h2>
      <p class="login-subtitle">请输入您的账号信息</p>
      
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="username">用户名</label>
          <input
            id="username"
            v-model="username"
            type="text"
            placeholder="请输入用户名"
            class="form-input"
          />
        </div>
        
        <div class="form-group">
          <label for="password">密码</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="请输入密码"
            class="form-input"
          />
        </div>
        
        <p v-if="error" class="error-message">{{ error }}</p>
        
        <button type="submit" :disabled="loading" class="login-btn">
          <span v-if="loading">登录中...</span>
          <span v-else>登 录</span>
        </button>
      </form>
    </div>
  </div>
</template>

<style lang="scss" scoped>
$primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
$text-primary: #1a1a2e;
$text-secondary: #333;
$text-muted: #888;
$text-error: #e74c3c;
$border-color: #ddd;
$border-focus: #667eea;
$shadow-lg: 0 20px 60px rgba(0, 0, 0, 0.3);
$radius-md: 8px;
$radius-xl: 16px;

.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
}

.login-box {
  background: white;
  border-radius: $radius-xl;
  padding: 40px;
  width: 100%;
  max-width: 420px;
  box-shadow: $shadow-lg;
  
  .login-title {
    font-size: 28px;
    font-weight: 600;
    color: $text-primary;
    margin-bottom: 8px;
  }
  
  .login-subtitle {
    font-size: 14px;
    color: $text-muted;
    margin-bottom: 32px;
  }
  
  .login-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
    
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
      
      label {
        font-size: 14px;
        font-weight: 500;
        color: $text-secondary;
      }
      
      .form-input {
        width: 100%;
        padding: 12px 16px;
        border: 1px solid $border-color;
        border-radius: $radius-md;
        font-size: 16px;
        transition: border-color 0.3s;
        
        &:focus {
          outline: none;
          border-color: $border-focus;
        }
      }
      
      .error-message {
        color: $text-error;
        font-size: 14px;
        margin: 0;
      }
    }
    
    .login-btn {
      background: $primary-gradient;
      color: white;
      border: none;
      padding: 14px;
      border-radius: $radius-md;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.3s;
      
      &:hover:not(:disabled) {
        opacity: 0.9;
      }
      
      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }
  }
}
</style>