export type FileType = 'image' | 'video' | 'audio' | 'document' | 'other';

export interface ContactAttachment {
  id: number;
  contact_id: number;
  filename: string;
  original_name: string;
  file_path: string;
  file_size: number;
  file_size_formatted?: string;
  mime_type: string;
  file_type: FileType;
  uploaded_by: number;
  description: string | null;
  created_at: string;
  updated_at: string;
  uploader?: {
    id: number;
    first_name: string;
    last_name: string;
  };
}

export interface CreateAttachmentData {
  description?: string;
}

export interface AttachmentsResponse {
  success: boolean;
  data: {
    attachments: ContactAttachment[];
    total: number;
  };
}

export interface AttachmentUploadResponse {
  success: boolean;
  message: string;
  data: {
    attachment: ContactAttachment;
  };
}

export interface AttachmentDeleteResponse {
  success: boolean;
  message: string;
}