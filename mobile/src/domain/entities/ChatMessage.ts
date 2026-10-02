export interface ChatMessage {
  _id: string;
  conversationKey: string;
  sender: string;
  receiver: string;
  text: string;
  read: boolean;
  messageType?: 'text' | 'voice' | 'system' | 'attachment';
  voiceDuration?: number;
  voiceWaveform?: number[];
  attachmentUrl?: string;
  attachmentName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatConversation {
  participant: {
    _id: string;
    name: string;
    email: string;
    role: 'student' | 'mentor';
    subjects?: string[];
    bio?: string;
    rating?: number;
    reviewCount?: number;
    profilePicture?: string;
    degreeProgramme?: string;
    academicYear?: string;
  };
  lastMessage: ChatMessage;
  unreadCount: number;
}
