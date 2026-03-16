import { api } from './client';
import type { Contact, ContactFilters, CreateContactData, UpdateContactData, ContactsResponse, ContactImportStatusResponse, ContactImportResponse, ContactExportResponse, ContactDetailResponse, TagResponse } from '../types/contact';

export const contactsApi = {
  getContacts: (filters?: ContactFilters) =>
    api.get<ContactsResponse>('/contacts', { params: filters }),

  getContactById: (id: number) =>
    api.get<ContactDetailResponse>(`/contacts/${id}`),

  createContact: (data: CreateContactData) =>
    api.post<{ data: { contact: Contact } }>('/contacts', data),

  updateContact: (id: number, data: UpdateContactData) =>
    api.put<{ data: { contact: Contact } }>(`/contacts/${id}`, data),

  deleteContact: (id: number) =>
    api.delete(`/contacts/${id}`),

  importContacts: (file: File, columnMapping?: Record<string, string>) => {
    const formData = new FormData();
    console.log("The file: ", file);
    formData.append('file', file);
    if (columnMapping) {
      formData.append('column_mapping', JSON.stringify(columnMapping));
    }
    return api.post<ContactImportResponse>('/contacts/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getImportStatus: (importId: string) =>
    api.get<{ data: ContactImportStatusResponse }>(`/contacts/import/${importId}/status`),


  addTag: (id: number, tag: string) =>
    api.post(`/contacts/${id}/tags`, { tag }),

  removeTag: (id: number, tag: string) =>
    api.delete(`/contacts/${id}/tags/${encodeURIComponent(tag)}`),

  getAllTags: () =>
    api.get<TagResponse>('/contacts/tags/all'),

  uploadAvatar: (id: number, file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post<{ success: boolean; data: { avatar: string } }>(
      `/contacts/${id}/avatar`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
  },

  deleteAvatar: (id: number) =>
    api.delete(`/contacts/${id}/avatar`),

  exportContacts: (format: 'csv' | 'excel' = 'csv', filters?: ContactFilters) => {
  const params: Record<string, any> = { format };
  
  if (filters) {
    if (filters.search?.trim()) params.search = filters.search.trim();
    if (filters.status?.trim()) params.status = filters.status.trim();
    if (filters.tag?.trim()) params.tag = filters.tag.trim();
    if (filters.sort_by) params.sort_by = filters.sort_by;
    if (filters.sort_order) params.sort_order = filters.sort_order;
  }
  
  return api.get< ContactExportResponse >('/contacts/export', { params });
},
};