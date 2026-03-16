
export type DealStage = 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
export type DealStatus = 'open' | 'won' | 'lost';

export interface Deal {
  id: number;
  name: string;
  contact_id: number;
  user_id: number;
  stage: DealStage;
  amount: number;
  probability: number;
  expected_close_date: string | null;
  actual_close_date: string | null;
  status: DealStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  is_overdue?: boolean;
  contact?: {
    id: number;
    first_name: string;
    last_name: string;
    company: string | null;
    email?: string;
    phone?: string;
  };
  owner?: {
    id: number;
    first_name: string;
    last_name: string;
    email?: string;
  };
  activities_count?: number;
}

export interface DealFilters {
  page?: number;
  limit?: number;
  stage?: DealStage;
  status?: DealStatus;
  user_id?: number;
  contact_id?: number;
  search?: string;
  date_from?: string;
  date_to?: string;
  min_amount?: number;
  max_amount?: number;
}

export interface CreateDealData {
  name: string;
  contact_id: number;
  stage: DealStage;
  amount: number;
  probability: number;
  expected_close_date?: string;
  notes?: string;
  user_id?: number;
}

export interface UpdateDealData {
  name?: string;
  stage?: DealStage;
  amount?: number;
  probability?: number;
  expected_close_date?: string;
  notes?: string;
}

export interface WinDealData {
  actual_close_date: string;
  notes?: string;
}

export interface LostDealData {
  actual_close_date: string;
  notes?: string;
  loss_reason?: string;
}

export interface DealStageUpdate {
  stage: DealStage;
  actual_close_date?: string;
}

export interface DealDetailResponse {
  success: boolean;
  data: {
    deal: Deal & {
      contact: NonNullable<Deal['contact']>;
      owner: NonNullable<Deal['owner']>;
      activities?: Array<{
        id: number;
        type: string;
        subject: string;
        scheduled_date: string;
        status: string;
      }>;
    };
  };
}

export interface PipelineSummary {
  stages: Array<{
    name: string;
    display_name: string;
    count: number;
    value: number;
    weighted_value: number;
    color: string;
  }>;
  totals: {
    total_value: number;
    weighted_value: number;
    open_deals: number;
    won_deals: number;
    lost_deals: number;
    win_rate: number;
  };
  forecast: {
    this_month: number;
    next_month: number;
    quarter: number;
  };
}

export interface KanbanBoard {
  columns: Array<{
    id: string;
    title: string;
    color: string;
    limit: number;
    deals: Array<{
      id: number;
      name: string;
      amount: number;
      probability: number;
      expected_close_date: string | null;
      contact_name: string;
      contact_company: string | null;
      avatar: string | null;
      has_activity_today: boolean;
    }>;
  }>;
}

export interface PipelineSummaryResponse {
  success: boolean;
  data: PipelineSummary;
}

export interface KanbanBoardResponse {
  success: boolean;
  data: KanbanBoard;
}


export interface DealsResponse {
  success: boolean;
  data: {
    data: Deal[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    summary: PipelineSummary;
  };
}