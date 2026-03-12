import axios from "axios";
import type { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig, AxiosError } from "axios";
import toast from 'react-hot-toast';

interface ApiErrorResponse {
  success: boolean;
  message: string;
  errors?: Array<{ field: string; message: string }>;
  timestamp?: string;
  path?: string;
  method?: string;
}

class ApiClient {
  private client: AxiosInstance;
  private static instance: ApiClient;
  private refreshPromise: Promise<string> | null = null;

  private constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    this.setupInterceptors();
  }

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        return response;
      },
      async (error: AxiosError<ApiErrorResponse>) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newToken = await this.refreshAccessToken();
            if (newToken && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            this.handleAuthError();
          }
        }

        this.handleError(error);
        return Promise.reject(error);
      }
    );
  }

  private async refreshAccessToken(): Promise<string | null> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      this.handleAuthError();
      return null;
    }

    this.refreshPromise = this.client
      .post('/auth/refresh-token', { refresh_token: refreshToken })
      .then((response) => {
        const { token, refreshToken: newRefreshToken } = response.data.data;
        localStorage.setItem('accessToken', token);
        localStorage.setItem('refreshToken', newRefreshToken);
        return token;
      })
      .catch((error) => {
        this.handleAuthError();
        throw error;
      })
      .finally(() => {
        this.refreshPromise = null;
      });

    return this.refreshPromise;
  }

  private handleAuthError(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
    toast.error('Session expired. Please login again.');
  }

  private handleError(error: AxiosError<ApiErrorResponse>): void {
    if (error.response) {
      const { status, data } = error.response;

      if (status === 400) {
        if (data.errors && data.errors.length > 0) {
          data.errors.forEach((err) => {
            toast.error(`${err.field}: ${err.message}`);
          });
        } else {
          toast.error(data.message || 'Validation error');
        }
      } else if (status === 403) {
        toast.error('You do not have permission to perform this action');
      } else if (status === 404) {
        toast.error('Resource not found');
      } else if (status === 429) {
        toast.error('Too many requests. Please try again later.');
      } else if (status >= 500) {
        toast.error('Server error. Please try again later.');
      }
    } else if (error.request) {
      toast.error('Network error. Please check your connection.');
    } else {
      toast.error('An unexpected error occurred');
    }
  }

  public get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.client.get(url, config).then((response) => response.data);
  }

  public post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.client.post(url, data, config).then((response) => response.data);
  }

  public put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.client.put(url, data, config).then((response) => response.data);
  }

  public patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.client.patch(url, data, config).then((response) => response.data);
  }

  public delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.client.delete(url, config).then((response) => response.data);
  }
}

export const api = ApiClient.getInstance();