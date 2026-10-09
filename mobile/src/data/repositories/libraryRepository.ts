import apiClient from '../api/apiClient';
import type { LibraryFeed, LibraryMaterial, QuizResult } from '../../domain/entities/Library';

export const libraryRepository = {
  list: async (params?: { kind?: string; source?: string; q?: string; conversationId?: string }) => (
    await apiClient.get<LibraryFeed>('/library', { params })
  ).data,
  get: async (id: string) => (await apiClient.get<LibraryMaterial>(`/library/${id}`)).data,
  create: async (payload: Record<string, unknown>) => (await apiClient.post<LibraryMaterial>('/library', payload)).data,
  save: async (id: string) => (await apiClient.post<LibraryMaterial>(`/library/${id}/save`)).data,
  progress: async (id: string, payload: Record<string, unknown>) => (
    await apiClient.post<LibraryMaterial>(`/library/${id}/progress`, payload)
  ).data,
  quiz: async (id: string, answers: number[]) => (await apiClient.post<QuizResult>(`/library/${id}/quiz`, { answers })).data,
  remove: async (id: string) => (await apiClient.delete<{ deleted: boolean }>(`/library/${id}`)).data,
};
