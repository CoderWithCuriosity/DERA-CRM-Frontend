import { api } from './client';
import type { AttachmentsResponse, AttachmentUploadResponse, AttachmentDeleteResponse } from '../types/attachment';

export const attachmentsApi = {
  uploadAttachment: (contactId: number, file: File, description?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (description) {
      formData.append('description', description);
    }
    return api.post<AttachmentUploadResponse>(
      `/contacts/${contactId}/attachments`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
  },

  getAttachments: (contactId: number) =>
    api.get<AttachmentsResponse>(`/contacts/${contactId}/attachments`),

  deleteAttachment: (contactId: number, attachmentId: number) =>
    api.delete<AttachmentDeleteResponse>(`/contacts/${contactId}/attachments/${attachmentId}`),
};