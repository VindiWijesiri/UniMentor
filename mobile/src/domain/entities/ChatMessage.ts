export interface ChatMessage {
  _id: string;
  conversationKey: string;
  sender: string;
  receiver: string;
  text: string;
  read: boolean;
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
  };
  lastMessage: ChatMessage;
  unreadCount: number;
}
