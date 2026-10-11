import apiClient from '../api/apiClient';
import type { ChosenPlan, PlanCode, PlanFeed } from '../../domain/entities/StudentPlan';

export const planRepository = {
  list: async () => (await apiClient.get<PlanFeed>('/plans')).data,
  choose: async (code: PlanCode) => (await apiClient.post<ChosenPlan>('/plans', { code })).data,
  update: async (code: PlanCode) => (await apiClient.put<ChosenPlan>('/plans/mine', { code })).data,
  remove: async () => (await apiClient.delete<{ deleted: boolean }>('/plans/mine')).data,
};
