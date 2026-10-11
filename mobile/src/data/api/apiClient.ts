import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { useAuthStore } from '../../domain/stores/authStore';

function packagerHost(): string {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).expoGoConfig?.debuggerHost ||
    (Constants as any).manifest2?.extra?.expoClient?.hostUri ||
    (Constants as any).manifest?.debuggerHost;

  if (hostUri && typeof hostUri === 'string') {
    const host = hostUri.split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') return host;
  }
  return '';
}

function resolveBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  
  // Always prioritize the environment variable if it's a valid URL
  if (fromEnv && fromEnv.startsWith('http')) {
    return fromEnv;
  }
  
  if (Platform.OS === 'web') {
    const pageHost = typeof window !== 'undefined' ? window.location.hostname : '';
    if (!pageHost || pageHost === 'localhost' || pageHost === '127.0.0.1') {
      return 'http://127.0.0.1:5000/api';
    }
    return `http://${pageHost}:5000/api`;
  }
  
  // For mobile: use env variable or try local network
  if (fromEnv) return fromEnv;
  
  const host = packagerHost();
  if (host) return `http://${host}:5000/api`;
  
  return 'http://127.0.0.1:5000/api';
}

const BASE_URL = resolveBaseUrl();

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  config.baseURL = resolveBaseUrl();
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
    const method = String(error.config?.method || 'get').toLowerCase();
    if (
      (error.code === 'ERR_NETWORK' || error.message === 'Network Error')
      && error.config
      && !error.config._retriedOnce
      && method === 'get'
    ) {
      error.config._retriedOnce = true;
      try {
        return await axios.request(error.config);
      } catch (retryError: any) {
        error = retryError;
      }
    }

    if ((error.code === 'ERR_NETWORK' || error.message === 'Network Error') && error.config && !error.config._retriedWithFallback) {
      const currentBase = error.config.baseURL || BASE_URL;
      const localBase = 'http://127.0.0.1:5000/api';
      const fallbackBase = Platform.OS === 'web' && currentBase !== localBase ? localBase : resolveBaseUrl();
      if (fallbackBase && fallbackBase !== currentBase && (Platform.OS === 'web' || !/localhost|127\.0\.0\.1/.test(fallbackBase))) {
        console.log(`[MOBILE CLIENT] 🔄 Network error on ${currentBase}. Retrying with ${fallbackBase}`);
        error.config.baseURL = fallbackBase;
        error.config._retriedWithFallback = true;
        try {
          return await axios.request(error.config);
        } catch (fallbackError: any) {
          error = fallbackError;
        }
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
