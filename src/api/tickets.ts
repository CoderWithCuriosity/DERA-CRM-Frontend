import { api } from './client';
import type { Ticket, TicketFilters, CreateTicketData, UpdateTicketData, TicketComment, CreateCommentData, TicketsResponse, SLAResponse } from '../types/ticket';

export const ticketsApi = {
  getTickets: (filters?: TicketFilters) => 
    api.get<TicketsResponse>('/tickets', { params: filters }),

  getTicketById: (id: number) => 
    api.get<{ data: Ticket }>(`/tickets/${id}`),

  createTicket: (data: CreateTicketData) => 
    api.post<{ data: { ticket: Ticket } }>('/tickets', data),

  updateTicket: (id: number, data: UpdateTicketData) => 
    api.put<{ data: { ticket: Ticket } }>(`/tickets/${id}`, data),

  updateTicketStatus: (id: number, status: string, resolutionNotes?: string) => 
    api.patch(`/tickets/${id}/status`, { status, resolution_notes: resolutionNotes }),

  assignTicket: (id: number, assignedTo: number | null) => 
    api.post(`/tickets/${id}/assign`, { assigned_to: assignedTo }),

  addComment: (id: number, data: CreateCommentData) => 
    api.post<{ data: { comment: TicketComment } }>(`/tickets/${id}/comments`, data),

  getComments: (id: number, includeInternal?: boolean) => 
    api.get<{ data: { comments: TicketComment[] } }>(`/tickets/${id}/comments`, {
      params: { include_internal: includeInternal },
    }),

  deleteTicket: (id: number) => 
    api.delete(`/tickets/${id}`),

  getSLAReport: (startDate?: string, endDate?: string) => 
    api.get<{ data: SLAResponse }>('/tickets/sla/report', {
      params: { start_date: startDate, end_date: endDate },
    }),
};