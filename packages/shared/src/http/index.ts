import axios, { type AxiosInstance } from 'axios';
import { requestInterceptor, responseInterceptor, errorInterceptor } from './interceptors';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

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