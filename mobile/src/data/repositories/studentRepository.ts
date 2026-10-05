import apiClient from '../api/apiClient';
import {
  StudentDashboardData,
  EnrolledModule,
  EnrolledMentor,
} from '../../domain/entities/StudentDashboard';

export const studentRepository = {
  async getDashboard(): Promise<StudentDashboardData> {
    const response = await apiClient.get<StudentDashboardData>('/users/dashboard');
    return {
      ...response.data,
      enrolledModules: response.data.enrolledModules ?? [],
      availableMentors: response.data.availableMentors ?? [],
      upcomingSessions: response.data.upcomingSessions ?? [],
      academicStats: response.data.academicStats ?? { goals: 0, plans: 0, dueTests: 0, done: 0 },
    };
  },

  async registerModule(data: {
    code: string;
    name: string;
    credits?: number;
    faculty?: string;
    department?: string;
    mentor?: EnrolledMentor;
  }): Promise<EnrolledModule[]> {
    try {
      const response = await apiClient.post<{ enrolledModules: EnrolledModule[] }>('/users/enrolled-modules', data);
      return response.data.enrolledModules;
    } catch (err) {
      console.warn('[studentRepository] Failed to register module on server:', err);
      throw err;
    }
  },

  async assignMentor(code: string, mentor: EnrolledMentor): Promise<EnrolledModule[]> {
    try {
      const response = await apiClient.put<{ enrolledModules: EnrolledModule[] }>(
        `/users/enrolled-modules/${code}/mentor`,
        { mentor }
      );
      return response.data.enrolledModules;
    } catch (err) {
      console.warn('[studentRepository] Failed to assign mentor on server:', err);
      throw err;
    }
  },

  async dropModule(code: string): Promise<EnrolledModule[]> {
    try {
      const response = await apiClient.delete<{ enrolledModules: EnrolledModule[] }>(
        `/users/enrolled-modules/${code}`
      );
      return response.data.enrolledModules;
    } catch (err) {
      console.warn('[studentRepository] Failed to drop module on server:', err);
      throw err;
    }
  },

  async addGoal(): Promise<{ goals: number }> {
    try {
      const response = await apiClient.post<{ academicStats: { goals: number } }>('/users/goals', {});
      return response.data.academicStats;
    } catch (err) {
      console.warn('[studentRepository] Failed to add goal on server:', err);
      throw err;
    }
  },

  async updateProgress(code: string, progress: number, nextSession?: string): Promise<EnrolledModule[]> {
    try {
      const response = await apiClient.put<{ enrolledModules: EnrolledModule[] }>(
        `/users/enrolled-modules/${code}/progress`,
        { progress, nextSession }
      );
      return response.data.enrolledModules;
    } catch (err) {
      console.warn('[studentRepository] Failed to update progress on server:', err);
      throw err;
    }
  },
};
