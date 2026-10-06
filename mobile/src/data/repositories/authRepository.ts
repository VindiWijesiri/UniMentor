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
  role: 'student' | 'mentor' | 'admin' | 'lic';
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
  async forgotPassword(email: string): Promise<{ message: string; code?: string }> {
    const response = await apiClient.post<{ message: string; code?: string }>('/auth/forgot-password', { email });
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
  async sendVerificationOtp(email: string): Promise<{ message: string; code?: string; emailSent?: boolean }> {
    const response = await apiClient.post<{ message: string; code?: string; emailSent?: boolean }>('/auth/send-verification-otp', { email });
    return response.data;
  },
  async verifyEmailOtp(email: string, code: string): Promise<{ message: string; verified?: boolean }> {
    const response = await apiClient.post<{ message: string; verified?: boolean }>('/auth/verify-email-otp', { email, code });
    return response.data;
  },
};
