import apiClient from '../api/apiClient';
import { User } from '../../domain/entities/User';

export type NotificationPrefs = {
  sessionReminders: boolean;
  chatMessages: boolean;
  bookingUpdates: boolean;
  verificationAlerts: boolean;
  semesterRenewals: boolean;
  facultyNews: boolean;
};

export const userRepository = {
  async getProfile(): Promise<User> {
    const response = await apiClient.get<User>('/users/profile');
    return response.data;
  },

  async updateProfile(payload: Partial<User>): Promise<User> {
    const response = await apiClient.put<User>('/users/profile', payload);
    return response.data;
  },
  async getSecurity(): Promise<{ twoFactorEnabled: boolean; biometricEnabled: boolean }> {
    const response = await apiClient.get<{ twoFactorEnabled: boolean; biometricEnabled: boolean }>('/users/security');
    return response.data;
  },
  async updateSecurity(payload: { twoFactorEnabled?: boolean; biometricEnabled?: boolean }) {
    const response = await apiClient.put<{ twoFactorEnabled: boolean; biometricEnabled: boolean }>('/users/security', payload);
    return response.data;
  },
  async getNotificationSettings(): Promise<NotificationPrefs> {
    const response = await apiClient.get<NotificationPrefs>('/users/notification-settings');
    return response.data;
  },
  async updateNotificationSettings(payload: NotificationPrefs): Promise<NotificationPrefs> {
    const response = await apiClient.put<NotificationPrefs>('/users/notification-settings', payload);
    return response.data;
  },

  async removeSubject(subject: string): Promise<string[]> {
    const response = await apiClient.delete<{ subjects: string[] }>(
      `/users/profile/subjects/${encodeURIComponent(subject)}`
    );
    return response.data.subjects;
  },
};
