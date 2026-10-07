import apiClient from '../api/apiClient';

export type TutorPerson = {
  _id: string;
  name: string;
  email: string;
  modules: string[];
  hoursDone: number;
  hoursGoal: number;
  goalCount: number;
  nextSession: { _id: string; subject: string; scheduledAt: string; status: string } | null;
};

export type TutorProgress = {
  student: { _id: string; name: string; email: string };
  week: { hoursDone: number; hoursGoal: number; percent: number; hoursLeft: number };
  goals: { _id: string; title: string; moduleCode: string; progress: number; targetGrade: string; dueLabel: string; completed: boolean }[];
  sessions: { _id: string; subject: string; scheduledAt: string; status: string; isLive?: boolean }[];
};

export type AppNotice = {
  _id: string;
  kind: 'booking' | 'review' | 'grade' | 'session' | 'payment';
  title: string;
  body: string;
  refId?: string;
  read: boolean;
  createdAt: string;
};

export type PaymentRow = {
  _id: string;
  amountLkr: number;
  hours: number;
  status: 'due' | 'recorded';
  subject: string;
  createdAt: string;
  studentId?: { name?: string } | string;
  mentorId?: { name?: string } | string;
};

export const tutorPortalRepository = {
  people: async () => (await apiClient.get<TutorPerson[]>('/learning/tutor/people')).data,
  progress: async (studentId: string) => (await apiClient.get<TutorProgress>(`/learning/tutor/people/${studentId}`)).data,
  notices: async () => (await apiClient.get<AppNotice[]>('/notifications')).data,
  markRead: async (id: string) => (await apiClient.patch(`/notifications/${id}/read`)).data,
  payments: async () => (await apiClient.get<{ totalLkr: number; items: PaymentRow[] }>('/payments/me')).data,
};
