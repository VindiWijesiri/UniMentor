import axios from 'axios';
import { useAuthStore } from '../../domain/stores/authStore';

// Hotspot IP address
const BASE_URL = 'http://172.20.10.3:5000/api';

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
  (error) => {
    console.error(`[MOBILE CLIENT ERR] ❌ Call failed: ${error.config?.method?.toUpperCase()} ${error.config?.baseURL}${error.config?.url}`, {
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
      error.message = `Cannot reach backend server at ${BASE_URL}.\nEnsure your phone and PC are connected to the same Wi-Fi.`;
    } else if (error.message === 'Network Error' && !error.response) {
      error.message = `Network Error: Cannot connect to ${BASE_URL}.\nVerify your PC's IP address.`;
    }

    return Promise.reject(error);
  }
);

export default apiClient;
