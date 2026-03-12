import type { PaginatedResponse } from './api';

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'manager' | 'agent';
  avatar: string | null;
  is_verified: boolean;
  last_login: string;
  organization?: Organization;
  settings: UserSettings;
  created_at: string;
  updated_at: string;
  stats?: {
    contacts_created: number;
    deals_owned: number;
    tickets_assigned: number;
    activities_logged: number;
  };
}

export interface Organization {
  id: number;
  name: string;
  logo: string | null;
  timezone: string;
  currency: string;
  company_name?: string;
  company_email?: string;
  company_phone?: string;
  company_address?: string;
  website?: string;
  date_format?: string;
}

export interface UserSettings {
  notifications: boolean;
  theme: 'light' | 'dark';
  language: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
}

export interface UpdateProfileData {
  first_name?: string;
  last_name?: string;
  email?: string;
}

export interface ChangePasswordData {
  current_password: string;
  new_password: string;
}

export interface UserFilters {
  page?: number;
  limit?: number;
  role?: string;
  search?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
    refreshToken: string;
  };
}

export type UsersResponse = PaginatedResponse<User>;