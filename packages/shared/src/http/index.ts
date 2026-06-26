import axios, { type AxiosInstance } from 'axios';
import { requestInterceptor, responseInterceptor, errorInterceptor } from './interceptors';

/** API 基础地址（从环境变量读取） */
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Axios 实例
 * 配置统一的请求拦截器和响应拦截器
 * - 请求拦截器：自动添加 Authorization 头
 * - 响应拦截器：统一处理成功响应
 * - 错误拦截器：统一处理 401 等错误
 * @type {AxiosInstance}
 */
const http: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

http.interceptors.request.use(requestInterceptor);
http.interceptors.response.use(responseInterceptor, errorInterceptor);

export { http };
export default http;