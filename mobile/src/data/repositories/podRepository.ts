import apiClient from '../api/apiClient';
import type { PodConversation, PodFeed, PodInboxFilter, PodMessage, PodPerson } from '../../domain/entities/Pod';

type InboxResponse = PodConversation[] | { items?: PodConversation[]; filters?: PodInboxFilter[] };

function asInbox(data: InboxResponse) {
  if (Array.isArray(data)) return { items: data, filters: [] as PodInboxFilter[] };
  return { items: data.items ?? [], filters: data.filters ?? [] };
}

export const podRepository = {
  list: async (filter = 'all') => asInbox((await apiClient.get<InboxResponse>('/pod/conversations', { params: { filter } })).data).items,
  inbox: async () => asInbox((await apiClient.get<InboxResponse>('/pod/conversations', { params: { filter: 'all' } })).data),
  feed: async () => (await apiClient.get<PodFeed>('/pod/feed')).data,
  unread: async () => (await apiClient.get<{ unread: number }>('/pod/unread')).data,
  people: async (q?: string) => (
    await apiClient.get<PodPerson[]>('/pod/people', { params: q ? { q } : undefined })
  ).data,
  get: async (id: string) => (await apiClient.get<PodConversation>(`/pod/conversations/${id}`)).data,
  messages: async (id: string, peek = false) => (
    await apiClient.get<PodMessage[]>(`/pod/conversations/${id}/messages`, { params: peek ? { peek: 1 } : undefined })
  ).data,
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
