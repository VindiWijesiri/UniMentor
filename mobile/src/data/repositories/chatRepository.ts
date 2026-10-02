import apiClient from '../api/apiClient';
import type { ChatConversation, ChatMessage } from '../../domain/entities/ChatMessage';

export interface SendMessagePayload {
  text?: string;
  messageType?: 'text' | 'voice' | 'system' | 'attachment';
  voiceDuration?: number;
  voiceWaveform?: number[];
  attachmentUrl?: string;
  attachmentName?: string;
}

export const chatRepository = {
  async getInbox(): Promise<ChatConversation[]> {
    const response = await apiClient.get<ChatConversation[]>('/chats');
    return response.data;
  },
  async getConversation(participantId: string): Promise<ChatMessage[]> {
    const response = await apiClient.get<ChatMessage[]>(`/chats/${participantId}`);
    return response.data;
  },

  async send(participantId: string, payload: string | SendMessagePayload): Promise<ChatMessage> {
    const body = typeof payload === 'string' ? { text: payload } : payload;
    const response = await apiClient.post<ChatMessage>(`/chats/${participantId}`, body);
    return response.data;
  },

  async update(messageId: string, text: string): Promise<ChatMessage> {
    const response = await apiClient.put<ChatMessage>(`/chats/messages/${messageId}`, { text });
    return response.data;
  },

  async delete(messageId: string): Promise<void> {
    await apiClient.delete(`/chats/messages/${messageId}`);
  },

  async deleteConversation(participantId: string): Promise<void> {
    await apiClient.delete(`/chats/${participantId}`);
  },
};
