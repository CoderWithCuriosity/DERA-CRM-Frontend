import type { PaginatedResponse } from './api';

export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled';

export interface Campaign {
  id: number;
  name: string;
  template_id: number;
  user_id: number;
  status: CampaignStatus;
  target_count: number;
  sent_count: number;
  open_count: number;
  click_count: number;
  scheduled_at: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
  open_rate: number;
  click_rate: number;
  click_to_open_rate: number;
  template?: {
    id: number;
    name: string;
    subject: string;
  };
}

export interface CampaignFilters {
  page?: number;
  limit?: number;
  status?: CampaignStatus;
  search?: string;
}

export interface CreateCampaignData {
  name: string;
  template_id: number;
  target_list: {
    contact_ids?: number[];
    filters?: {
      tags?: string[];
      status?: string;
    };
  };
  scheduled_at?: string;
}

export interface UpdateCampaignData {
  name?: string;
  scheduled_at?: string;
}

export interface TestEmailData {
  test_email: string;
  test_data: Record<string, any>;
}

export interface CampaignAnalytics {
  campaign_id: number;
  name: string;
  summary: {
    sent: number;
    delivered: number;
    opens: number;
    unique_opens: number;
    clicks: number;
    unique_clicks: number;
    bounces: number;
    unsubscribes: number;
    complaints: number;
  };
  rates: {
    delivery_rate: number;
    open_rate: number;
    click_rate: number;
    click_to_open_rate: number;
    bounce_rate: number;
    unsubscribe_rate: number;
  };
  hourly_opens: Array<{
    hour: string;
    opens: number;
  }>;
  device_breakdown: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  top_links: Array<{
    url: string;
    clicks: number;
  }>;
}

export interface CampaignDetailResponse {
  success: boolean;
  data: {
    campaign: Campaign & {
      template: NonNullable<Campaign['template']>;
      analytics?: CampaignAnalytics;
      recipients?: Array<{
        contact_id: number;
        email: string;
        status: string;
        opened_at: string | null;
        clicked_at: string | null;
      }>;
    };
  };
}

export interface CampaignAnalyticsResponse {
  success: boolean;
  data: CampaignAnalytics;
}

export interface SendCampaignResponse {
  success: boolean;
  message: string;
  data: {
    campaign: {
      id: number;
      status: CampaignStatus;
      sent_count: number;
      sent_at: string;
    };
    estimated_time: string;
  };
}

export interface TestEmailResponse {
  success: boolean;
  message: string;
  data: {
    email_id: string;
    sent_to: string;
  };
}

export type CampaignsResponse = PaginatedResponse<Campaign>;