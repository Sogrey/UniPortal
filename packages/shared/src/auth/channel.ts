import type { AuthAction, UserInfo } from './types';

const CHANNEL_NAME = 'auth_sync_channel';

export interface AuthMessage {
  action: AuthAction;
  payload?: {
    user?: UserInfo;
    token?: string;
    reason?: string;
  };
  sender: string;
  timestamp: number;
  messageId: string;
}

class AuthChannel {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<(msg: AuthMessage) => void> = new Set();
  private receivedMessages: Set<string> = new Set();
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

  private handleMessage(event: MessageEvent) {
    const msg = event.data as AuthMessage;
    if (msg.sender === this.senderId) return;
    if (this.receivedMessages.has(msg.messageId)) return;
    this.receivedMessages.add(msg.messageId);
    this.listeners.forEach(cb => cb(msg));
    setTimeout(() => this.receivedMessages.delete(msg.messageId), 5000);
  }

  private setupFallback() {
    const handler = (e: StorageEvent) => {
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

  broadcast(action: AuthAction, payload?: AuthMessage['payload']) {
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

  onMessage(callback: (msg: AuthMessage) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private generateSenderId(): string {
    const path = window.location.pathname;
    const match = path.match(/^\/([^/]+)/);
    const appPrefix = match ? match[1] : 'unknown';
    const uuid = `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    return `${appPrefix}_${uuid}`;
  }

  close() {
    this.channel?.close();
    this.listeners.clear();
    this.receivedMessages.clear();
  }
}

export const authChannel = new AuthChannel();