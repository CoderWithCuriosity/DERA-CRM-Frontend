import type { PaginatedResponse } from './api';

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketStatus = 'new' | 'open' | 'pending' | 'resolved' | 'closed';

export interface Ticket {
  id: number;
  ticket_number: string;
  subject: string;
  description: string;
  contact_id: number;
  user_id: number;
  assigned_to: number | null;
  priority: TicketPriority;
  status: TicketStatus;
  due_date: string | null;
  resolved_at: string | null;
  sla_warnings_sent: string[];
  sla_breach_notified: boolean;
  created_at: string;
  updated_at: string;
  responseTime?: number | null;
  resolutionTime?: number | null;
  isOverdue?: boolean;
  comment_count?: number;
  contact?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    company?: string;
  };
  createdBy?: {
    id: number;
    first_name: string;
    last_name: string;
    email?: string;
  };
  assignedTo?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface TicketFilters {
  page?: number;
  limit?: number;
  status?: TicketStatus;
  priority?: TicketPriority;
  assigned_to?: number;
  contact_id?: number;
  search?: string;
}

export interface CreateTicketData {
  subject: string;
  description: string;
  contact_id: number;
  priority?: TicketPriority;
  due_date?: string;
  assigned_to?: number;
}

export interface UpdateTicketData {
  subject?: string;
  description?: string;
  priority?: TicketPriority;
  due_date?: string;
}

export interface UpdateTicketStatusData {
  status: TicketStatus;
  resolution_notes?: string;
}

export interface AssignTicketData {
  assigned_to: number | null;
}

export interface TicketComment {
  id: number;
  ticket_id: number;
  user_id: number;
  comment: string;
  is_internal: boolean;
  created_at: string;
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    avatar: string | null;
  };
}

export interface CreateCommentData {
  comment: string;
  is_internal?: boolean;
}

export interface TicketDetailResponse {
  success: boolean;
  data: {
    ticket: Ticket & {
      contact: NonNullable<Ticket['contact']>;
      createdBy: NonNullable<Ticket['createdBy']>;
      assignedTo?: NonNullable<Ticket['assignedTo']>;
      comments?: TicketComment[];
    };
    sla: {
      response_time: number | null;
      response_due: string | null;
      response_breached: boolean;
      resolution_due: string | null;
      resolution_breached: boolean;
    };
    time_spent: {
      total: number | null;
      breached: boolean;
    };
  };
}

export interface CommentsResponse {
  success: boolean;
  data: {
    comments: TicketComment[];
    total: number;
  };
}

export interface SLAResponse {
  period: {
    start: string;
    end: string;
  };
  response_times: {
    average: number;
    median: number;
    min: number;
    max: number;
    breached: number;
    total: number;
    compliance_rate: number;
  };
  resolution_times: {
    average: number;
    median: number;
    min: number;
    max: number;
    breached: number;
    total: number;
    compliance_rate: number;
  };
  by_priority: Record<string, {
    response_compliance: number;
    resolution_compliance: number;
  }>;
  daily_breaches: Array<{
    date: string;
    response_breaches: number;
    resolution_breaches: number;
  }>;
}

export interface SLAReportResponse {
  success: boolean;
  data: SLAResponse;
}

export type TicketsResponse = PaginatedResponse<Ticket>;