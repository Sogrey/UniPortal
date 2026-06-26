<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { authStorage, authChannel, AuthAction } from '@my-monorepo/shared';

const user = ref(authStorage.getUser());

const handleLogout = () => {
  authStorage.clear();
  authChannel.broadcast(AuthAction.LOGOUT, { reason: 'User logged out' });
  window.location.href = '/auth/login';
};

const goToAppB = () => {
  window.location.href = '/app-b/';
};

let unlisten: () => void;

onMounted(() => {
  unlisten = authChannel.onMessage((msg) => {
    if (msg.action === AuthAction.LOGIN) {
      user.value = authStorage.getUser();
    }
  });
});

onUnmounted(() => {
  unlisten?.();
});
</script>

<template>
  <div class="home-container">
    <header class="header">
      <div class="header-content">
        <h1 class="app-title">业务应用 A</h1>
        <div class="user-info">
          <span class="username">{{ user?.username }}</span>
          <button @click="handleLogout" class="logout-btn">退出登录</button>
        </div>
      </div>
    </header>
    
    <main class="main-content">
      <div class="card">
        <h2>欢迎回来！</h2>
        <p>您已成功登录到业务应用 A</p>
        <div class="user-details">
          <p><strong>用户名：</strong>{{ user?.username }}</p>
          <p><strong>邮箱：</strong>{{ user?.email }}</p>
          <p><strong>角色：</strong>{{ user?.roles.join(', ') }}</p>
        </div>
      </div>
      
      <div class="card">
        <h3>应用导航</h3>
        <button @click="goToAppB" class="nav-btn">
          跳转到业务应用 B
        </button>
      </div>
      
      <div class="card">
        <h3>测试场景</h3>
        <p>尝试在另一个标签页打开应用 B，然后在此处点击"退出登录"，观察应用 B 是否自动同步登出状态。</p>
      </div>
    </main>
  </div>
</template>

<style lang="scss" scoped>
$primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
$text-primary: #1a1a2e;
$text-secondary: #333;
$text-muted: #666;
$text-error: #e74c3c;
$border-color: #eee;
$shadow-sm: 0 2px 10px rgba(0, 0, 0, 0.1);
$shadow-md: 0 2px 8px rgba(0, 0, 0, 0.05);
$radius-sm: 6px;
$radius-md: 8px;
$radius-lg: 12px;

.home-container {
  min-height: 100vh;
  
  .header {
    background: $primary-gradient;
    padding: 16px 24px;
    box-shadow: $shadow-sm;
    
    .header-content {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .app-title {
        color: white;
        font-size: 24px;
        font-weight: 600;
      }
      
      .user-info {
        display: flex;
        align-items: center;
        gap: 16px;
        
        .username {
          color: white;
          font-size: 16px;
        }
        
        .logout-btn {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
          padding: 8px 16px;
          border-radius: $radius-sm;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.3s;
          
          &:hover {
            background: rgba(255, 255, 255, 0.3);
          }
        }
      }
    }
  }
  
  .main-content {
    max-width: 1200px;
    margin: 32px auto;
    padding: 0 24px;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 24px;
    
    .card {
      background: white;
      border-radius: $radius-lg;
      padding: 24px;
      box-shadow: $shadow-md;
      
      h2 {
        color: $text-primary;
        font-size: 20px;
        margin-bottom: 16px;
      }
      
      h3 {
        color: $text-secondary;
        font-size: 16px;
        margin-bottom: 16px;
      }
      
      p {
        color: $text-muted;
        font-size: 14px;
        line-height: 1.6;
      }
      
      .user-details {
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid $border-color;
        
        p {
          margin-bottom: 8px;
        }
      }
      
      .nav-btn {
        width: 100%;
        background: $primary-gradient;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: $radius-md;
        font-size: 16px;
        font-weight: 500;
        cursor: pointer;
        transition: opacity 0.3s;
        
        &:hover {
          opacity: 0.9;
        }
      }
    }
  }
  
  .message {
    text-align: center;
    color: $text-error;
    padding: 16px;
  }
}
</style>