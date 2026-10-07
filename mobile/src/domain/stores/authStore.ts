import { Alert } from 'react-native';
import { create } from 'zustand';
import { removeFlag } from '../../data/storage/appStorage';
import { User, VerificationStatus } from '../entities/User';

const DEMO_ACCOUNTS = {
  student: { email: 'student@unimentor.dev', password: 'password123' },
  mentor: { email: 'tharushi.perera@unimentor.test', password: 'Password123' },
  admin: { email: 'admin@unimentor.dev', password: 'password123' },
} as const;

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  needsGuidance: boolean;
  showPostLoginOnboarding: boolean;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  logout: () => void;
  switchDemoRole: (role: 'student' | 'mentor' | 'admin') => Promise<void>;
  updateUserProfile: (partial: Partial<User>) => void;
  updateVerificationStatus: (status: VerificationStatus, reason?: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  needsGuidance: false,
  showPostLoginOnboarding: false,
  setUser: (user) => set({ user, isAuthenticated: true }),
  setToken: (token) => set({ token }),
  logout: () => {
    void removeFlag('auth.token');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      needsGuidance: false,
      showPostLoginOnboarding: false,
    });
  },
  switchDemoRole: async (role) => {
    try {
      const { loginUseCase } = await import('../usecases/auth/loginUseCase');
      const { beginSession } = await import('./sessionGate');
      const result = await loginUseCase(DEMO_ACCOUNTS[role]);
      await beginSession(result.user, result.token);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'The demo account could not be reached. Check that the API is running.';
      Alert.alert('Could not switch role', message);
    }
  },
  updateUserProfile: (partial) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...partial } : null,
    })),
  updateVerificationStatus: (status, reason) =>
    set((state) => ({
      user: state.user
        ? {
            ...state.user,
            verificationStatus: status,
            rejectionReason: reason || state.user.rejectionReason,
          }
        : null,
    })),
}));
