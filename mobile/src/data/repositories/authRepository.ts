import apiClient from '../api/apiClient';
import { User } from '../../domain/entities/User';

interface AuthResponse {
  user: User;
  token: string;
}

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role: 'student' | 'mentor';
  bio?: string;
  subjects?: string[];
  degreeProgramme?: string;
  hourlyRate?: number;
  university?: string;
  faculty?: string;
  department?: string;
  studentId?: string;
  phone?: string;
}

export const authRepository = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', { email, password });
    return response.data;
  },
  async register(input: RegisterInput): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', input);
    return response.data;
  },
  async forgotPassword(email: string): Promise<{ message: string; emailSent?: boolean; devCode?: string }> {
    const response = await apiClient.post<{ message: string; emailSent?: boolean; devCode?: string }>('/auth/forgot-password', { email });
    return response.data;
  },
  async verifyResetCode(email: string, code: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/auth/verify-reset-code', { email, code });
    return response.data;
  },
  async resetPassword(email: string, password: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/auth/reset-password', { email, password });
    return response.data;
  },
  async sendVerificationOtp(email: string): Promise<{ message: string; emailSent?: boolean; devCode?: string }> {
    const response = await apiClient.post<{ message: string; emailSent?: boolean; devCode?: string }>('/auth/send-verification-otp', { email });
    return response.data;
  },
  async verifyEmailOtp(email: string, code: string): Promise<{ message: string; verified?: boolean; user?: User }> {
    const response = await apiClient.post<{ message: string; verified?: boolean; user?: User }>('/auth/verify-email-otp', { email, code });
    return response.data;
  },
  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/auth/change-password', { currentPassword, newPassword });
    return response.data;
  },
  async me(): Promise<{ user: User }> {
    const response = await apiClient.get<{ user: User }>('/auth/me');
    return response.data;
  },
};
