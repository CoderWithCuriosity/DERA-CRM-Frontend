import { api } from './client';
import type { Message, CreateMessageData, ReplyMessageData, MessageFilters, MessagesResponse, UnreadCountResponse } from '../types/message';

export const messagesApi = {
  getMessages: (filters?: MessageFilters) =>
    api.get<MessagesResponse>('/messages', { params: filters }),

  getMessageById: (id: number) =>
    api.get<{ success: boolean; data: { message: Message } }>(`/messages/${id}`),

  sendMessage: (data: CreateMessageData) =>
    api.post<{ success: boolean; data: { message: Message } }>('/messages', data),

  replyToMessage: (id: number, data: ReplyMessageData) =>
    api.post<{ success: boolean; data: { reply: Message } }>(`/messages/${id}/reply`, data),

  updatePrivacy: (id: number, canReceive: boolean) =>
    api.put<{ success: boolean; data: { can_receive: boolean } }>(`/messages/${id}/privacy`, { can_receive: canReceive }),

  hideMessage: (id: number) =>
    api.delete<{ success: boolean; message: string }>(`/messages/${id}`),

  getUnreadCount: () =>
    api.get<UnreadCountResponse>('/messages/unread/count'),
};