import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { authStorage } from '../auth/storage';
import { authChannel } from '../auth/channel';
import { AuthAction } from '../auth/types';

/**
 * 请求拦截器
 * 在发送请求前自动添加 Authorization 头
 * @param {InternalAxiosRequestConfig} config - Axios 请求配置
 * @returns {InternalAxiosRequestConfig} 修改后的请求配置
 */
export function requestInterceptor(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
  const token = authStorage.getToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}

/**
 * 响应拦截器
 * 统一处理成功响应
 * @param {AxiosResponse} response - Axios 响应对象
 * @returns {AxiosResponse} 原始响应对象
 */
export function responseInterceptor(response: AxiosResponse): AxiosResponse {
  return response;
}

/**
 * 错误拦截器
 * 统一处理请求错误，重点处理 401 状态码
 * 当收到 401 响应时，清除本地认证状态并广播会话过期事件
 * @param {unknown} error - 错误对象
 * @returns {Promise<never>} 拒绝的 Promise
 */
export function errorInterceptor(error: unknown): Promise<never> {
  const err = error as { response?: { status?: number } };
  
  if (err.response?.status === 401) {
    authStorage.clear();
    authChannel.broadcast(AuthAction.SESSION_EXPIRED, { reason: 'Token expired or invalid' });
  }
  
  return Promise.reject(error);
}