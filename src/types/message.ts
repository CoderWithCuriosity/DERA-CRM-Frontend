export interface MessageParticipant {
  user_id: number;
  can_receive: boolean;
  status: 'active' | 'left' | 'hidden';
  read_at: string | null;
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    avatar: string | null;
  };
}

export interface Message {
  id: number;
  subject: string | null;
  body: string;
  parent_id: number | null;
  sent_by: number;
  is_private: boolean;
  created_at: string;
  updated_at: string;
  sender?: {
    id: number;
    first_name: string;
    last_name: string;
    avatar: string | null;
    email: string;
  };
  participants?: MessageParticipant[];
  replies?: Message[];
  read_at?: string | null;
  is_read?: boolean;
  participant_count?: number;
}

export interface CreateMessageData {
  subject?: string;
  body: string;
  recipient_ids: number[];
  parent_id?: number;
  is_private?: boolean;
}

export interface ReplyMessageData {
  body: string;
  is_private?: boolean;
}

export interface MessageFilters {
  page?: number;
  limit?: number;
  folder?: 'inbox' | 'sent' | 'all' | 'trash';
}

export interface MessagesResponse {
  success: boolean;
  data: {
    data: Message[];
    totalItems: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
    unread_count: number;
  };
}

export interface UnreadCountResponse {
  success: boolean;
  data: {
    unread_count: number;
  };
}