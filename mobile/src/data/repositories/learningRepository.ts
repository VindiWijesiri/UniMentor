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
import type { GoalBoard, GoalPlanView } from '../../domain/entities/GoalPlan';
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
  logPresence: async (seconds: number, date: string) => apiClient.post('/learning/presence', { seconds, date }),
  logFocus: async (goalId: string, seconds: number, date: string, area?: string) => (
    await apiClient.post<{ minutes: number; goalTitle: string; progress: number; hoursDone: number }>(
      '/learning/focus',
      { goalId, seconds, date, area },
    )
  ).data,
  setWeeklyGoal: async (hoursGoal: number) => apiClient.patch('/learning/week', { hoursGoal }),
  goalBoard: async () => (await apiClient.get<GoalBoard>('/learning/goals/board')).data,
  goal: async (id: string) => (await apiClient.get<GoalPlanView>(`/learning/goals/${id}`)).data,
  logGoal: async (id: string, body: { hours: number; problems: number; confidence: string; notes: string }) => (
    await apiClient.post<GoalPlanView>(`/learning/goals/${id}/log`, body)
  ).data,
  addGoalAssessment: async (id: string, body: Record<string, unknown>) => (
    await apiClient.post<GoalPlanView>(`/learning/goals/${id}/assessments`, body)
  ).data,
  updateGoalAssessment: async (id: string, assessmentId: string, score: number) => (
    await apiClient.patch<GoalPlanView>(`/learning/goals/${id}/assessments/${assessmentId}`, { score })
  ).data,
  advanceMilestone: async (id: string, milestoneId: string) => (
    await apiClient.post<GoalPlanView>(`/learning/goals/${id}/milestones/${milestoneId}`)
  ).data,
  addGoalMilestone: async (id: string, title: string) => (
    await apiClient.post<GoalPlanView>(`/learning/goals/${id}/milestones`, { title })
  ).data,
  addGoalTask: async (id: string, body: { title: string; kind: string; minutes: number }) => (
    await apiClient.post<GoalPlanView>(`/learning/goals/${id}/tasks`, body)
  ).data,
  completeGoalTask: async (goalId: string, taskId: string) => (
    await apiClient.patch<GoalPlanView>(`/learning/goals/${goalId}/tasks/${taskId}`)
  ).data,
  bookGoalTutor: async (id: string, tutorKey: string) => (
    await apiClient.post<{ sessionId: string; tutorName: string; slot: string }>(`/learning/goals/${id}/book`, { tutorKey })
  ).data,
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
