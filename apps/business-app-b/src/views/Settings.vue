<script setup lang="ts">
import { ref } from 'vue';
import { authStorage } from '@my-monorepo/shared';

const user = ref(authStorage.getUser());
</script>

<template>
  <div class="settings-container">
    <header class="header">
      <div class="header-content">
        <h1 class="app-title">业务应用 B</h1>
        <span class="username">{{ user?.username }}</span>
      </div>
    </header>
    
    <main class="main-content">
      <div class="card">
        <h2>系统设置</h2>
        <div class="form-group">
          <label>用户名</label>
          <input type="text" :value="user?.username" disabled class="form-input" />
        </div>
        <div class="form-group">
          <label>邮箱</label>
          <input type="email" :value="user?.email" disabled class="form-input" />
        </div>
        <div class="form-group">
          <label>角色</label>
          <input type="text" :value="user?.roles.join(', ')" disabled class="form-input" />
        </div>
        <div class="form-group">
          <label>用户 ID</label>
          <input type="text" :value="user?.id" disabled class="form-input" />
        </div>
      </div>
    </main>
  </div>
</template>

<style lang="scss" scoped>
$primary-gradient: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
$text-primary: #1a1a2e;
$text-secondary: #333;
$text-muted: #666;
$border-color: #ddd;
$bg-disabled: #f5f5f5;
$shadow-sm: 0 2px 10px rgba(0, 0, 0, 0.1);
$shadow-md: 0 2px 8px rgba(0, 0, 0, 0.05);
$radius-md: 8px;
$radius-lg: 12px;

.settings-container {
  min-height: 100vh;
  
  .header {
    background: $primary-gradient;
    padding: 16px 24px;
    box-shadow: $shadow-sm;
    
    .header-content {
      max-width: 800px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .app-title {
        color: white;
        font-size: 24px;
        font-weight: 600;
      }
      
      .username {
        color: white;
        font-size: 16px;
      }
    }
  }
  
  .main-content {
    max-width: 800px;
    margin: 32px auto;
    padding: 0 24px;
    
    .card {
      background: white;
      border-radius: $radius-lg;
      padding: 24px;
      box-shadow: $shadow-md;
      
      h2 {
        color: $text-primary;
        font-size: 20px;
        margin-bottom: 24px;
      }
      
      .form-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 16px;
        
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
          background: $bg-disabled;
          color: $text-muted;
        }
      }
    }
  }
}
</style>