<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuth, authStorage, authChannel, AuthAction } from '@my-monorepo/shared';

const router = useRouter();

/**
 * 使用登录状态管理 Composable
 * 自动监听认证事件并同步更新用户状态
 * @param {Object} options - 回调配置
 * @param {Function} options.onLogin - 登录成功回调
 * @param {Function} options.onLogout - 登出成功回调
 * @param {Function} options.onSessionExpired - 会话过期回调
 */
const { user, token, isAuthenticated } = useAuth({
  onLogin: () => {
    router.push('/');
  },
  onLogout: () => {
    router.push('/login');
  },
  onSessionExpired: () => {
    router.push('/login');
  },
});

/**
 * 业务应用列表
 * 配置应用名称、路径和图标
 */
const apps = [
  { name: '业务应用 A', path: '/app-a/', icon: '📊' },
  { name: '业务应用 B', path: '/app-b/', icon: '⚙️' },
];

/**
 * 处理退出登录
 * 清除本地存储、广播登出事件、跳转登录页
 */
const handleLogout = () => {
  authStorage.clear();
  authChannel.broadcast(AuthAction.LOGOUT, {});
  router.push('/login');
};

/**
 * 在新标签页打开业务应用
 * @param {string} path - 应用路径
 */
const goToApp = (path: string) => {
  window.open(path, '_blank');
};
</script>

<template>
  <div class="portal-container">
    <header class="portal-header">
      <div class="header-content">
        <div class="logo-section">
          <div class="logo-icon">🔐</div>
          <div class="logo-text">
            <h1>统一认证中心</h1>
            <p>UniPortal</p>
          </div>
        </div>
        
        <div v-if="isAuthenticated" class="user-section">
          <div class="user-info">
            <div class="user-avatar">{{ user?.username?.charAt(0) || '?' }}</div>
            <div class="user-detail">
              <span class="user-name">{{ user?.username }}</span>
              <span class="user-email">{{ user?.email }}</span>
            </div>
          </div>
          <button @click="handleLogout" class="logout-btn">退出登录</button>
        </div>
      </div>
    </header>

    <main class="portal-main">
      <div v-if="!isAuthenticated" class="welcome-section">
        <div class="welcome-card">
          <div class="welcome-icon">👋</div>
          <h2>欢迎来到统一认证中心</h2>
          <p>请先登录，然后访问各个业务应用</p>
          <button @click="$router.push('/login')" class="primary-btn">立即登录</button>
        </div>
      </div>

      <div v-else class="dashboard-section">
        <div class="section-title">
          <h2>应用列表</h2>
          <p>选择您要访问的应用</p>
        </div>
        
        <div class="apps-grid">
          <div 
            v-for="app in apps" 
            :key="app.name"
            class="app-card"
            @click="goToApp(app.path)"
          >
            <div class="app-icon">{{ app.icon }}</div>
            <div class="app-info">
              <h3>{{ app.name }}</h3>
              <span class="app-path">{{ app.path }}</span>
            </div>
            <div class="app-arrow">→</div>
          </div>
        </div>

        <div class="info-section">
          <div class="info-card">
            <h3>📋 当前会话</h3>
            <div class="info-item">
              <span class="label">用户名</span>
              <span class="value">{{ user?.username }}</span>
            </div>
            <div class="info-item">
              <span class="label">邮箱</span>
              <span class="value">{{ user?.email }}</span>
            </div>
            <div class="info-item">
              <span class="label">角色</span>
              <span class="value">{{ user?.roles?.join(', ') }}</span>
            </div>
            <div class="info-item token-item">
              <span class="label">Token</span>
              <span class="value">{{ token?.substring(0, 20) }}...</span>
            </div>
          </div>
        </div>
      </div>
    </main>

    <footer class="portal-footer">
      <p>© 2026 UniPortal. 统一用户认证与状态同步方案</p>
    </footer>
  </div>
</template>

<style lang="scss" scoped>
$primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
$bg-gradient: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
$text-primary: #1a1a2e;
$text-secondary: #333;
$text-muted: #888;
$border-color: #f0f0f0;
$shadow-sm: 0 2px 10px rgba(0, 0, 0, 0.1);
$shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
$shadow-lg: 0 20px 60px rgba(0, 0, 0, 0.1);
$radius-sm: 6px;
$radius-md: 8px;
$radius-lg: 12px;
$radius-xl: 16px;

