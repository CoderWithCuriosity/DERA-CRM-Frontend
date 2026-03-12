export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
  path?: string;
  method?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    totalItems: number;
    totalPages: number;
    currentPage: number;
    summary?: Record<string, any>;
  };
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
  timestamp: string;
  path: string;
  method: string;
}

export interface ImportResponse {
  success: boolean;
  message: string;
  data: {
    import_id: string;
    total_rows: number;
    estimated_time: string;
  };
}

export interface ExportResponse {
  download_url: string;
  expires_at: string;
}

export interface ImportStatusResponse {
  success: boolean;
  data: {
    import_id: string;
    status: 'processing' | 'completed' | 'failed';
    total: number;
    processed: number;
    successful: number;
    failed: number;
    errors?: Array<{
      row: number;
      error: string;
    }>;
    completed_at?: string;
  };
}