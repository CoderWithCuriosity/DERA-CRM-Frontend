import { api } from './client';
import type { LoginCredentials, RegisterData, AuthResponse, ResetPasswordData } from '../types/auth';

export const authApi = {
  login: (credentials: LoginCredentials) => 
    api.post<AuthResponse>('/auth/login', credentials),

  register: (data: RegisterData) => 
    api.post<AuthResponse>('/auth/register', data),

  logout: (refreshToken: string) => 
    api.post('/auth/logout', { refresh_token: refreshToken }),

  refreshToken: (refreshToken: string) => 
    api.post<{ token: string; refreshToken: string }>('/auth/refresh-token', { 
      refresh_token: refreshToken 
    }),

  verifyEmail: (token: string) => 
    api.get(`/auth/verify-email/${token}`),

  forgotPassword: (email: string) => 
    api.post('/auth/forgot-password', { email }),

  resetPassword: (data: ResetPasswordData) => 
    api.post('/auth/reset-password', data),

  resendVerification: (email: string) => 
    api.post('/auth/resend-verification', { email }),
};