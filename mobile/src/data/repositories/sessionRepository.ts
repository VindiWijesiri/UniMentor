import apiClient from '../api/apiClient';
import { Session } from '../../domain/entities/Session';

export const sessionRepository = {
  async getMySessions(): Promise<Session[]> {
    const response = await apiClient.get<Session[]>('/sessions/me');
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
  async updateSession(
    sessionId: string,
    payload: {
      subject?: string;
      scheduledAt?: string;
      notes?: string;
      status?: string;
      mentorId?: string;
    }
  ): Promise<Session> {
    const response = await apiClient.put<Session>(`/sessions/${sessionId}`, payload);
    return response.data;
  },
  async cancelSession(sessionId: string): Promise<Session> {
    const response = await apiClient.patch<Session>(`/sessions/${sessionId}/cancel`);
    return response.data;
  },
  async deleteSession(sessionId: string): Promise<void> {
    await apiClient.delete(`/sessions/${sessionId}`);
  },
  async updateStatus(sessionId: string, status: Session['status'], scheduledAt?: string): Promise<Session> {
    const response = await apiClient.patch<Session>(`/sessions/${sessionId}/status`, { status, scheduledAt });
    return response.data;
  },
  async setLive(sessionId: string, open: boolean): Promise<Session> {
    const response = await apiClient.patch<Session>(`/sessions/${sessionId}/live`, { open });
    return response.data;
  },
};
