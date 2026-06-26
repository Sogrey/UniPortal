<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { authChannel, authStorage, AuthAction, buildLoginUrl } from '@my-monorepo/shared';

const showModal = ref(false);
const modalMessage = ref('');

const handleAuthMessage = (msg: { action: AuthAction; payload?: { reason?: string } }) => {
  if (msg.action === AuthAction.LOGOUT || msg.action === AuthAction.SESSION_EXPIRED) {
    authStorage.clear();
    modalMessage.value = msg.action === AuthAction.LOGOUT 
      ? '您的账号已在其他地方登出，请重新登录' 
      : '登录已过期，请重新登录';
    showModal.value = true;
  } else if (msg.action === AuthAction.LOGIN) {
    if (showModal.value) {
      showModal.value = false;
      window.location.reload();
    }
  }
};

const handleConfirm = () => {
  showModal.value = false;
  const currentUrl = window.location.href;
  const loginUrl = buildLoginUrl(currentUrl);
  window.location.href = loginUrl;
};

let unlisten: () => void;

onMounted(() => {
  unlisten = authChannel.onMessage(handleAuthMessage);
});

onUnmounted(() => {
  unlisten?.();
});
</script>

<template>
  <div>
    <router-view />
    
    <Transition name="fade">
      <div v-if="showModal" class="modal-overlay" @click.self="handleConfirm">
        <div class="modal-dialog">
          <div class="modal-icon">🔒</div>
          <h3 class="modal-title">登录状态已变更</h3>
          <p class="modal-message">{{ modalMessage }}</p>
          <button class="modal-confirm-btn" @click="handleConfirm">
            确认重新登录
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
$primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
$text-primary: #1a1a2e;
$text-secondary: #666;
$shadow-lg: 0 20px 60px rgba(0, 0, 0, 0.3);
$radius-md: 8px;
$radius-xl: 16px;

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
  
  .modal-dialog {
    background: white;
    border-radius: $radius-xl;
    padding: 40px;
    width: 100%;
    max-width: 420px;
    text-align: center;
    box-shadow: $shadow-lg;
    animation: slideUp 0.3s ease;
    
    .modal-icon {
      font-size: 48px;
      margin-bottom: 20px;
    }
    
    .modal-title {
      font-size: 20px;
      font-weight: 600;
      color: $text-primary;
      margin-bottom: 12px;
    }
    
    .modal-message {
      font-size: 14px;
      color: $text-secondary;
      margin-bottom: 32px;
      line-height: 1.6;
    }
    
    .modal-confirm-btn {
      background: $primary-gradient;
      color: white;
      border: none;
      padding: 14px 40px;
      border-radius: $radius-md;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.3s;
      width: 100%;
      
      &:hover {
        opacity: 0.9;
      }
    }
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>