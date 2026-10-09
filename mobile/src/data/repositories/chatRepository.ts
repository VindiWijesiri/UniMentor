import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
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

const STORAGE_KEY = 'unimentor_chat_messages_v3';

// Known demo accounts for instant resolution in offline & demo mode
const KNOWN_PARTICIPANTS: Record<string, ChatConversation['participant']> = {
  'student-oslo-1': {
    _id: 'student-oslo-1',
    name: 'Nethmi Silva',
    email: 'nethmi.silva@student.unimentor.lk',
    role: 'student',
    degreeProgramme: 'BSc (Hons) in Information Technology',
    academicYear: 'Year 2',
    bio: 'Second-year Computing undergrad passionate about Databases and Software Engineering.',
    profilePicture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  },
  'mentor-alex': {
    _id: 'mentor-alex',
    name: 'Alex Ferreira',
    email: 'alex.f@unimentor.lk',
    role: 'mentor',
    subjects: ['Database Management Systems', 'Data Structures & Algorithms'],
    rating: 4.9,
    reviewCount: 48,
    bio: 'Senior distinction peer tutor specializing in SQL query optimization and database design.',
    profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  },
  'demo-tutor-1': {
    _id: 'demo-tutor-1',
    name: 'Tharushi Perera',
    email: 'tharushi.p@unimentor.lk',
    role: 'mentor',
    subjects: ['Data Structures & Algorithms', 'Object Oriented Programming'],
    rating: 4.9,
    reviewCount: 38,
    bio: 'Specialist in Graph Algorithms, BFS/DFS, and Tree Traversals.',
    profilePicture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  },
  'mentor-shenal': {
    _id: 'mentor-shenal',
    name: 'Shenal Perera',
    email: 'shenal.p@unimentor.lk',
    role: 'mentor',
    subjects: ['Mobile Application Development', 'Web Development & Cloud'],
    rating: 4.9,
    reviewCount: 38,
    bio: 'Specialized in React Native, cross-platform apps, and cloud integration.',
  },
  'mentor-kaveen-2': {
    _id: 'mentor-kaveen-2',
    name: 'Kaveen De Silva',
    email: 'kaveen.d@unimentor.lk',
    role: 'mentor',
    subjects: ['Software Architecture & Design', 'Web Development & Cloud'],
    rating: 4.8,
    reviewCount: 29,
  },
  'mentor-sanduni-3': {
    _id: 'mentor-sanduni-3',
    name: 'Sanduni Fernando',
    email: 'sanduni.f@unimentor.lk',
    role: 'mentor',
    subjects: ['Database Management Systems', 'Machine Learning Systems'],
    rating: 4.95,
    reviewCount: 44,
  },
  'mentor-asanka-4': {
    _id: 'mentor-asanka-4',
    name: 'Dr. Asanka Perera',
    email: 'asanka.p@unimentor.lk',
    role: 'mentor',
    subjects: ['Probability & Statistics', 'Discrete Mathematics'],
    rating: 5.0,
    reviewCount: 52,
  },
};

// Initial realistic seed messages so conversations exist immediately for both student and tutor
const INITIAL_SEED_MESSAGES: ChatMessage[] = [
  {
    _id: 'seed-alex-inquiry-1',
    conversationKey: 'mentor-alex:student-oslo-1',
    sender: 'student-oslo-1',
    receiver: 'mentor-alex',
    text: 'Hello Alex! Are you free for a mentoring session on Database Normalization and SQL optimization before our upcoming lab test?',
    read: false,
    messageType: 'text',
    createdAt: new Date(Date.now() - 3600000 * 2.5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2.5).toISOString(),
  },
  {
    _id: 'seed-alex-inquiry-2',
    conversationKey: 'mentor-alex:student-oslo-1',
    sender: 'mentor-alex',
    receiver: 'student-oslo-1',
    text: 'Hi Nethmi! Yes, absolutely. Send over your questions or schemas and we can work through 3NF and BCNF step by step.',
    read: true,
    messageType: 'text',
    createdAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
  },
];

let memoryMessages: ChatMessage[] | null = null;

function normalizeId(id?: string): string {
  if (!id) return 'student-oslo-1';
  if (id === 'student' || id === 'local-student') return 'student-oslo-1';
  return id;
}

function getCanonicalKey(idA: string, idB: string): string {
  return [normalizeId(idA), normalizeId(idB)].sort().join(':');
}

