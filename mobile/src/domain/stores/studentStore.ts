import { create } from 'zustand';
import {
  StudentDashboardData,
  EnrolledModule,
  EnrolledMentor,
} from '../entities/StudentDashboard';
import { studentRepository } from '../../data/repositories/studentRepository';

interface StudentState {
  dashboard: StudentDashboardData | null;
  loading: boolean;
  error: string | null;
  fetchDashboard: () => Promise<void>;
  registerModule: (module: {
    code: string;
    name: string;
    credits?: number;
    faculty?: string;
    department?: string;
    mentor?: EnrolledMentor;
  }) => Promise<void>;
  assignMentor: (code: string, mentor: EnrolledMentor) => Promise<void>;
  dropModule: (code: string) => Promise<void>;
  incrementGoal: () => Promise<void>;
  updateModuleProgress: (code: string, progress: number, nextSession?: string) => Promise<void>;
}

export const useStudentStore = create<StudentState>((set, get) => ({
  dashboard: null,
  loading: false,
  error: null,

  fetchDashboard: async () => {
    set({ loading: true, error: null });
    try {
      const data = await studentRepository.getDashboard();
      set({ dashboard: data, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to load dashboard', loading: false });
    }
  },

  registerModule: async (moduleData) => {
    const current = get().dashboard;
    if (!current) return;

    const exists = current.enrolledModules.some(
      (m) => m.code.toUpperCase() === moduleData.code.toUpperCase()
    );
    if (exists) {
      throw new Error(`Module ${moduleData.code} is already registered.`);
    }

    const optimisticModule: EnrolledModule = {
      code: moduleData.code.toUpperCase(),
      name: moduleData.name,
      credits: moduleData.credits || 3,
      faculty: moduleData.faculty,
      department: moduleData.department,
      progress: 0,
      status: 'active',
      nextSession: 'Upcoming • Schedule available soon',
      mentor: moduleData.mentor || current.availableMentors[0] || {
        name: 'Assigned Peer Mentor',
        roleTitle: 'Senior Peer Mentor',
        batch: "Batch '24",
        rating: 4.9,
        isVerified: true,
      },
    };

    const updatedModules = [optimisticModule, ...current.enrolledModules];
    set({
      dashboard: {
        ...current,
        enrolledModules: updatedModules,
      },
    });

    try {
      const serverModules = await studentRepository.registerModule(moduleData);
      if (serverModules && serverModules.length > 0) {
        set({
          dashboard: {
            ...get().dashboard!,
            enrolledModules: serverModules,
          },
        });
      }
    } catch {
      // Keep optimistic update since local fallback is also functional
    }
  },

  assignMentor: async (code: string, mentor: EnrolledMentor) => {
    const current = get().dashboard;
    if (!current) return;

    const updatedModules = current.enrolledModules.map((m) =>
      m.code.toUpperCase() === code.toUpperCase()
        ? { ...m, mentor }
        : m
    );

    set({
      dashboard: {
        ...current,
        enrolledModules: updatedModules,
      },
    });

    try {
      const serverModules = await studentRepository.assignMentor(code, mentor);
      if (serverModules && serverModules.length > 0) {
        set({
          dashboard: {
            ...get().dashboard!,
            enrolledModules: serverModules,
          },
        });
      }
    } catch {
      // Keep local update
    }
  },

  dropModule: async (code: string) => {
    const current = get().dashboard;
    if (!current) return;

    const updatedModules = current.enrolledModules.filter(
      (m) => m.code.toUpperCase() !== code.toUpperCase()
    );

    set({
      dashboard: {
        ...current,
        enrolledModules: updatedModules,
      },
    });

    try {
      await studentRepository.dropModule(code);
    } catch {
      // Keep local update
    }
  },

  incrementGoal: async () => {
    const current = get().dashboard;
    if (!current) return;

    const currentStats = current.academicStats || { goals: 4, plans: 3, dueTests: 2, done: 18 };
    set({
      dashboard: {
        ...current,
        academicStats: {
          ...currentStats,
          goals: currentStats.goals + 1,
        },
      },
    });

    try {
      await studentRepository.addGoal();
    } catch {
      // Local counter is updated
    }
  },

  updateModuleProgress: async (code: string, progress: number, nextSession?: string) => {
    const current = get().dashboard;
    if (!current) return;

    const updatedModules = current.enrolledModules.map((m) =>
      m.code.toUpperCase() === code.toUpperCase()
        ? {
            ...m,
            progress,
            nextSession: nextSession !== undefined ? nextSession : m.nextSession,
          }
        : m
    );

    set({
      dashboard: {
        ...current,
        enrolledModules: updatedModules,
      },
    });

    try {
      await studentRepository.updateProgress(code, progress, nextSession);
    } catch {
      // Keep optimistic update
    }
  },
}));
