import axios from 'axios';
import { NativeModules } from 'react-native';
import { useAuthStore } from '../../domain/stores/authStore';

function isPrivateHost(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '10.0.2.2' ||
    hostname.startsWith('10.') ||
    hostname.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
  );
}

/** Metro's host is the PC the phone can already reach. Follow it when the saved API URL is a stale LAN address. */
function packagerHost(): string | null {
  const sourceCode = NativeModules.SourceCode as
    | { scriptURL?: string; getConstants?: () => { scriptURL?: string | null } }
    | undefined;
  const scriptURL = sourceCode?.scriptURL ?? sourceCode?.getConstants?.()?.scriptURL ?? undefined;
  if (!scriptURL) return null;
  try {
    const hostname = new URL(scriptURL).hostname;
    return isPrivateHost(hostname) ? hostname : null;
  } catch {
    return null;
  }
}

function resolveBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5000/api';
  const host = packagerHost();
  if (!host) return configured;
  try {
    const url = new URL(configured);
    if (isPrivateHost(url.hostname) && url.hostname !== host) {
      url.hostname = host;
    }
    return url.toString().replace(/\/$/, '');
  } catch {
    return configured;
  }
}

const BASE_URL = resolveBaseUrl();

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) void useAuthStore.getState().logout();
    return Promise.reject(error);
  }
);

export default apiClient;
