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

// Extend AxiosRequestConfig to include our custom flags
interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
  _isRefreshRequest?: boolean;
}

class ApiClient {
  private client: AxiosInstance;
  private static instance: ApiClient;
  private refreshPromise: Promise<string> | null = null;
  private isRefreshing: boolean = false;

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
      (response) => response,
      async (error: AxiosError<ApiErrorResponse>) => {
        const originalRequest = error.config as CustomAxiosRequestConfig;
        
        // If there's no config, reject
        if (!originalRequest) {
          return Promise.reject(error);
        }

        // CRITICAL: Don't try to refresh if this IS the refresh request
        // This prevents infinite loops when refresh token is also invalid
        if (originalRequest.url?.includes('/auth/refresh-token')) {
          // Clear everything and redirect to login
          this.clearAuthData();
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
            toast.error('Session expired. Please login again.');
          }
          return Promise.reject(error);
        }

        // Handle 401 errors (unauthorized)
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newToken = await this.refreshAccessToken();
            
            if (newToken && originalRequest.headers) {
              // Update the authorization header
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              
              // Retry the original request
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed - already handled in refreshAccessToken
            return Promise.reject(refreshError);
          }
        }

        // Handle all other errors (4xx, 5xx, network errors)
        this.handleError(error);
        return Promise.reject(error);
      }
    );
  }

  private async refreshAccessToken(): Promise<string | null> {
    // If already refreshing, wait for that promise
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    // Prevent multiple refresh attempts
    if (this.isRefreshing) {
      return null;
    }

    const refreshToken = localStorage.getItem('refreshToken');
    
    // No refresh token? Force logout
    if (!refreshToken) {
      this.handleAuthError();
      return null;
    }

    this.isRefreshing = true;

    this.refreshPromise = this.client
      .post<{ data: { token: string; refreshToken: string } }>(
        '/auth/refresh-token', 
        { refresh_token: refreshToken },
        { 
          // Mark this as a refresh request so we can detect it in the interceptor
          headers: {
            'X-Refresh-Token': 'true' // Additional way to identify refresh requests
          }
        } as AxiosRequestConfig
      )
      .then((response) => {
        const { token, refreshToken: newRefreshToken } = response.data.data;
        
        // Store new tokens
        localStorage.setItem('accessToken', token);
        localStorage.setItem('refreshToken', newRefreshToken);
        
        return token;
      })
      .catch((error) => {
        // If refresh fails (even with 401), force logout
        console.error('Token refresh failed:', error);
        this.handleAuthError();
        throw error;
      })
      .finally(() => {
        this.refreshPromise = null;
        this.isRefreshing = false;
      });

    return this.refreshPromise;
  }

  private clearAuthData(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  private handleAuthError(): void {
    this.clearAuthData();
    
    // Only redirect if not already on login page
    // Use setTimeout to prevent race conditions with multiple requests
    if (window.location.pathname !== '/login') {
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
      
      // Show toast only once
      if (!(window as any).__toastShown__) {
        (window as any).__toastShown__ = true;
        toast.error('Session expired. Please login again.');
        
        // Reset the flag after some time
        setTimeout(() => {
          (window as any).__toastShown__ = false;
        }, 5000);
      }
    }
  }

  private handleError(error: AxiosError<ApiErrorResponse>): void {
    // Skip showing errors for refresh requests to avoid console noise
    const config = error.config as CustomAxiosRequestConfig;
    if (config?.url?.includes('/auth/refresh-token')) {
      return;
    }

    if (error.response) {
      const { status, data } = error.response;

      // Handle specific status codes
      switch (status) {
        case 400:
          if (data.errors && data.errors.length > 0) {
            data.errors.forEach((err) => {
              toast.error(`${err.field}: ${err.message}`);
            });
          } else {
            toast.error(data.message || 'Validation error');
          }
          break;
          
        case 403:
          toast.error('You do not have permission to perform this action');
          break;
          
        case 404:
          toast.error('Resource not found');
          break;
          
        case 429:
          toast.error('Too many requests. Please try again later.');
          break;
          
        case 500:
        case 501:
        case 502:
        case 503:
          toast.error('Server error. Please try again later.');
          break;
          
        default:
          if (status >= 400 && status < 500) {
            toast.error(data?.message || 'Request failed');
          }
      }
    } else if (error.request) {
      // Request was made but no response received
      toast.error('Network error. Please check your connection.');
    } else {
      // Something happened in setting up the request
      toast.error('An unexpected error occurred');
    }
  }

  // Public methods for making API calls
  public async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  public async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  public async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  public async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  public async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  // Helper method to check if user is authenticated
  public isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken');
  }

  // Manual logout
  public logout(): void {
    this.clearAuthData();
    window.location.href = '/login';
    toast.success('Logged out successfully');
  }
}

// Export a singleton instance
export const api = ApiClient.getInstance();