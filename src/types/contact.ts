import type { ImportResponse, ExportResponse, ImportStatusResponse } from './api';

export interface Contact {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  job_title: string | null;
  status: 'active' | 'inactive' | 'lead';
  source: string | null;
  notes: string | null;
  tags: string[];
  user_id: number;
  created_at: string;
  updated_at: string;
  deals_count?: number;
  tickets_count?: number;
  last_activity?: string;
  created_by?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  avatar?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deals?: any[];
  tickets?: any[];
  activities?: any[];
}

export interface ContactFilters {
  page?: number;
  limit?: number;
  status?: string;
  tag?: string;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface CreateContactData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company?: string;
  job_title?: string;
  status?: string;
  source?: string;
  notes?: string;
  tags?: string[];
}

export interface UpdateContactData {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  company?: string;
  job_title?: string;
  status?: string;
  source?: string;
  notes?: string;
  tags?: string[];
}

export interface ContactDetailResponse {
  success: boolean;
  data: {
    contact: Contact & {
      deals?: Array<{
        id: number;
        name: string;
        stage: string;
        amount: number;
        status: string;
      }>;
      tickets?: Array<{
        id: number;
        subject: string;
        status: string;
        priority: string;
        created_at: string;
      }>;
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

export interface TagResponse {
  success: boolean;
  data: {
    tags: Array<{
      name: string;
      count: number;
    }>;
  };
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    data: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    filters?: {
      statuses?: string[];
      tags?: string[];
    };
  };
}

export type ContactsResponse = PaginatedResponse<Contact>;
export type ContactImportResponse = ImportResponse;
export type ContactImportStatusResponse = ImportStatusResponse;
export type ContactExportResponse = ExportResponse;