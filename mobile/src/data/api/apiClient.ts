import axios from 'axios';
import Constants from 'expo-constants';
import { NativeModules, Platform } from 'react-native';
import { useAuthStore } from '../../domain/stores/authStore';

function isPrivateHost(hostname: string): boolean {
  return (
    hostname === 'localhost'
    || hostname === '127.0.0.1'
    || hostname === '10.0.2.2'
    || hostname.startsWith('10.')
    || hostname.startsWith('192.168.')
    || /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
  );
}

function hostFromUri(value?: string | null): string | null {
  if (!value) return null;
  try {
    const normalized = value.includes('://') ? value : `http://${value}`;
    const hostname = new URL(normalized).hostname;
    return isPrivateHost(hostname) ? hostname : null;
  } catch {
    return null;
  }
}

function packagerHost(): string | null {
  const extras = Constants.expoConfig?.hostUri
    ?? Constants.linkingUri
    ?? (Constants as { debuggerHost?: string }).debuggerHost;
  const fromExpo = hostFromUri(extras);
  if (fromExpo) return fromExpo;

  const sourceCode = NativeModules.SourceCode as
    | { scriptURL?: string; getConstants?: () => { scriptURL?: string | null } }
    | undefined;
  const scriptURL = sourceCode?.scriptURL ?? sourceCode?.getConstants?.()?.scriptURL ?? undefined;
  return hostFromUri(scriptURL);
}

function resolveBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5000/api';
  try {
    const url = new URL(configured);
    const host = packagerHost();
    if (host && isPrivateHost(url.hostname)) {
      url.hostname = Platform.OS === 'android' && host === 'localhost' ? '10.0.2.2' : host;
    }
    return url.toString().replace(/\/$/, '');
  } catch {
    return configured.replace(/\/$/, '');
  }
}

const apiClient = axios.create({
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
  (error) => {
    const baseURL = error.config?.baseURL ?? resolveBaseUrl();
    console.error(`[MOBILE CLIENT ERR] ❌ Call failed: ${error.config?.method?.toUpperCase()} ${baseURL}${error.config?.url}`, {
      status: error.response?.status,
      errorData: error.response?.data,
      message: error.message,
      code: error.code,
    });

    if (error.response?.status === 401) {
      console.warn('[MOBILE CLIENT] ⚠️ 401 Unauthorized received — clearing session');
      useAuthStore.getState().logout();
    }

    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      error.message = `Cannot reach backend server at ${baseURL}.\nEnsure your phone and PC are connected to the same Wi-Fi.`;
    } else if (error.message === 'Network Error' && !error.response) {
      error.message = `Network Error: Cannot connect to ${baseURL}.\nVerify your PC's IP address.`;
    }

    return Promise.reject(error);
  }
);

export default apiClient;
