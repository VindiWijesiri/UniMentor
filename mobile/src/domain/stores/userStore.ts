import { create } from 'zustand';
import { User } from '../entities/User';
import { userRepository } from '../../data/repositories/userRepository';
import { useAuthStore } from './authStore';

interface UserState {
  profile: User | null;
  loading: boolean;
  error: string | null;
  fetchProfile: () => Promise<void>;
  updateProfile: (payload: Partial<User>) => Promise<void>;
  addSubject: (subject: string) => Promise<void>;
  removeSubject: (subject: string) => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  profile: null,
  loading: false,
  error: null,

  fetchProfile: async () => {
    set({ loading: true, error: null });
    try {
      const user = await userRepository.getProfile();
      set({ profile: user, loading: false });
      useAuthStore.getState().setUser(user);
    } catch (err: any) {
      // Fallback to authStore user if available
      const local = useAuthStore.getState().user;
      set({ profile: local, loading: false });
    }
  },

  updateProfile: async (payload: Partial<User>) => {
    set({ loading: true, error: null });
    try {
      const updated = await userRepository.updateProfile(payload);
      set({ profile: updated, loading: false });
      useAuthStore.getState().setUser(updated);
    } catch (err: any) {
      // Optimistic local update
      const current = get().profile;
      if (current) {
        const merged: User = { ...current, ...payload };
        set({ profile: merged, loading: false });
        useAuthStore.getState().setUser(merged);
      } else {
        set({ error: err.message || 'Failed to update profile', loading: false });
      }
    }
  },

  addSubject: async (subject: string) => {
    const current = get().profile;
    if (!current) return;
    const trimmed = subject.trim();
    if (!trimmed) return;
    const existing = current.subjects || [];
    if (existing.includes(trimmed)) return;

    const nextSubjects = [...existing, trimmed];
    await get().updateProfile({ subjects: nextSubjects });
  },

  removeSubject: async (subject: string) => {
    const current = get().profile;
    if (!current) return;
    const nextSubjects = (current.subjects || []).filter((s) => s !== subject);
    try {
      await userRepository.removeSubject(subject);
    } catch {
      // Ignore if offline
    }
    await get().updateProfile({ subjects: nextSubjects });
  },
}));
