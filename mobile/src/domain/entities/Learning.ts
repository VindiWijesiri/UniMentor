import { PopulatedUser } from './Session';

export interface StudyGroup {
  _id: string;
  name: string;
  description?: string;
  subject: string;
  ownerId: PopulatedUser | string;
  memberIds: PopulatedUser[] | string[];
  mentorIds: PopulatedUser[] | string[];
  materialIds?: { _id: string; title: string; subject: string }[] | string[];
  inviteCode: string;
}

export interface ChatMessage {
  _id: string;
  senderId: PopulatedUser | string;
  recipientId?: PopulatedUser | string;
  groupId?: string;
  body: string;
  createdAt: string;
}

export interface Conversation {
  participant?: PopulatedUser;
  group?: { _id: string; name: string; subject: string };
  lastMessage?: ChatMessage;
}

export interface Complaint {
  _id: string;
  reporterId: PopulatedUser | string;
  againstUserId?: PopulatedUser | string;
  category: 'tutor_conduct' | 'ghostwriting' | 'copyright' | 'assignment' | 'other';
  title: string;
  details: string;
  evidenceUrl?: string;
  status: 'open' | 'reviewing' | 'resolved' | 'dismissed';
  resolutionNote?: string;
  createdAt?: string;
}

export interface AppNotification {
  _id: string;
  title: string;
  body: string;
  type: string;
  relatedId?: string;
  read: boolean;
  createdAt: string;
}
