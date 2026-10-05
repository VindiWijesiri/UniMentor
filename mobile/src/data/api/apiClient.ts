import axios from 'axios';
import { useAuthStore } from '../../domain/stores/authStore';

// Dynamic backend URL from environment or default to local IP / localhost
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.2:5000/api';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log(`[MOBILE CLIENT REQ] ➡️ ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, {
    params: config.params,
    hasToken: !!token,
  });
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    const dataSummary = Array.isArray(response.data)
      ? `Array with ${response.data.length} items`
      : typeof response.data === 'object' && response.data !== null
      ? Object.keys(response.data).join(', ')
      : response.data;
    console.log(`[MOBILE CLIENT RES] ✅ ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url} -> ${dataSummary}`);
    return response;
  },
  async (error) => {
    // If request failed with network error, attempt fallback between localhost (USB) and Wi-Fi IP
    if ((error.code === 'ERR_NETWORK' || error.message === 'Network Error') && error.config && !error.config._retriedWithFallback) {
      const currentBase = error.config.baseURL || BASE_URL;
      const fallbackBase = currentBase.includes('localhost') || currentBase.includes('127.0.0.1')
        ? 'http://192.168.1.2:5000/api'
        : 'http://localhost:5000/api';

      console.log(`[MOBILE CLIENT] 🔄 Network error on ${currentBase}. Retrying with fallback: ${fallbackBase}`);
      error.config.baseURL = fallbackBase;
      error.config._retriedWithFallback = true;
      try {
        return await axios.request(error.config);
      } catch (fallbackError: any) {
        error = fallbackError;
      }
    }

    console.error(`[MOBILE CLIENT ERR] ❌ Call failed: ${error.config?.method?.toUpperCase()} ${error.config?.baseURL}${error.config?.url}`, {
      status: error.response?.status,
      errorData: error.response?.data,
      message: error.message,
      code: error.code,
    });

    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      console.warn('[MOBILE CLIENT] ⚠️ 401 Unauthorized received — clearing session');
      useAuthStore.getState().logout();
    }

    if (error.response?.data?.message) {
      error.message = error.response.data.message;
    } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      error.message = `Cannot reach backend server.\nEnsure backend is running and phone is connected via USB or same Wi-Fi.`;
    } else if (error.message === 'Network Error' && !error.response) {
      error.message = `Network Error: Cannot connect to backend server.\nEnsure backend is running and phone is connected via USB or same Wi-Fi.`;
    }

    return Promise.reject(error);
  }
);

export default apiClient;
