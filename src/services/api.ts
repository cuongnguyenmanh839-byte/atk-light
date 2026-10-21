/**
 * api.ts – Axios instance với auto JWT refresh
 * Tất cả request đi qua đây, không fetch trực tiếp trong component
 */
import axios from 'axios';

const customUrl = typeof localStorage !== 'undefined' ? localStorage.getItem('atk-api-url') : null;
const isCapacitor = typeof window !== 'undefined' && (
  window.location.protocol === 'capacitor:' || 
  window.location.protocol === 'ionic:' ||
  (window.location.hostname === 'localhost' && typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent))
);

const defaultApi = isCapacitor ? 'http://192.168.100.23:3001/api' : '/api';

export const BASE_URL = customUrl || (import.meta as any).env?.VITE_API_URL || defaultApi;

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach access token ──────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('atk-access-token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response interceptor: auto-refresh on 401 ────────────────────────────
let refreshing = false;
let failedQueue: Array<{ resolve: (v: any) => void; reject: (e: any) => void }> = [];

function processQueue(error: any, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve(token)));
  failedQueue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      if (refreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }
      original._retry = true;
      refreshing = true;
      const refreshToken = localStorage.getItem('atk-refresh-token');
      if (!refreshToken) {
        refreshing = false;
        processQueue(error, null);
        window.dispatchEvent(new Event('atk:logout'));
        return Promise.reject(error);
      }
      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefresh } = data.data;
        localStorage.setItem('atk-access-token', accessToken);
        localStorage.setItem('atk-refresh-token', newRefresh);
        api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        processQueue(null, accessToken);
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch (err) {
        processQueue(err, null);
        localStorage.removeItem('atk-access-token');
        localStorage.removeItem('atk-refresh-token');
        window.dispatchEvent(new Event('atk:logout'));
        return Promise.reject(err);
      } finally {
        refreshing = false;
      }
    }
    return Promise.reject(error);
  },
);

export default api;
