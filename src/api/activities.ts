import { api } from './client';
import type { Activity, ActivityFilters, CreateActivityData, UpdateActivityData, ActivitiesResponse, TodayActivities, UpcomingActivities } from '../types/activity';

export const activitiesApi = {
  getActivities: (filters?: ActivityFilters) => 
    api.get<ActivitiesResponse>('/activities', { params: filters }),

  getActivityById: (id: number) => 
    api.get<{ success: Boolean, data: {activity: Activity} }>(`/activities/${id}`),

  createActivity: (data: CreateActivityData) => 
    api.post<{ data: { activity: Activity } }>('/activities', data),

  updateActivity: (id: number, data: UpdateActivityData) => 
    api.put<{ data: { activity: Activity } }>(`/activities/${id}`, data),

  completeActivity: (id: number, outcome: string, duration?: number) => 
    api.post(`/activities/${id}/complete`, { outcome, duration }),

  deleteActivity: (id: number) => 
    api.delete(`/activities/${id}`),

  getTodayActivities: (userId?: number) => 
    api.get<{ data: TodayActivities }>('/activities/today', { params: { user_id: userId } }),

  getUpcomingActivities: (days: number = 7, userId?: number) => 
    api.get<{ data: UpcomingActivities }>('/activities/upcoming', {
      params: { days, user_id: userId },
    }),
};