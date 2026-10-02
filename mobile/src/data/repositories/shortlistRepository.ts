import apiClient from '../api/apiClient';
import type { ShortlistedMentor } from '../../domain/entities/ShortlistedMentor';

export const shortlistRepository = {
  async getShortlist(): Promise<ShortlistedMentor[]> {
    try {
      const response = await apiClient.get<ShortlistedMentor[]>('/users/shortlist');
      return response.data || [];
    } catch {
      return [];
    }
  },

  async add(payload: {
    mentorId: string;
    name: string;
    avatar?: string;
    hourlyRate?: number;
    rating?: number;
    subjects?: string[];
    priority?: 'Top Choice' | 'Considering' | 'Backup';
    notes?: string;
  }): Promise<ShortlistedMentor[]> {
    const response = await apiClient.post<{ shortlist: ShortlistedMentor[] }>('/users/shortlist', payload);
    return response.data.shortlist;
  },

  async update(
    mentorId: string,
    payload: {
      priority?: 'Top Choice' | 'Considering' | 'Backup';
      notes?: string;
    }
  ): Promise<ShortlistedMentor[]> {
    const response = await apiClient.put<{ shortlist: ShortlistedMentor[] }>(`/users/shortlist/${mentorId}`, payload);
    return response.data.shortlist;
  },

  async remove(mentorId: string): Promise<ShortlistedMentor[]> {
    const response = await apiClient.delete<{ shortlist: ShortlistedMentor[] }>(`/users/shortlist/${mentorId}`);
    return response.data.shortlist;
  },
};
