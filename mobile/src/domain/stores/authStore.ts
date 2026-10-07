import { create } from 'zustand';
import { User, VerificationStatus } from '../entities/User';

export const mockStudentUser: User = {
  _id: 'user_student_01',
  name: 'Kavindu Perera',
  email: 'kavindu.p@campus.ac.lk',
  role: 'student',
  university: 'University of Colombo',
  faculty: 'Computing',
  department: 'Computer Science',
  degree: 'BSc (Hons) in Computer Science',
  degreeProgramme: 'BSc (Hons) in Computer Science',
  academicYear: 'Year 2',
  semester: 'Sem 1',
  studentId: 'CS/2022/089',
  phone: '+94 77 123 4567',
  accountStatus: 'active',
  verificationStatus: 'approved',
  createdAt: '2023-01-15T09:00:00Z',
  bio: 'Second-year CS undergrad interested in Machine Learning and Algorithms.',
};

export const mockTutorUser: User = {
  _id: 'user_tutor_01',
  name: 'Dr. Sarah De Silva',
  email: 'sarah.desilva@campus.ac.lk',
  role: 'mentor',
  university: 'University of Moratuwa',
  faculty: 'Computing',
  department: 'Software Engineering',
  degree: 'MSc in Software Engineering & AI',
  degreeProgramme: 'MSc in Software Engineering & AI',
  studentId: 'TUT/2021/042',
  phone: '+94 71 987 6543',
  accountStatus: 'active',
  verificationStatus: 'approved',
  hourlyRate: 2500,
  approvedModules: ['Data Structures', 'OOP', 'Software Architecture'],
  pendingModules: ['DevOps'],
  rating: 4.9,
  totalReviews: 38,
  reviewCount: 38,
  completedSessions: 74,
  availability: 'Mon - Thu: 5:00 PM - 9:00 PM',
  createdAt: '2022-08-10T10:30:00Z',
  bio: 'Experienced university mentor passionate about clean code, architecture, and helping students excel in technical modules.',
};

export const mockAdminUser: User = {
  _id: 'user_admin_01',
  name: 'Admin Kasun Jayawardena',
  email: 'admin.kasun@unimentor.lk',
  role: 'admin',
  university: 'UniMentor Platform Operations',
  faculty: 'Academic Administration',
  department: 'Quality & Verification Board',
  accountStatus: 'active',
  verificationStatus: 'approved',
  createdAt: '2021-05-01T08:00:00Z',
  bio: 'System Administrator and Lead Verification Officer for UniMentor.',
};

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  logout: () => void;
  switchDemoRole: (role: 'student' | 'mentor' | 'admin') => void;
  updateUserProfile: (partial: Partial<User>) => void;
  updateVerificationStatus: (status: VerificationStatus, reason?: string) => void;
  pendingRoute: string | null;
  setPendingRoute: (route: string | null) => void;
  rememberToken: (token: string) => Promise<void>;
  restoreSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: true }),
  setToken: (token) => set({ token }),
  logout: () => {
    set({ user: null, token: null, isAuthenticated: false, pendingRoute: null });
    import('expo-secure-store').then((store) => store.deleteItemAsync('auth.token')).catch(() => undefined);
  },
  switchDemoRole: (role) => {
    let selectedUser: User = mockStudentUser;
    if (role === 'mentor') selectedUser = mockTutorUser;
    if (role === 'admin') selectedUser = mockAdminUser;
    set({ user: selectedUser, token: `demo_${role}_token`, isAuthenticated: true });
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
  pendingRoute: null,
  setPendingRoute: (route) => set({ pendingRoute: route }),
  rememberToken: async (token) => {
    const store = await import('expo-secure-store');
    await store.setItemAsync('auth.token', token);
  },
  restoreSession: async () => {
    try {
      const store = await import('expo-secure-store');
      const token = await store.getItemAsync('auth.token');
      if (!token || token.startsWith('demo_') || token.startsWith('mock_')) return;
      set({ token });
      const { authRepository } = await import('../../data/repositories/authRepository');
      const me = await authRepository.me();
      set({ user: me.user, token, isAuthenticated: true });
    } catch {
      set({ user: null, token: null, isAuthenticated: false });
      import('expo-secure-store').then((store) => store.deleteItemAsync('auth.token')).catch(() => undefined);
    }
  },
}));
