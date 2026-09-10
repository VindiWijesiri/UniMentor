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
  async cancelSession(sessionId: string): Promise<void> {
    await apiClient.patch(`/sessions/${sessionId}/cancel`);
  },
};
