import apiClient from '../api/apiClient';
import type {
  ChatPodMessage,
  LearningActivity,
  LearningAssessment,
  LearningDashboard,
  LearningDiscussion,
  LearningMaterial,
  LearningPlan,
  TutorLearningDashboard,
  TutorQueueStudent,
} from '../../domain/entities/Learning';
import type { Mentor } from '../../domain/entities/Mentor';
import type { Session } from '../../domain/entities/Session';

export const learningRepository = {
  getDashboard: async () => (await apiClient.get<LearningDashboard>('/learning/dashboard')).data,
  getPlans: async () => (await apiClient.get<LearningPlan[]>('/learning/plans')).data,
  getMaterials: async () => (await apiClient.get<LearningMaterial[]>('/learning/materials')).data,
  getMaterial: async (id: string) => (await apiClient.get<LearningMaterial>(`/learning/materials/${id}`)).data,
  getAssessments: async () => (await apiClient.get<LearningAssessment[]>('/learning/assessments')).data,
  getAssessment: async (id: string) => (await apiClient.get<LearningAssessment>(`/learning/assessments/${id}`)).data,
  submitAssessment: async (id: string) => (await apiClient.post<LearningAssessment>(`/learning/assessments/${id}/submit`)).data,
  getDiscussions: async () => (await apiClient.get<LearningDiscussion[]>('/learning/discussions')).data,
  joinDiscussion: async (id: string) => (await apiClient.post<LearningDiscussion>(`/learning/discussions/${id}/join`)).data,
  getChatPod: async () => (await apiClient.get<ChatPodMessage[]>('/learning/chat-pod')).data,
  sendChatPod: async (text: string) => (await apiClient.post<ChatPodMessage>('/learning/chat-pod/messages', { text })).data,
  toggleGoal: async (id: string) => apiClient.patch(`/learning/goals/${id}`),
  progressActivity: async (id: string) => (await apiClient.patch<LearningActivity>(`/learning/activities/${id}/progress`)).data,
  getSessions: async () => (await apiClient.get<Session[]>('/learning/sessions')).data,
  getTutorDashboard: async () => (await apiClient.get<TutorLearningDashboard>('/learning/tutor/dashboard')).data,
  getTutorStudent: async (id: string) => (await apiClient.get<TutorQueueStudent>(`/learning/tutor/students/${id}`)).data,
  gradeTutorStudent: async (id: string, score: number) => (
    await apiClient.post<TutorQueueStudent>(`/learning/tutor/students/${id}/grade`, { score })
  ).data,
  assignTutorPack: async (id: string, kind: 'mock' | 'study' | 'recovery') => (
    await apiClient.post<TutorQueueStudent>(`/learning/tutor/students/${id}/assign-pack`, { kind })
  ).data,
  dispatchTutorPack: async (kind: 'mock' | 'study') => (
    await apiClient.post('/learning/tutor/dispatch', { kind })
  ).data,
  getTutorChatTarget: async (id: string) => (
    await apiClient.get<Mentor>(`/learning/tutor/students/${id}/chat-target`)
  ).data,
};