function resolveParticipant(id: string): ChatConversation['participant'] {
  const norm = normalizeId(id);
  if (KNOWN_PARTICIPANTS[norm]) {
    return KNOWN_PARTICIPANTS[norm];
  }
  const currentUser = useAuthStore.getState().user;
  if (currentUser && normalizeId(currentUser._id) === norm) {
    return {
      _id: norm,
      name: currentUser.name,
      email: currentUser.email,
      role: (currentUser.role as any) || 'student',
      profilePicture: currentUser.profilePicture,
      degreeProgramme: currentUser.degreeProgramme,
      academicYear: currentUser.academicYear,
    };
  }
  return {
    _id: norm,
    name: norm.startsWith('student') ? 'Student Mentee' : 'Peer Mentor',
    email: `${norm}@unimentor.lk`,
    role: norm.startsWith('student') ? 'student' : 'mentor',
  };
}

async function loadPersistedMessages(): Promise<ChatMessage[]> {
  if (memoryMessages !== null) {
    return memoryMessages;
  }
  try {
    let raw: string | null = null;
    if (Platform.OS === 'web') {
      raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    } else {
      raw = await SecureStore.getItemAsync(STORAGE_KEY);
    }
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryMessages = parsed;
        return memoryMessages;
      }
    }
  } catch (e) {
    console.warn('[chatRepository] Error loading persisted messages:', e);
  }
  memoryMessages = [...INITIAL_SEED_MESSAGES];
  return memoryMessages;
}

async function persistMessages(msgs: ChatMessage[]): Promise<void> {
  memoryMessages = msgs;
  try {
    const json = JSON.stringify(msgs);
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, json);
    } else {
      await SecureStore.setItemAsync(STORAGE_KEY, json);
    }
  } catch (e) {
    console.warn('[chatRepository] Error saving persisted messages:', e);
  }
}

