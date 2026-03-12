import { api } from './client';
import type { DashboardData, PipelineChartData, RawTicketChartData, RawSalesChartData } from '../types/dashboard';

export const dashboardApi = {
  getDashboard: (userId?: number) => 
    api.get<{ data: DashboardData }>('/dashboard', { params: { user_id: userId } }),

  getSalesChart: (period: 'month' | 'quarter' | 'year' = 'month', year?: number) => 
    api.get<{ data: RawSalesChartData }>('/dashboard/sales-chart', {
      params: { period, year },
    }),

  getPipelineChart: () => 
    api.get<{ data: PipelineChartData }>('/dashboard/pipeline-chart'),

  getTicketChart: (days: number = 7) => 
    api.get<{ data: RawTicketChartData }>('/dashboard/ticket-chart', {
      params: { days },
    }),
};