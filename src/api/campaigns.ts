import { api } from './client';
import type { Campaign, CampaignFilters, CreateCampaignData, UpdateCampaignData, CampaignAnalytics, CampaignsResponse, TestEmailData, CampaignDetailResponse } from '../types/campaign';

export const campaignsApi = {
  // Campaigns
  getCampaigns: (filters?: CampaignFilters) => 
    api.get<CampaignsResponse>('/campaigns', { params: filters }),

  getCampaignById: (id: number) => 
    api.get<{ data: CampaignDetailResponse['data'] }>(`/campaigns/${id}`),

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
};