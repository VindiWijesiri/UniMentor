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
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) useAuthStore.getState().logout();
    return Promise.reject(error);
  }
);

export default apiClient;
