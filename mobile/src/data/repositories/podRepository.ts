import apiClient from '../api/apiClient';
import type { PodConversation, PodFeed, PodMessage, PodPerson } from '../../domain/entities/Pod';

export const podRepository = {
  list: async (filter = 'all') => (await apiClient.get<PodConversation[]>('/pod/conversations', { params: { filter } })).data,
  feed: async () => (await apiClient.get<PodFeed>('/pod/feed')).data,
  unread: async () => (await apiClient.get<{ unread: number }>('/pod/unread')).data,
  people: async () => (await apiClient.get<PodPerson[]>('/pod/people')).data,
  get: async (id: string) => (await apiClient.get<PodConversation>(`/pod/conversations/${id}`)).data,
  messages: async (id: string) => (await apiClient.get<PodMessage[]>(`/pod/conversations/${id}/messages`)).data,
  send: async (id: string, text: string) => (await apiClient.post<PodMessage>(`/pod/conversations/${id}/messages`, { text })).data,
  markRead: async (id: string) => (await apiClient.post<PodConversation>(`/pod/conversations/${id}/read`)).data,
  vote: async (id: string) => (await apiClient.post<PodConversation>(`/pod/conversations/${id}/vote`)).data,
  proposal: async (id: string, status: 'accepted' | 'declined') => (
    await apiClient.post<PodConversation>(`/pod/conversations/${id}/proposal`, { status })
  ).data,
  createSquad: async (payload: { title: string; moduleCode?: string; goal?: string; participantIds?: string[] }) => (
    await apiClient.post<PodConversation>('/pod/conversations', payload)
  ).data,
  startDirect: async (participantId: string) => (
    await apiClient.post<PodConversation>('/pod/conversations/direct', { participantId })
  ).data,
};