.portal-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: $bg-gradient;
}

.portal-header {
  background: white;
  box-shadow: $shadow-sm;
  padding: 16px 24px;
  
  .header-content {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .logo-section {
      display: flex;
      align-items: center;
      gap: 12px;
      
      .logo-icon {
        font-size: 32px;
      }
      
      .logo-text {
        h1 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
          color: $text-primary;
        }
        
        p {
          margin: 0;
          font-size: 12px;
          color: $text-muted;
        }
      }
    }
    
    .user-section {
      display: flex;
      align-items: center;
      gap: 16px;
      
      .user-info {
        display: flex;
        align-items: center;
        gap: 12px;
        
        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: $primary-gradient;
          color: white;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 16px;
          font-weight: 600;
        }
        
        .user-detail {
          display: flex;
          flex-direction: column;
          
          .user-name {
            font-size: 14px;
            font-weight: 500;
            color: $text-secondary;
          }
          
          .user-email {
            font-size: 12px;
            color: $text-muted;
          }
        }
      }
      
      .logout-btn {
        padding: 8px 16px;
        background: #f8f9fa;
        border: 1px solid #ddd;
        border-radius: $radius-sm;
        font-size: 14px;
        color: #666;
        cursor: pointer;
        transition: all 0.3s;
        
        &:hover {
          background: #e9ecef;
          color: #dc3545;
          border-color: #dc3545;
        }
      }
    }
  }
}

.portal-main {
  flex: 1;
  padding: 40px 24px;
  
  .welcome-section {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 50vh;
    
    .welcome-card {
      background: white;
      border-radius: $radius-xl;
      padding: 60px;
      text-align: center;
      box-shadow: $shadow-lg;
      
      .welcome-icon {
        font-size: 64px;
        margin-bottom: 24px;
      }
      
      h2 {
        font-size: 28px;
        color: $text-primary;
        margin-bottom: 12px;
      }
      
      p {
        font-size: 16px;
        color: $text-muted;
        margin-bottom: 32px;
      }
      
      .primary-btn {
        background: $primary-gradient;
        color: white;
        border: none;
        padding: 14px 40px;
        border-radius: $radius-md;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: opacity 0.3s;
        
        &:hover {
          opacity: 0.9;
        }
      }
    }
  }
  
  .dashboard-section {
    max-width: 1200px;
    margin: 0 auto;
    
    .section-title {
      margin-bottom: 32px;
      
      h2 {
        font-size: 24px;
        color: $text-primary;
        margin: 0 0 8px 0;
      }
      
      p {
        font-size: 14px;
        color: $text-muted;
        margin: 0;
      }
    }
    
    .apps-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 24px;
      margin-bottom: 32px;
      
      .app-card {
        background: white;
        border-radius: $radius-lg;
        padding: 24px;
        display: flex;
        align-items: center;
        gap: 16px;
        box-shadow: $shadow-md;
        cursor: pointer;
        transition: transform 0.3s, box-shadow 0.3s;
        
        &:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        }
        
        .app-icon {
          font-size: 40px;
        }
        
        .app-info {
          flex: 1;
          
          h3 {
            font-size: 18px;
            color: $text-primary;
            margin: 0 0 4px 0;
          }
          
          .app-path {
            font-size: 12px;
            color: $text-muted;
          }
        }
        
        .app-arrow {
          font-size: 20px;
          color: #667eea;
        }
      }
    }
    
    .info-section {
      display: flex;
      justify-content: center;
      
      .info-card {
        background: white;
        border-radius: $radius-lg;
        padding: 24px;
        width: 100%;
        max-width: 400px;
        box-shadow: $shadow-md;
        
        h3 {
          font-size: 16px;
          color: $text-primary;
          margin: 0 0 20px 0;
        }
        
        .info-item {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid $border-color;
          
          &:last-child {
            border-bottom: none;
          }
          
          .label {
            font-size: 14px;
            color: $text-muted;
          }
          
          .value {
            font-size: 14px;
            color: $text-secondary;
            font-weight: 500;
          }
          
          &.token-item .value {
            font-family: monospace;
            font-size: 12px;
            color: #667eea;
          }
        }
      }
    }
  }
}

.portal-footer {
  text-align: center;
  padding: 24px;
  background: white;
  border-top: 1px solid $border-color;
  
  p {
    margin: 0;
    font-size: 14px;
    color: $text-muted;
  }
}
</style>