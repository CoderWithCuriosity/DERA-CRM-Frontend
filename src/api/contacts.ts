import { api } from './client';
import type { Contact, ContactFilters, CreateContactData, UpdateContactData, ContactsResponse, ContactImportResponse, ContactExportResponse, ContactDetailResponse } from '../types/contact.ts';

export const contactsApi = {
  getContacts: (filters?: ContactFilters) => 
    api.get<ContactsResponse>('/contacts', { params: filters }),

  getContactById: (id: number) => 
    api.get<{ data: ContactDetailResponse }>(`/contacts/${id}`),

  createContact: (data: CreateContactData) => 
    api.post<{ data: { contact: Contact } }>('/contacts', data),

  updateContact: (id: number, data: UpdateContactData) => 
    api.put<{ data: { contact: Contact } }>(`/contacts/${id}`, data),

  deleteContact: (id: number) => 
    api.delete(`/contacts/${id}`),

  importContacts: (file: File, columnMapping: Record<string, string>) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('column_mapping', JSON.stringify(columnMapping));
    return api.post<ContactImportResponse>('/contacts/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getImportStatus: (importId: string) => 
    api.get(`/contacts/import/${importId}/status`),

  exportContacts: (format: 'csv' | 'excel' = 'csv', filters?: ContactFilters) => 
    api.get<{ data: ContactExportResponse }>('/contacts/export', { 
      params: { format, ...filters } 
    }),

  addTag: (id: number, tag: string) => 
    api.post(`/contacts/${id}/tags`, { tag }),

  removeTag: (id: number, tag: string) => 
    api.delete(`/contacts/${id}/tags/${tag}`),

  getAllTags: () => 
    api.get<{ data: { tags: Array<{ name: string; count: number }> } }>('/contacts/tags/all'),
};