import apiClient from '../api/apiClient';
import { User } from '../../domain/entities/User';

export const userRepository = {
  async getProfile(): Promise<User> {
    const response = await apiClient.get<User>('/users/profile');
    return response.data;
  },

  async updateProfile(payload: Partial<User>): Promise<User> {
    const response = await apiClient.put<User>('/users/profile', payload);
    return response.data;
  },

  async removeSubject(subject: string): Promise<string[]> {
    const response = await apiClient.delete<{ subjects: string[] }>(
      `/users/profile/subjects/${encodeURIComponent(subject)}`
    );
    return response.data.subjects;
  },
};
