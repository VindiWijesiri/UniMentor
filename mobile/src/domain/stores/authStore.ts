import { create } from 'zustand';
import { removeFlag } from '../../data/storage/appStorage';
import { User } from '../entities/User';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  needsGuidance: boolean;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  needsGuidance: false,
  setUser: (user) => set({ user, isAuthenticated: true }),
  setToken: (token) => set({ token }),
  logout: () => {
    void removeFlag('auth.token');
    set({ user: null, token: null, isAuthenticated: false, needsGuidance: false });
  },
}));
