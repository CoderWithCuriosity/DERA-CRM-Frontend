export type NotificationType = 
  | 'ticket_assigned'
  | 'ticket_comment'
  | 'ticket_resolved'
  | 'ticket_sla_warning'
  | 'ticket_sla_breach'
  | 'deal_assigned'
  | 'deal_won'
  | 'activity_reminder'
  | 'message_received'
  | 'campaign_completed'
  | 'backup_completed'
  | 'backup_failed'
  | 'import_completed'
  | 'import_failed';

export interface Notification {
  id: number;
  user_id: number;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, any>;
  read_at: string | null;
  created_at: string;
  updated_at: string;
  is_read: boolean;
}

export interface NotificationFilters {
  page?: number;
  limit?: number;
  unread_only?: boolean;
}

export interface NotificationsResponse {
  success: boolean;
  data: {
    data: Notification[];
    totalItems: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
    unread_count: number;
  };
}

export interface NotificationPreference {
  id: number;
  user_id: number;
  type: NotificationType;
  email_enabled: boolean;
  in_app_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpdatePreferencesData {
  preferences: Array<{
    type: NotificationType;
    email_enabled: boolean;
    in_app_enabled: boolean;
  }>;
}