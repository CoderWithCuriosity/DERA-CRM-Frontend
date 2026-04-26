import { api } from './client';
import type { User, UpdateProfileData, ChangePasswordData, UserFilters, UsersResponse, ImpersonationResponse, StopImpersonationResponse } from '../types/user';

export const usersApi = {
  getProfile: () => 
    api.get<{ data: User }>('/users/profile'),

  updateProfile: (data: UpdateProfileData) => 
    api.put<{ data: User }>('/users/profile', data),

  changePassword: (data: ChangePasswordData) => 
    api.put('/users/change-password', data),

  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post<{ data: { avatar: string } }>('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  removeAvatar: () => 
    api.delete('/users/avatar'),

  getUsers: (filters?: UserFilters) => 
    api.get<UsersResponse>('/users', { params: filters }),

  getUserById: (id: number) => 
    api.get<{ data: User }>(`/users/${id}`),

  updateUserRole: (id: number, role: string) => 
    api.put(`/users/${id}/role`, { role }),

  deleteUser: (id: number) => 
    api.delete(`/users/${id}`),


  impersonateUser: (id: number) => 
    api.post<ImpersonationResponse>(`/users/${id}/impersonate`, {}, {
      headers: {
        'Content-Type': 'application/json'
      }
    }),

  stopImpersonating: () => 
    api.post<StopImpersonationResponse>('/users/stop-impersonating', {}, {
      headers: {
        'Content-Type': 'application/json'
      }
    }),
};