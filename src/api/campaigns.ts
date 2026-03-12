import { api } from './client';
import type { Campaign, CampaignFilters, CreateCampaignData, UpdateCampaignData, CampaignAnalytics, CampaignsResponse, TestEmailData, CampaignDetailResponse } from '../types/campaign';
import type { EmailTemplate, CreateTemplateData, UpdateTemplateData } from '../types/emailTemplate';

export const campaignsApi = {
  // Campaigns
  getCampaigns: (filters?: CampaignFilters) => 
    api.get<CampaignsResponse>('/campaigns', { params: filters }),

  getCampaignById: (id: number) => 
    api.get<{ campaign: CampaignDetailResponse['data']['campaign'] }>(`/campaigns/${id}`),

  createCampaign: (data: CreateCampaignData) => 
    api.post<{ data: { campaign: Campaign } }>('/campaigns', data),

  updateCampaign: (id: number, data: UpdateCampaignData) => 
    api.put<{ data: { campaign: Campaign } }>(`/campaigns/${id}`, data),

  sendCampaign: (id: number, sendImmediately: boolean = true) => 
    api.post(`/campaigns/${id}/send`, { send_immediately: sendImmediately }),

  cancelCampaign: (id: number) => 
    api.post(`/campaigns/${id}/cancel`),

  duplicateCampaign: (id: number) => 
    api.post<{ data: { campaign: Campaign } }>(`/campaigns/${id}/duplicate`),

  sendTestEmail: (id: number, data: TestEmailData) => 
    api.post(`/campaigns/${id}/test`, data),

  getCampaignAnalytics: (id: number) => 
    api.get<{ data: CampaignAnalytics }>(`/campaigns/${id}/analytics`),

  // Email Templates
  getTemplates: () => 
    api.get<{ data: { templates: EmailTemplate[] } }>('/email-templates'),

  getTemplateById: (id: number) => 
    api.get<{ data: { template: EmailTemplate } }>(`/email-templates/${id}`),

  createTemplate: (data: CreateTemplateData) => 
    api.post<{ data: { template: EmailTemplate } }>('/email-templates', data),

  updateTemplate: (id: number, data: UpdateTemplateData) => 
    api.put<{ data: { template: EmailTemplate } }>(`/email-templates/${id}`, data),

  deleteTemplate: (id: number) => 
    api.delete(`/email-templates/${id}`),

  previewTemplate: (id: number, testData: Record<string, any>) => 
    api.post(`/email-templates/${id}/preview`, { test_data: testData }),

  duplicateTemplate: (id: number) => 
    api.post<{ data: { template: EmailTemplate } }>(`/email-templates/${id}/duplicate`),
};