import apiClient from '../api/apiClient';
import type { Campus, RegisterCampusInput } from '../../domain/entities/Campus';
import type { User } from '../../domain/entities/User';

type RegisterCampusResponse = {
  campus: Campus;
  user: User;
  token: string;
};

export const campusRepository = {
  list: async () => (await apiClient.get<Campus[]>('/campuses')).data,
  register: async (input: RegisterCampusInput) => {
    try {
      return (await apiClient.post<RegisterCampusResponse>('/campuses', input)).data;
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } }; message?: string })
        ?.response?.data?.message
        ?? (error instanceof Error ? error.message : 'Could not register this campus.');
      throw new Error(message);
    }
  },
  get: async (id: string) => (await apiClient.get<Campus>(`/campuses/${id}`)).data,
  mine: async () => (await apiClient.get<Campus>('/campuses/mine')).data,
};
