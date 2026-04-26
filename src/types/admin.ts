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

export interface AuditLog {
  id: number;
  user_id: number;
  user_name: string;
  action: string;
  entity_type: string;
  entity_id: number;
  details: string;
  ip_address: string;
  created_at: string;
}

export interface AuditLogFilters {
  page?: number;
  limit?: number;
  user_id?: number;
  action?: string;
  date_from?: string;
  date_to?: string;
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

export interface SystemStatsResponse {
  success: boolean;
  data: SystemStats;
}

export interface AuditLogsResponse {
  success: boolean;
  data: {
    data: AuditLog[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
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

export interface BackupStatusResponse {
  success: boolean;
  data: BackupStatus;
}

export interface SystemHealthResponse {
  success: boolean;
  data: SystemHealth;
}