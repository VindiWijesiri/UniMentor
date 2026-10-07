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
    _id: 'student-oslo-1',
    id: 'student-oslo-1',
    name: 'Nethmi Silva',
    email: 'nethmi.silva@student.unimentor.lk',
    role: 'student',
    faculty: 'Faculty of Computing',
    department: 'Software Engineering',
  },
  token: 'demo-student-token-xyz',
  isAuthenticated: true,
  setUser: (user) => set({ user, isAuthenticated: true }),
  setToken: (token) => set({ token }),
  logout: () => set({ user: null, token: null, isAuthenticated: false }),
}));

