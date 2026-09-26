import apiClient from '../api/apiClient';
import { Session } from '../../domain/entities/Session';

export const sessionRepository = {
  async getMySessions(): Promise<Session[]> {
    const response = await apiClient.get<Session[]>('/sessions/me');
    return response.data;
  },
  async getById(id: string): Promise<Session> {
    const response = await apiClient.get<Session>(`/sessions/${id}`);
    return response.data;
  },
  async bookSession(payload: {
    mentorId: string;
    subject: string;
    scheduledAt: string;
    notes?: string;
  }): Promise<Session> {
    const response = await apiClient.post<Session>('/sessions', payload);
    return response.data;
  },
  async cancelSession(sessionId: string): Promise<Session> {
    const response = await apiClient.patch<Session>(`/sessions/${sessionId}/cancel`);
    return response.data;
  },
  async updateStatus(sessionId: string, status: Session['status']): Promise<Session> {
    const response = await apiClient.patch<Session>(`/sessions/${sessionId}/status`, { status });
    return response.data;
  },
  async verify(sessionId: string, code: string): Promise<Session> {
    const response = await apiClient.post<Session>(`/sessions/${sessionId}/verify`, { code });
    return response.data;
  },
};
