import apiClient from '../api/apiClient';
import type {
  AdminPortal,
  AssessmentCenter,
  AssessmentResult,
  CreatePaperInput,
  ImprovementHistory,
  TakePayload,
  TutorAssessmentHub,
} from '../../domain/entities/AssessmentWork';

export const assessmentRepository = {
  center: async () => (await apiClient.get<AssessmentCenter>('/learning/assessment-center')).data,
  history: async () => (await apiClient.get<ImprovementHistory>('/learning/assessment-history')).data,
  take: async (paperId: string) => (await apiClient.get<TakePayload>(`/learning/papers/${paperId}`)).data,
  save: async (paperId: string, body: { answers: TakePayload['attempt']['answers']; flagged: string[]; questionIndex: number }) => (
    await apiClient.put(`/learning/papers/${paperId}/progress`, body)
  ).data,
  submit: async (paperId: string, answers: TakePayload['attempt']['answers']) => (
    await apiClient.post<AssessmentResult>(`/learning/papers/${paperId}/submit`, { answers })
  ).data,
  result: async (paperId: string) => (await apiClient.get<AssessmentResult>(`/learning/papers/${paperId}/result`)).data,
  tutorHub: async () => (await apiClient.get<TutorAssessmentHub>('/learning/tutor/assessment-hub')).data,
  createPaper: async (input: CreatePaperInput) => (await apiClient.post<{ paperId: string; status: string }>('/learning/tutor/papers', input)).data,
  submissions: async (paperId: string) => (await apiClient.get(`/learning/tutor/papers/${paperId}/submissions`)).data as Promise<{
    paper: { _id: string; title: string; moduleCode: string; status: string; gradesReleased: boolean };
    submissions: { attemptId: string; student: { name?: string; email?: string }; status: string; score: number | null; maxScore: number; feedback?: string }[];
  }>,
  grade: async (attemptId: string, score: number, feedback: string) => (
    await apiClient.post(`/learning/tutor/attempts/${attemptId}/grade`, { score, feedback })
  ).data,
  release: async (paperId: string) => (await apiClient.post(`/learning/tutor/papers/${paperId}/release`)).data,
  assign: async (paperId: string, studentIds: string[]) => (
    await apiClient.post(`/learning/tutor/papers/${paperId}/assign`, { studentIds })
  ).data as { paperId: string; assigned: number; status: string },
  adminPortal: async () => (await apiClient.get<AdminPortal>('/learning/admin/portal')).data,
  review: async (paperId: string, decision: 'approve' | 'changes', note: string) => (
    await apiClient.post(`/learning/admin/papers/${paperId}/review`, { decision, note })
  ).data,
  addCatalog: async (body: { title: string; moduleCode: string; priceLabel: string; tier: string }) => (
    await apiClient.post('/learning/admin/catalog', body)
  ).data,
};
