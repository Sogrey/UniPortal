import type { AuthAction, UserInfo } from './types';

/** BroadcastChannel 通道名称 */
const CHANNEL_NAME = 'auth_sync_channel';

/**
 * 认证消息接口定义
 * 用于跨应用/跨页签传递认证状态变更事件
 * @interface AuthMessage
 */
export interface AuthMessage {
  /** 事件类型 */
  action: AuthAction;
  /** 消息负载（可选） */
  payload?: {
    /** 用户信息 */
    user?: UserInfo;
    /** Token */
    token?: string;
    /** 事件原因 */
    reason?: string;
  };
  /** 发送者标识（唯一） */
  sender: string;
  /** 时间戳 */
  timestamp: number;
  /** 消息唯一 ID（用于去重） */
  messageId: string;
}

/**
 * 认证通道管理器
 * 基于 BroadcastChannel API 实现跨应用/跨标签页的实时状态同步
 * 支持 localStorage 降级方案（不支持 BroadcastChannel 的浏览器）
 * 
 * 核心特性：
 * - 每个页签拥有唯一的 senderId，确保消息不会被自身接收
 * - 消息去重机制，避免重复处理同一事件
 * - 自动降级到 localStorage + storage 事件方案
 */
class AuthChannel {
  /** BroadcastChannel 实例 */
  private channel: BroadcastChannel | null = null;
  /** 消息监听器集合 */
  private listeners: Set<(msg: AuthMessage) => void> = new Set();
  /** 已接收消息 ID 集合（用于去重） */
  private receivedMessages: Set<string> = new Set();
  /** 当前页签的唯一标识 */
  private senderId: string;

  constructor() {
    this.senderId = this.generateSenderId();
    try {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
      this.channel.addEventListener('message', this.handleMessage.bind(this));
    } catch {
      this.setupFallback();
    }
  }

  /**
   * 处理接收到的消息
   * @param {MessageEvent} event - MessageEvent 事件对象
   */
  private handleMessage(event: MessageEvent): void {
    const msg = event.data as AuthMessage;
    
    if (msg.sender === this.senderId) return;
    
    if (this.receivedMessages.has(msg.messageId)) return;
    
    this.receivedMessages.add(msg.messageId);
    
    this.listeners.forEach(cb => cb(msg));
    
    setTimeout(() => this.receivedMessages.delete(msg.messageId), 5000);
  }

  /**
   * 设置 localStorage 降级方案
   * 通过监听 storage 事件实现跨页面通信
   */
  private setupFallback(): void {
    const handler = (e: StorageEvent): void => {
      if (e.key === 'auth_fallback' && e.newValue) {
        try {
          const msg = JSON.parse(e.newValue) as AuthMessage;
          if (msg.sender !== this.senderId && !this.receivedMessages.has(msg.messageId)) {
            this.receivedMessages.add(msg.messageId);
            this.listeners.forEach(cb => cb(msg));
            setTimeout(() => this.receivedMessages.delete(msg.messageId), 5000);
          }
        } catch {}
      }
    };
    window.addEventListener('storage', handler);
  }

  /**
   * 广播认证事件
   * @param {AuthAction} action - 事件类型
   * @param {AuthMessage['payload']} [payload] - 消息负载（可选）
   */
  broadcast(action: AuthAction, payload?: AuthMessage['payload']): void {
    const msg: AuthMessage = {
      action,
      payload,
      sender: this.senderId,
      timestamp: Date.now(),
      messageId: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    };

    if (this.channel) {
      this.channel.postMessage(msg);
    } else {
      localStorage.setItem('auth_fallback', JSON.stringify(msg));
      setTimeout(() => localStorage.removeItem('auth_fallback'), 500);
    }
  }

  /**
   * 注册消息监听器
   * @param {(msg: AuthMessage) => void} callback - 消息回调函数
   * @returns {() => void} 取消监听的函数
   */
  onMessage(callback: (msg: AuthMessage) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * 生成唯一的发送者 ID
   * 格式：{应用前缀}_{时间戳}_{随机字符串}
   * 确保同一应用的多个页签拥有不同的标识
   * @returns {string} 唯一发送者 ID
   */
  private generateSenderId(): string {
    const path = window.location.pathname;
    const match = path.match(/^\/([^/]+)/);
    const appPrefix = match ? match[1] : 'unknown';
    const uuid = `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    return `${appPrefix}_${uuid}`;
  }

  /**
   * 关闭通道并清理资源
   */
  close(): void {
    this.channel?.close();
    this.listeners.clear();
    this.receivedMessages.clear();
  }
}

/**
 * 全局认证通道实例
 * 所有应用共享同一个通道实例，实现跨应用状态同步
 */
export const authChannel = new AuthChannel();