import apiClient from '../api/apiClient';
import type { ChatConversation, ChatMessage } from '../../domain/entities/ChatMessage';

export const chatRepository = {
  async getInbox(): Promise<ChatConversation[]> {
    const response = await apiClient.get<ChatConversation[]>('/chats');
    return response.data;
  },
  async getConversation(participantId: string): Promise<ChatMessage[]> {
    const response = await apiClient.get<ChatMessage[]>(`/chats/${participantId}`);
    return response.data;
  },

  async send(participantId: string, text: string): Promise<ChatMessage> {
    const response = await apiClient.post<ChatMessage>(`/chats/${participantId}`, { text });
    return response.data;
  },
};