export const chatRepository = {
  /**
   * Returns inbox conversations for current user (student or tutor)
   */
  async getInbox(): Promise<ChatConversation[]> {
    const currentUserId = normalizeId(useAuthStore.getState().user?._id);

    // 1. Try server inbox first
    try {
      const response = await apiClient.get<ChatConversation[]>('/chats');
      if (Array.isArray(response.data) && response.data.length > 0) {
        return response.data;
      }
    } catch {
      // Continue to local synthesized inbox
    }

    // 2. Synthesize inbox from persistent local store
    const allMessages = await loadPersistedMessages();
    const myMessages = allMessages.filter(
      (m) => normalizeId(m.sender) === currentUserId || normalizeId(m.receiver) === currentUserId
    );

    // Group by partner ID
    const convMap = new Map<string, ChatMessage[]>();
    myMessages.forEach((msg) => {
      const partnerId =
        normalizeId(msg.sender) === currentUserId
          ? normalizeId(msg.receiver)
          : normalizeId(msg.sender);
      const list = convMap.get(partnerId) || [];
      list.push(msg);
      convMap.set(partnerId, list);
    });

    const conversations: ChatConversation[] = [];
    for (const [partnerId, msgs] of convMap.entries()) {
      if (msgs.length === 0) continue;
      // Sort messages chronologically
      msgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      const lastMessage = msgs[msgs.length - 1];
      const unreadCount = msgs.filter(
        (m) => normalizeId(m.receiver) === currentUserId && !m.read
      ).length;

      conversations.push({
        participant: resolveParticipant(partnerId),
        lastMessage,
        unreadCount,
      });
    }

    // If tutor is logged in and conversations is empty, ensure student inquiry is visible
    if (conversations.length === 0) {
      const isMentor = useAuthStore.getState().user?.role === 'mentor';
      if (isMentor) {
        const studentPartner = resolveParticipant('student-oslo-1');
        const relevantSeed = INITIAL_SEED_MESSAGES.filter(
          (m) => m.conversationKey.includes('mentor-alex') || m.conversationKey.includes(currentUserId)
        );
        const lastMsg = relevantSeed[relevantSeed.length - 1] || INITIAL_SEED_MESSAGES[0];
        conversations.push({
          participant: studentPartner,
          lastMessage: lastMsg,
          unreadCount: 1,
        });
      }
    }

    // Sort conversations with newest last message first
    conversations.sort(
      (a, b) =>
        new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
    );

    return conversations;
  },

  /**
   * Returns conversation messages between current user and participant
   */
  async getConversation(participantId: string): Promise<ChatMessage[]> {
    const currentUserId = normalizeId(useAuthStore.getState().user?._id);
    const targetId = normalizeId(participantId);
    const canonicalKey = getCanonicalKey(currentUserId, targetId);

    // 1. Try server conversation first
    try {
      const response = await apiClient.get<ChatMessage[]>(`/chats/${participantId}`);
      if (Array.isArray(response.data) && response.data.length > 0) {
        // Merge into persistent store
        const allMsgs = await loadPersistedMessages();
        const serverIds = new Set(response.data.map((m) => m._id));
        const filtered = allMsgs.filter((m) => !serverIds.has(m._id));
        await persistMessages([...filtered, ...response.data]);
        return response.data;
      }
    } catch {
      // Continue to local store
    }

    // 2. Fetch from local store
    const allMsgs = await loadPersistedMessages();
    const matched = allMsgs.filter((m) => {
      const s = normalizeId(m.sender);
      const r = normalizeId(m.receiver);
      return (
        m.conversationKey === canonicalKey ||
        (s === currentUserId && r === targetId) ||
        (s === targetId && r === currentUserId)
      );
    });

    if (matched.length > 0) {
      // Mark messages received by current user as read
      let updated = false;
      matched.forEach((m) => {
        if (normalizeId(m.receiver) === currentUserId && !m.read) {
          m.read = true;
          updated = true;
        }
      });
      if (updated) {
        void persistMessages([...allMsgs]);
      }
      return matched.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    }

    // Return empty list if none
    return [];
  },

  /**
   * Send a message to participant
   */
  async send(participantId: string, payload: string | SendMessagePayload): Promise<ChatMessage> {
    const currentUserId = normalizeId(useAuthStore.getState().user?._id);
    const targetId = normalizeId(participantId);
    const canonicalKey = getCanonicalKey(currentUserId, targetId);
    const body = typeof payload === 'string' ? { text: payload } : payload;

    // 1. Try sending to server
    try {
      const response = await apiClient.post<ChatMessage>(`/chats/${participantId}`, body);
      if (response.data && response.data._id) {
        const allMsgs = await loadPersistedMessages();
        if (!allMsgs.some((m) => m._id === response.data._id)) {
          await persistMessages([...allMsgs, response.data]);
        }
        return response.data;
      }
    } catch {
      // Continue to local save
    }

    // 2. Save locally
    const text =
      typeof payload === 'string'
        ? payload
        : payload.text || (payload.messageType === 'voice' ? '🎤 Voice message' : '');
    const now = new Date().toISOString();

    const localMsg: ChatMessage = {
      _id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      conversationKey: canonicalKey,
      sender: currentUserId,
      receiver: targetId,
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

    const allMsgs = await loadPersistedMessages();
    await persistMessages([...allMsgs, localMsg]);

    return localMsg;
  },

  /**
   * Update message text
   */
  async update(messageId: string, text: string): Promise<ChatMessage> {
    try {
      const response = await apiClient.put<ChatMessage>(`/chats/messages/${messageId}`, { text });
      return response.data;
    } catch {
      const allMsgs = await loadPersistedMessages();
      const idx = allMsgs.findIndex((m) => m._id === messageId);
      if (idx !== -1) {
        const updated = { ...allMsgs[idx], text, updatedAt: new Date().toISOString() };
        allMsgs[idx] = updated;
        await persistMessages([...allMsgs]);
        return updated;
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

  /**
   * Delete message
   */
  async delete(messageId: string): Promise<void> {
    try {
      await apiClient.delete(`/chats/messages/${messageId}`);
    } catch {
      // ignore
    }
    const allMsgs = await loadPersistedMessages();
    await persistMessages(allMsgs.filter((m) => m._id !== messageId));
  },

  /**
   * Delete entire conversation
   */
  async deleteConversation(participantId: string): Promise<void> {
    try {
      await apiClient.delete(`/chats/${participantId}`);
    } catch {
      // ignore
    }
    const currentUserId = normalizeId(useAuthStore.getState().user?._id);
    const targetId = normalizeId(participantId);
    const canonicalKey = getCanonicalKey(currentUserId, targetId);

    const allMsgs = await loadPersistedMessages();
    const filtered = allMsgs.filter(
      (m) =>
        m.conversationKey !== canonicalKey &&
        !(normalizeId(m.sender) === currentUserId && normalizeId(m.receiver) === targetId) &&
        !(normalizeId(m.sender) === targetId && normalizeId(m.receiver) === currentUserId)
    );
    await persistMessages(filtered);
  },
};
