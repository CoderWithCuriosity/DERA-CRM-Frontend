// src/types/admin.ts

export interface SystemStats {
  users: {
    total: number;
    active_today: number;
    by_role: {
      admin: number;
      manager: number;
      agent: number;
    };
  };
  contacts: {
    total: number;
    active: number;
    inactive: number;
  };
  deals: {
    total: number;
    open: number;
    won: number;
    lost: number;
  };
  tickets: {
    total: number;
    open: number;
    resolved: number;
    closed: number;
  };
  campaigns: {
    total: number;
    sent: number;
    scheduled: number;
  };
  storage: {
    used: string;
    total: string;
    percentage: number;
  };
  api_usage: {
    today: number;
    this_week: number;
    this_month: number;
  };
}

export interface AuditChange {
  field: string;
  old_value: any;
  new_value: any;
  display_name: string;
}

export interface AuditDetails {
  action: string;
  entity_id: number;
  entity_name: string;
  summary: string;
  changes: AuditChange[];
  timestamp: string;
  user_id: number;
  user_name?: string;
  ip_address?: string;
  user_agent?: string;
  deleted_data?: Record<string, any>;
  additional_info?: Record<string, any>;
  is_legacy_format?: boolean;
}

// For LIST view - details is a JSON string
export interface AuditLogListItem {
  id: number;
  user_id: number;
  action: string;
  entity_type: string;
  entity_id: number;
  details: string;  // ← JSON string
  ip_address: string;
  user_agent?: string; 
  created_at: string;
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    avatar?: string;
  };
}

// For DETAIL view - details is a parsed object
export interface AuditLogDetail {
  id: number;
  user_id: number;
  action: string;
  entity_type: string;
  entity_id: number;
  created_at: string;
  details: AuditDetails;  // ← Parsed object
  ip_address: string;
  user_agent: string;
  is_structured: boolean;
  raw_details: string;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

// Alias for backward compatibility (optional)
export type AuditLog = AuditLogListItem;

export interface AuditLogFilters {
  page?: number;
  limit?: number;
  user_id?: number;
  action?: string;
  entity_type?: string;
  date_from?: string;
  date_to?: string;
}

export interface AuditLogsResponse {
  success: boolean;
  data: {
    data: AuditLogListItem[];  // List uses the string version
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  };
}

export interface AuditLogDetailResponse {
  success: boolean;
  data: AuditLogDetail;  // Detail uses the parsed version
}

export interface EntityChangeHistory {
  entity_type: string;
  entity_id: number;
  history: {
    items: Array<{
      id: number;
      action: string;
      created_at: string;
      user: {
        id: number;
        first_name: string;
        last_name: string;
        email?: string;
        avatar?: string;
      } | null;
      summary: string;
      changes: AuditChange[];
      ip_address: string;
    }>;
    totalItems: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
  };
}

export interface AuditLogSummary {
  period: {
    days: number;
    start_date: string;
    end_date: string;
  };
  summary: {
    total_activities: number;
    unique_users: number;
  };
  by_action: Array<{ action: string; count: number }>;
  by_entity: Array<{ entity_type: string; count: number }>;
  by_user: Array<{
    user: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
    };
    count: number;
  }>;
  daily_trend: Array<{ date: string; count: number }>;
}

export interface AuditLogSummaryResponse {
  success: boolean;
  data: AuditLogSummary;
}

export interface UserActivity {
  user_id: number;
  name: string;
  role: string;
  activities: {
    contacts_created: number;
    deals_created: number;
    tickets_created: number;
    tickets_resolved: number;
    campaigns_sent: number;
    logins: number;
    total_actions: number;
  };
}

export interface UserActivityResponse {
  success: boolean;
  data: {
    period: {
      start: string;
      end: string;
    };
    users: UserActivity[];
  };
}

export interface BackupResponse {
  success: boolean;
  message: string;
  data: {
    backup_id: string;
    estimated_time: string;
  };
}

export interface BackupStatus {
  backup_id: string;
  status: 'processing' | 'completed' | 'failed';
  size?: string;
  download_url?: string;
  expires_at?: string;
  completed_at?: string;
}

export interface BackupStatusResponse {
  success: boolean;
  data: BackupStatus;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  timestamp: string;
  services: {
    database: {
      status: 'connected' | 'disconnected';
      latency: number;
    };
    storage: {
      status: 'healthy' | 'warning' | 'critical';
      used: string;
      free: string;
      total: string;
      usage_percentage: number;
    };
  };
  system: {
    uptime: string;
    memory: {
      heap_used: string;
      heap_total: string;
    };
    active_connections: number;
  };
}

export interface SystemHealthResponse {
  success: boolean;
  data: SystemHealth;
}

export interface SystemStatsResponse {
  success: boolean;
  data: SystemStats;
}