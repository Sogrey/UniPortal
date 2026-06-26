import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { authStorage } from '../auth/storage';
import { authChannel } from '../auth/channel';
import { AuthAction } from '../auth/types';

export function requestInterceptor(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
  const token = authStorage.getToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}

export function responseInterceptor(response: AxiosResponse): AxiosResponse {
  return response;
}

export function errorInterceptor(error: unknown): Promise<never> {
  const err = error as { response?: { status?: number } };
  if (err.response?.status === 401) {
    authStorage.clear();
    authChannel.broadcast(AuthAction.SESSION_EXPIRED, { reason: 'Token expired or invalid' });
  }
  return Promise.reject(error);
}