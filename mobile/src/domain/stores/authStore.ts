import { create } from 'zustand';
import { User } from '../entities/User';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: {
    id: 'demo-tutor-1',
    name: 'Tharushi Perera',
    email: 'tharushi.p@unimentor.sliit.lk',
    role: 'mentor',
    faculty: 'Faculty of Computing',
    department: 'Software Engineering',
  },
  token: 'demo-mentor-token-xyz',
  isAuthenticated: true,
  setUser: (user) => set({ user, isAuthenticated: true }),
  setToken: (token) => set({ token }),
  logout: () => set({ user: null, token: null, isAuthenticated: false }),
}));

