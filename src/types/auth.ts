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
}

export interface Organization {
  id: number;
  name: string;
  logo: string | null;
  timezone: string;
  currency: string;
}

export interface UserSettings {
  notifications: boolean;
  theme: 'light' | 'dark';
  language: string;
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