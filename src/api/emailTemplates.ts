import { api } from './client';
import type { EmailTemplate, CreateTemplateData, UpdateTemplateData } from '../types/emailTemplate';

export const emailTemplatesApi = {
  getTemplates: () => 
    api.get<{ data: { data: EmailTemplate[] } }>('/email-templates'),

  getTemplateById: (id: number) => 
    api.get<{ data: { template: EmailTemplate } }>(`/email-templates/${id}`),

  createTemplate: (data: CreateTemplateData) => 
    api.post<{ data: { data: EmailTemplate } }>('/email-templates', data),

  updateTemplate: (id: number, data: UpdateTemplateData) => 
    api.put<{ data: { data: EmailTemplate } }>(`/email-templates/${id}`, data),

  deleteTemplate: (id: number) => 
    api.delete(`/email-templates/${id}`),

  previewTemplate: (id: number, testData: Record<string, any>) => 
    api.post(`/email-templates/${id}/preview`, { test_data: testData }),

  duplicateTemplate: (id: number) => 
    api.post<{ data: { data: EmailTemplate } }>(`/email-templates/${id}/duplicate`, {}, {
      headers: {
        'Content-Type': 'application/json'
      }
    }),
};