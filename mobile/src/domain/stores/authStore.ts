import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { User } from '../entities/User';

const TOKEN_KEY = 'unimentor.token';
const USER_KEY = 'unimentor.user';

async function write(key: string, value: string) {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    /* web / unsupported */
  }
}

async function remove(key: string) {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    /* ignore */
  }
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  hydrated: boolean;
  setSession: (user: User, token: string) => Promise<void>;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  hydrated: false,
  setSession: async (user, token) => {
    await write(TOKEN_KEY, token);
    await write(USER_KEY, JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },
  setUser: (user) => {
    void write(USER_KEY, JSON.stringify(user));
    set({ user, isAuthenticated: true });
  },
  setToken: (token) => {
    void write(TOKEN_KEY, token);
    set({ token });
  },
  logout: async () => {
    await remove(TOKEN_KEY);
    await remove(USER_KEY);
    set({ user: null, token: null, isAuthenticated: false });
  },
  hydrate: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const raw = await SecureStore.getItemAsync(USER_KEY);
      if (token && raw) {
        set({ token, user: JSON.parse(raw) as User, isAuthenticated: true, hydrated: true });
        return;
      }
    } catch {
      /* ignore corrupt storage */
    }
    set({ hydrated: true });
  },
}));
