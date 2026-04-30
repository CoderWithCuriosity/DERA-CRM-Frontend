import { api } from './client';
import type { NotificationFilters, NotificationsResponse, NotificationPreference, UpdatePreferencesData } from '../types/notification';

export const notificationsApi = {
  getNotifications: (filters?: NotificationFilters) =>
    api.get<NotificationsResponse>('/notifications', { params: filters }),

  markAsRead: (id: number) =>
    api.put<{ success: boolean; message: string }>(`/notifications/${id}/read`),

  markAllAsRead: () =>
    api.put<{ success: boolean; message: string }>('/notifications/read-all'),

  deleteNotification: (id: number) =>
    api.delete<{ success: boolean; message: string }>(`/notifications/${id}`),

  getPreferences: () =>
    api.get<{ success: boolean; data: { preferences: NotificationPreference[] } }>('/notifications/preferences'),

  updatePreferences: (data: UpdatePreferencesData) =>
    api.put<{ success: boolean; message: string }>('/notifications/preferences', data),
};