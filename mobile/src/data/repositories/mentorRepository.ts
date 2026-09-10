import apiClient from '../api/apiClient';
import { Mentor } from '../../domain/entities/Mentor';

export const mentorRepository = {
  async search(query: string): Promise<Mentor[]> {
    const response = await apiClient.get<Mentor[]>('/mentors/search', { params: { q: query } });
    return response.data;
  },
  async getById(id: string): Promise<Mentor> {
    const response = await apiClient.get<Mentor>(`/mentors/${id}`);
    return response.data;
  },
};
