import apiClient from '../api/apiClient';
import type { ChatConversation, ChatMessage } from '../../domain/entities/ChatMessage';
import { useAuthStore } from '../../domain/stores/authStore';

export interface SendMessagePayload {
  text?: string;
  messageType?: 'text' | 'voice' | 'system' | 'attachment';
  voiceDuration?: number;
  voiceWaveform?: number[];
  attachmentUrl?: string;
  attachmentName?: string;
}

// In-memory conversation cache for offline resilience and demo tutors
const localConversations = new Map<string, ChatMessage[]>();

const DEFAULT_DEMO_MESSAGES: Record<string, ChatMessage[]> = {
  'mentor-alex': [
    {
      _id: 'seed-alex-1',
      conversationKey: 'mentor-alex:student',
      sender: 'mentor-alex',
      receiver: 'student',
      text: "Hello! Great to connect with you. Let me know which database concepts or SQL query optimization questions you'd like to work through.",
      read: true,
      messageType: 'text',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
  ],
  'demo-tutor-1': [
    {
      _id: 'seed-tharushi-1',
      conversationKey: 'demo-tutor-1:student',
      sender: 'demo-tutor-1',
      receiver: 'student',
      text: 'Hi! Ready to help you with Data Structures, Graph Traversals, and Tree algorithms. What are you working on today?',
      read: true,
      messageType: 'text',
      createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    },
  ],
  'mentor-shenal': [
    {
      _id: 'seed-shenal-1',
      conversationKey: 'mentor-shenal:student',
      sender: 'mentor-shenal',
      receiver: 'student',
      text: 'Hey! Glad you reached out. Feel free to share your React Native code or questions on mobile app architecture.',
      read: true,
      messageType: 'text',
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
  ],
};

function getLocalMessages(participantId: string): ChatMessage[] {
  if (!localConversations.has(participantId)) {
    const seed = DEFAULT_DEMO_MESSAGES[participantId];
    localConversations.set(participantId, seed ? [...seed] : []);
  }
  return localConversations.get(participantId) || [];
}

export const chatRepository = {
  async getInbox(): Promise<ChatConversation[]> {
    try {
      const response = await apiClient.get<ChatConversation[]>('/chats');
      return response.data;
    } catch {
      return [];
    }
  },

  async getConversation(participantId: string): Promise<ChatMessage[]> {
    try {
      const response = await apiClient.get<ChatMessage[]>(`/chats/${participantId}`);
      if (Array.isArray(response.data) && response.data.length > 0) {
        // Cache server messages
        localConversations.set(participantId, response.data);
        return response.data;
      }
      // If server returned empty array but we have local messages, return local
      const local = getLocalMessages(participantId);
      return local.length > 0 ? local : (response.data || []);
    } catch {
      // Graceful offline / demo fallback
      return getLocalMessages(participantId);
    }
  },

  async send(participantId: string, payload: string | SendMessagePayload): Promise<ChatMessage> {
    const body = typeof payload === 'string' ? { text: payload } : payload;
    try {
      const response = await apiClient.post<ChatMessage>(`/chats/${participantId}`, body);
      // Append to local cache
      const list = getLocalMessages(participantId);
      if (!list.some((m) => m._id === response.data._id)) {
        localConversations.set(participantId, [...list, response.data]);
      }
      return response.data;
    } catch {
      // Local fallback message creation
      const text =
        typeof payload === 'string'
          ? payload
          : payload.text || (payload.messageType === 'voice' ? '🎤 Voice message' : '');
      const currentUserId = useAuthStore.getState().user?._id || 'local-student';
      const now = new Date().toISOString();

      const localMsg: ChatMessage = {
        _id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        conversationKey: [currentUserId, participantId].sort().join(':'),
        sender: currentUserId,
        receiver: participantId,
        text,
        read: true,
        messageType: typeof payload === 'object' ? payload.messageType || 'text' : 'text',
        voiceDuration: typeof payload === 'object' ? payload.voiceDuration : undefined,
        voiceWaveform: typeof payload === 'object' ? payload.voiceWaveform : undefined,
        attachmentUrl: typeof payload === 'object' ? payload.attachmentUrl : undefined,
        attachmentName: typeof payload === 'object' ? payload.attachmentName : undefined,
        createdAt: now,
        updatedAt: now,
      };

      const existing = getLocalMessages(participantId);
      localConversations.set(participantId, [...existing, localMsg]);
      return localMsg;
    }
  },

  async update(messageId: string, text: string): Promise<ChatMessage> {
    try {
      const response = await apiClient.put<ChatMessage>(`/chats/messages/${messageId}`, { text });
      return response.data;
    } catch {
      // Update in local cache
      for (const [pId, list] of localConversations.entries()) {
        const idx = list.findIndex((m) => m._id === messageId);
        if (idx !== -1) {
          const updated = { ...list[idx], text, updatedAt: new Date().toISOString() };
          list[idx] = updated;
          localConversations.set(pId, [...list]);
          return updated;
        }
      }
      return {
        _id: messageId,
        conversationKey: '',
        sender: '',
        receiver: '',
        text,
        read: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
  },

  async delete(messageId: string): Promise<void> {
    try {
      await apiClient.delete(`/chats/messages/${messageId}`);
    } catch {
      // Delete from local cache
      for (const [pId, list] of localConversations.entries()) {
        localConversations.set(pId, list.filter((m) => m._id !== messageId));
      }
    }
  },

  async deleteConversation(participantId: string): Promise<void> {
    try {
      await apiClient.delete(`/chats/${participantId}`);
    } catch {
      // Clear from local cache
    }
    localConversations.set(participantId, []);
  },
};
