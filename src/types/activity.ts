import type { PaginatedResponse } from './api';

export type ActivityType = 'call' | 'email' | 'meeting' | 'task' | 'note' | 'follow-up';
export type ActivityStatus = 'scheduled' | 'completed' | 'cancelled' | 'overdue';

export interface Activity {
  id: number;
  type: ActivityType;
  subject: string;
  description: string | null;
  contact_id: number | null;
  deal_id: number | null;
  user_id: number;
  scheduled_date: string;
  completed_date: string | null;
  duration: number | null;
  outcome: string | null;
  status: ActivityStatus;
  created_at: string;
  updated_at: string;
  is_overdue?: boolean;
  contact?: {
    id: number;
    first_name: string;
    last_name: string;
    company: string | null;
  };
  deal?: {
    id: number;
    name: string;
    amount: number;
  };
  user?: {
    id: number;
    first_name: string;
    last_name: string;
  };
}

export interface ActivityFilters {
  page?: number;
  limit?: number;
  type?: ActivityType;
  contact_id?: number;
  deal_id?: number;
  user_id?: number;
  status?: ActivityStatus;
  date_from?: string;
  date_to?: string;
}

export interface CreateActivityData {
  type: ActivityType;
  subject: string;
  description?: string;
  contact_id?: number;
  deal_id?: number;
  scheduled_date: string;
  duration?: number;
  user_id?: number;
}

export interface UpdateActivityData {
  subject?: string;
  description?: string;
  scheduled_date?: string;
  duration?: number;
}

export interface CompleteActivityData {
  outcome: string;
  duration?: number;
}

export interface ActivityDetailResponse {
  success: boolean;
  data: {
    activity: Activity & {
      contact?: NonNullable<Activity['contact']>;
      deal?: NonNullable<Activity['deal']>;
      user: NonNullable<Activity['user']>;
    };
  };
}

export interface TodayActivities {
  date: string;
  activities: Array<{
    id: number;
    type: ActivityType;
    subject: string;
    scheduled_date: string;
    status: ActivityStatus;
    contact: {
      name: string;
      company: string | null;
    };
  }>;
  summary: {
    total: number;
    completed: number;
    scheduled: number;
    overdue: number;
  };
}

export interface UpcomingActivities {
  range: {
    start: string;
    end: string;
  };
  activities: Array<{
    id: number;
    type: ActivityType;
    subject: string;
    scheduled_date: string;
    status: ActivityStatus;
    contact: {
      name: string;
      company: string | null;
    };
  }>;
  grouped_by_date: Record<string, number[]>;
}

export interface TodayActivitiesResponse {
  success: boolean;
  data: TodayActivities;
}

export interface UpcomingActivitiesResponse {
  success: boolean;
  data: UpcomingActivities;
}

export type ActivitiesResponse = PaginatedResponse<Activity>;