import { api } from './client';
import type { Deal, DealFilters, CreateDealData, UpdateDealData, PipelineSummary, KanbanBoard, DealsResponse } from '../types/deal';

export const dealsApi = {
  getDeals: (filters?: DealFilters) => 
    api.get<DealsResponse>('/deals', { params: filters }),

  getDealById: (id: number) => 
    api.get<{ data: Deal }>(`/deals/${id}`),

  createDeal: (data: CreateDealData) => 
    api.post<{ data: { deal: Deal } }>('/deals', data),

  updateDeal: (id: number, data: UpdateDealData) => 
    api.put<{ data: { deal: Deal } }>(`/deals/${id}`, data),

  updateDealStage: (id: number, stage: string, actualCloseDate?: string) => 
    api.patch(`/deals/${id}/stage`, { stage, actual_close_date: actualCloseDate }),

  markAsWon: (id: number, data: { actual_close_date: string; notes?: string }) => 
    api.post(`/deals/${id}/win`, data),

  markAsLost: (id: number, data: { actual_close_date: string; notes?: string; loss_reason?: string }) => 
    api.post(`/deals/${id}/lost`, data),

  deleteDeal: (id: number) => 
    api.delete(`/deals/${id}`),

  getPipelineSummary: (userId?: number) => 
    api.get<{ data: PipelineSummary }>('/deals/pipeline/summary', { params: { user_id: userId } }),

  getKanbanBoard: (userId?: number) => 
    api.get<{ data: KanbanBoard }>('/deals/kanban', { params: { user_id: userId } }),
};