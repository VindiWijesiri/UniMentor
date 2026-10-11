import apiClient from '../api/apiClient';
import type { User } from '../../domain/entities/User';

export const adminRepository = {
  async directory(): Promise<User[]> {
    const response = await apiClient.get<{ users: User[] }>('/users/directory');
    return response.data.users ?? [];
  },
  async setAccountStatus(id: string, accountStatus: string): Promise<void> {
    await apiClient.patch(`/users/${id}/account-status`, { accountStatus });
  },
  async setVerification(id: string, verificationStatus: string): Promise<void> {
    await apiClient.patch(`/users/${id}/verification`, { verificationStatus });
  },
};
