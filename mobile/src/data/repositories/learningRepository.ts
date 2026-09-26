import apiClient from '../api/apiClient';
import { Assessment, Question, Submission } from '../../domain/entities/Assessment';
import { Complaint, Conversation, ChatMessage, AppNotification, StudyGroup } from '../../domain/entities/Learning';
import { Goal } from '../../domain/entities/Goal';
import { Material } from '../../domain/entities/Material';
import { User } from '../../domain/entities/User';
import { Session } from '../../domain/entities/Session';

export const learningRepository = {
  async dashboard() {
    const response = await apiClient.get('/learning/dashboard');
    return response.data as {
      role: string;
      unreadAlerts: number;
      weekHours?: { label: string; minutes: number }[];
      weeklyTargetHours?: number;
      goals?: Goal[];
      sessions?: Session[];
      assessments?: Assessment[];
      continueMaterial?: Material | null;
      materials?: Material[];
      submissions?: Submission[];
      pendingVerify?: Session[];
      pendingSubmissions?: Submission[];
      openComplaints?: number;
      complaints?: Complaint[];
      materialPriceCap?: number;
    };
  },
  async materials(params?: { q?: string; mine?: boolean }) {
    const response = await apiClient.get<Material[]>('/materials', { params });
    return response.data;
  },
  async getMaterial(id: string) {
    const response = await apiClient.get<Material>(`/materials/${id}`);
    return response.data;
  },
  async saveMaterial(payload: Partial<Material> & { title: string; subject: string; description: string }, id?: string) {
    const response = id
      ? await apiClient.put<Material>(`/materials/${id}`, payload)
      : await apiClient.post<Material>('/materials', payload);
    return response.data;
  },
  async deleteMaterial(id: string) {
    await apiClient.delete(`/materials/${id}`);
  },
  async getPricing() {
    const response = await apiClient.get('/materials/pricing');
    return response.data as { materialPriceCap: number; materials: Material[] };
  },
  async setPriceCap(materialPriceCap: number) {
    const response = await apiClient.put('/materials/pricing/cap', { materialPriceCap });
    return response.data;
  },
  async assessments(mine?: boolean) {
    const response = await apiClient.get<Assessment[]>('/assessments', { params: { mine } });
    return response.data;
  },
  async getAssessment(id: string) {
    const response = await apiClient.get<Assessment>(`/assessments/${id}`);
    return response.data;
  },
  async createAssessment(payload: Partial<Assessment>) {
    const response = await apiClient.post<Assessment>('/assessments', payload);
    return response.data;
  },
  async submitAssessment(id: string, answers: Record<string, unknown>[]) {
    const response = await apiClient.post<Submission>(`/assessments/${id}/submit`, { answers });
    return response.data;
  },
  async submissions(params?: { mine?: boolean; status?: string }) {
    const response = await apiClient.get<Submission[]>('/assessments/submissions/list', { params });
    return response.data;
  },
  async gradeSubmission(id: string, score: number, feedback?: string) {
    const response = await apiClient.patch<Submission>(`/assessments/submissions/${id}/grade`, { score, feedback });
    return response.data;
  },
  async getGoal(id: string) {
    const response = await apiClient.get<Goal>(`/goals/${id}`);
    return response.data;
  },
  async history() {
    const response = await apiClient.get('/learning/history');
    return response.data as { submissions: Submission[]; goals: Goal[] };
  },
  async questionLibrary() {
    const response = await apiClient.get('/assessments/library');
    return response.data as {
      assessmentId: string;
      assessmentTitle: string;
      subject: string;
      module?: string;
      index: number;
      question: Question;
    }[];
  },
  async getComplaint(id: string) {
    const response = await apiClient.get<Complaint>(`/complaints/${id}`);
    return response.data;
  },
  async goals() {
    const response = await apiClient.get<Goal[]>('/goals');
    return response.data;
  },
  async createGoal(payload: Partial<Goal>) {
    const response = await apiClient.post<Goal>('/goals', payload);
    return response.data;
  },
  async logGoal(id: string, minutes: number, note?: string) {
    const response = await apiClient.post<Goal>(`/goals/${id}/log`, { minutes, note });
    return response.data;
  },
  async groups() {
    const response = await apiClient.get<StudyGroup[]>('/groups');
    return response.data;
  },
  async getGroup(id: string) {
    const response = await apiClient.get<StudyGroup>(`/groups/${id}`);
    return response.data;
  },
  async createGroup(payload: {
    name: string;
    subject: string;
    description?: string;
    memberIds?: string[];
    mentorIds?: string[];
    materialIds?: string[];
  }) {
    const response = await apiClient.post<StudyGroup>('/groups', payload);
    return response.data;
  },
  async inviteMembers(
    id: string,
    payload: { memberIds?: string[]; mentorIds?: string[]; materialIds?: string[] }
  ) {
    const response = await apiClient.patch<StudyGroup>(`/groups/${id}/members`, payload);
    return response.data;
  },
  async joinGroup(inviteCode: string) {
    const response = await apiClient.post<StudyGroup>('/groups/join', { inviteCode });
    return response.data;
  },
  async inbox() {
    const response = await apiClient.get<Conversation[]>('/chats');
    return response.data;
  },
  async thread(participantId: string) {
    const response = await apiClient.get<ChatMessage[]>(`/chats/${participantId}`);
    return response.data;
  },
  async send(participantId: string, body: string) {
    const response = await apiClient.post<ChatMessage>(`/chats/${participantId}`, { body });
    return response.data;
  },
  async groupThread(groupId: string) {
    const response = await apiClient.get<ChatMessage[]>(`/chats/group/${groupId}`);
    return response.data;
  },
  async sendGroup(groupId: string, body: string) {
    const response = await apiClient.post<ChatMessage>(`/chats/group/${groupId}`, { body });
    return response.data;
  },
  async notifications() {
    const response = await apiClient.get<AppNotification[]>('/notifications');
    return response.data;
  },
  async markAllRead() {
    await apiClient.patch('/notifications/all/read');
  },
  async complaints() {
    const response = await apiClient.get<Complaint[]>('/complaints');
    return response.data;
  },
  async createComplaint(payload: Partial<Complaint>) {
    const response = await apiClient.post<Complaint>('/complaints', payload);
    return response.data;
  },
  async updateComplaint(id: string, payload: { status?: Complaint['status']; resolutionNote?: string }) {
    const response = await apiClient.patch<Complaint>(`/complaints/${id}`, payload);
    return response.data;
  },
  async users(role?: string, q?: string) {
    const response = await apiClient.get<User[]>('/users', { params: { role, q } });
    return response.data;
  },
};
