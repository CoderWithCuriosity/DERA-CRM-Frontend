export interface Organization {
  id: number;
  company_name: string;
  company_logo: string | null;
  company_email: string | null;
  company_phone: string | null;
  company_address: string | null;
  website: string | null;
  timezone: string;
  date_format: string;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateOrganizationData {
  company_name?: string;
  company_email?: string;
  company_phone?: string;
  company_address?: string;
  website?: string;
  timezone?: string;
  date_format?: string;
  currency?: string;
}

export interface InviteUserData {
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'manager' | 'agent';
}

export interface OrganizationResponse {
  success: boolean;
  data: Organization;
}

export interface LogoUploadResponse {
  success: boolean;
  message: string;
  data: {
    company_logo: string;
  };
}

export interface InviteResponse {
  success: boolean;
  message: string;
}