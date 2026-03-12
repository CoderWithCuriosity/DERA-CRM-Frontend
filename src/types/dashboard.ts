export interface DashboardSummary {
  total_contacts: number;
  new_contacts_today: number;
  open_deals: number;
  total_pipeline_value: number;
  weighted_pipeline_value: number;
  deals_won_this_month: number;
  deals_lost_this_month: number;
  win_rate: number;
  new_tickets: number;
  open_tickets: number;
  overdue_tickets: number;
  tickets_resolved_today: number;
}

export interface SalesChartData {
  labels: string[];
  won_deals: number[];
  lost_deals: number[];
}

export interface PipelineStageData {
  name: string;
  count: number;
  value: number;
  color: string;
}

export interface PipelineChartData {
  stages: PipelineStageData[];
  total_value: number;
  weighted_value: number;
}

export interface TicketVolumeData {
  labels: string[];
  new: number[];
  resolved: number[];
}

export interface RecentActivity {
  id: number;
  type: string;
  subject: string;
  scheduled_date: string;
  status: string;
  contact: {
    id: number;
    first_name: string;
    last_name: string;
    company: string | null;
  };
  user: {
    id: number;
    first_name: string;
    last_name: string;
  };
}

export interface TaskItem {
  id: number;
  type: string;
  description: string;
  due_date: string;
  priority: string;
  contact: string;
}

export interface TopPerformer {
  user_id: number;
  name: string;
  deals_won: number;
  deals_value: number;
  tickets_resolved: number;
}

export interface DashboardData {
  summary: DashboardSummary;
  sales_chart: SalesChartData;
  pipeline_value_chart: PipelineChartData;
  ticket_volume_chart: TicketVolumeData;
  recent_activities: RecentActivity[];
  task_list: TaskItem[];
  top_performers: TopPerformer[];
}

// Raw API response types
export interface RawSalesChartData {
  period: string;
  year: number;
  data: Array<{
    month: string;
    won: number;
    lost: number;
  }>;
  totals: {
    won: number;
    lost: number;
    net: number;
  };
}

export interface RawTicketChartData {
  days: number;
  data: Array<{
    date: string;
    new: number;
    resolved: number;
  }>;
  totals: {
    new: number;
    resolved: number;
    open: number;
  };
}

// API Response wrapper types
export interface DashboardResponse {
  success: boolean;
  data: DashboardData;
}

export interface SalesChartApiResponse {
  success: boolean;
  data: RawSalesChartData;
}

export interface PipelineChartApiResponse {
  success: boolean;
  data: PipelineChartData;
}

export interface TicketChartApiResponse {
  success: boolean;
  data: RawTicketChartData;
}