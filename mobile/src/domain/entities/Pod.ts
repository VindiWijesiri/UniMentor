export type PodCategory = 'squad' | 'tutor' | 'mentor' | 'kuppiya' | 'circle';
export type PodInboxFilterKey = 'all' | 'groups' | 'tutors' | 'peers';

export type PodInboxFilter = {
  key: PodInboxFilterKey;
  label: string;
  icon: PodInboxFilterKey;
  count: number;
  dot?: boolean;
};
export type PodMessageKind = 'text' | 'voice' | 'file' | 'proposal' | 'assessment';

export type PodConversation = {
  _id: string;
  type: 'direct' | 'group';
  category: PodCategory;
  title: string;
  lastMessageText: string;
  lastSenderName: string;
  lastMessageAt: string;
  timeLabel: string;
  unreadCount: number;
  participantCount: number;
  meta: {
    leadName?: string;
    leadInitials?: string;
    memberCount?: number;
    subtitle?: string;
    actionLabel?: string;
    price?: string;
    scheduleLabel?: string;
    assessmentTitle?: string;
    assessmentProgress?: string;
    assessmentHint?: string;
    voicePreview?: string;
    pollVotes?: number;
    isNew?: boolean;
    moduleCode?: string;
    proposalStatus?: 'pending' | 'accepted' | 'declined';
    flashLabel?: string;
  };
  participants?: { _id: string; name: string; email: string; role: 'student' | 'mentor'; initials: string }[];
};

export type PodMessage = {
  _id: string;
  conversation: string;
  sender: string;
  senderName: string;
  senderInitials: string;
  text: string;
  kind: PodMessageKind;
  readBy: string[];
  meta?: Record<string, string | number | boolean>;
  createdAt: string;
};

export type PodFeed = {
  total: number;
  unread: number;
  items: PodConversation[];
};

export type PodPerson = {
  _id: string;
  name: string;
  email: string;
  userCode?: string;
  role: 'student' | 'mentor';
  initials: string;
  rating: number;
};
