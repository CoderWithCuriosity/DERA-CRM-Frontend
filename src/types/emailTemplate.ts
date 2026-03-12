export interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  user_id: number;
  created_at: string;
  updated_at: string;
  campaigns_count?: number;
}

export interface CreateTemplateData {
  name: string;
  subject: string;
  body: string;
  variables?: string[];
}

export interface UpdateTemplateData {
  name?: string;
  subject?: string;
  body?: string;
  variables?: string[];
}

export interface PreviewTemplateData {
  test_data: Record<string, any>;
}

export interface PreviewResponse {
  success: boolean;
  data: {
    subject: string;
    body: string;
    preview_html: string;
  };
}

export interface TemplatesResponse {
  success: boolean;
  data: {
    templates: EmailTemplate[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  };
}

export interface TemplateResponse {
  success: boolean;
  data: {
    template: EmailTemplate;
  };
}