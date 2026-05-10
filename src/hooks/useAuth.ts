// src/hooks/useAuth.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../api/auth';
import { usersApi } from '../api/users';
import type { User, LoginCredentials, RegisterData } from '../types/auth';
import toast from 'react-hot-toast';

// Extend User type to include impersonation metadata
interface ImpersonatedBy {
  id: number;
  name: string;
  email: string;
}

// Fix: Use undefined instead of null to match the type
interface ExtendedUser extends User {
  isImpersonating?: boolean;
  impersonatedBy?: ImpersonatedBy; // Changed from ImpersonatedBy | null to optional
}

interface AuthState {
  user: ExtendedUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isImpersonating: boolean;
  impersonatedBy: ImpersonatedBy | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: ExtendedUser | null) => void;
  refreshUser: () => Promise<void>;
  startImpersonating: (user: ExtendedUser, token: string, impersonatedBy: ImpersonatedBy) => void;
  stopImpersonating: () => Promise<void>;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isImpersonating: false,
      impersonatedBy: null,

      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const response = await authApi.login(credentials);
          const { user, token, refreshToken } = response.data;

          user.avatar = import.meta.env.VITE_API_URL.replace(/\/api$/, '') + user.avatar;
          
          localStorage.setItem('accessToken', token);
          localStorage.setItem('refreshToken', refreshToken);
          
          set({ 
            user, 
            isAuthenticated: true,
            isImpersonating: false,
            impersonatedBy: null
          });
          toast.success('Login successful');
        } catch (error) {
          toast.error('Login failed');
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const response = await authApi.register(data);
          const { user, token, refreshToken } = response.data;

          user.avatar = import.meta.env.VITE_API_URL.replace(/\/api$/, '') + user.avatar;
        
          localStorage.setItem('accessToken', token);
          localStorage.setItem('refreshToken', refreshToken);
          
          set({ 
            user, 
            isAuthenticated: true,
            isImpersonating: false,
            impersonatedBy: null
          });
          toast.success('Registration successful');
        } catch (error) {
          toast.error('Registration failed');
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          try {
            await authApi.logout(refreshToken);
          } catch (error) {
            console.error('Logout error:', error);
          }
        }
        
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({ 
          user: null, 
          isAuthenticated: false,
          isImpersonating: false,
          impersonatedBy: null
        });
        toast.success('Logged out successfully');
      },

      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user,
        isImpersonating: user?.isImpersonating || false,
        impersonatedBy: user?.impersonatedBy || null
      }),

      // Fixed refreshUser method - properly handles undefined vs null
      refreshUser: async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          console.warn('No token found, cannot refresh user');
          return;
        }

        try {
          const response = await usersApi.getProfile();
          if (response?.data) {
            const refreshedUser = response.data;
            // Fix avatar URL if needed
            if (refreshedUser.avatar) {
              refreshedUser.avatar = import.meta.env.VITE_API_URL.replace(/\/api$/, '') + refreshedUser.avatar;
            }
            
            // Preserve impersonation flags if they exist
            const currentUser = get().user;
            
            // Create updated user with proper typing
            const updatedUser: ExtendedUser = {
              ...refreshedUser,
              // Convert undefined to optional property by conditionally adding
              ...(currentUser?.isImpersonating && { isImpersonating: currentUser.isImpersonating }),
              ...(currentUser?.impersonatedBy && { impersonatedBy: currentUser.impersonatedBy })
            };
            
            set({ 
              user: updatedUser, 
              isAuthenticated: true 
            });
            
            console.log('User data refreshed successfully');
          }
        } catch (error) {
          console.error('Failed to refresh user data:', error);
          // If refresh fails with 401, token might be invalid
          if (error instanceof Error && (error as any).response?.status === 401) {
            console.warn('Auth token may be expired');
          }
        }
      },

      startImpersonating: (user, token, impersonatedBy) => {
        if (user.avatar) {
          user.avatar = import.meta.env.VITE_API_URL.replace(/\/api$/, '') + user.avatar;
        }
        
        const userWithImpersonation: ExtendedUser = {
          ...user,
          isImpersonating: true,
          impersonatedBy
        };
        
        localStorage.setItem('accessToken', token);
        
        set({
          user: userWithImpersonation,
          isAuthenticated: true,
          isImpersonating: true,
          impersonatedBy
        });
        
        toast.success(`Now impersonating ${user.first_name} ${user.last_name}`);
      },

      stopImpersonating: async () => {
        const { user } = get();
        
        if (!user?.isImpersonating) {
          toast.error('Not currently impersonating');
          return;
        }

        set({ isLoading: true });
        
        try {
          const { usersApi } = await import('../api/users');
          const response = await usersApi.stopImpersonating();
          const { token, user: adminUser } = response.data;
          
          if (adminUser.avatar) {
            adminUser.avatar = import.meta.env.VITE_API_URL.replace(/\/api$/, '') + adminUser.avatar;
          }
          
          localStorage.setItem('accessToken', token);
          
          set({
            user: adminUser,
            isAuthenticated: true,
            isImpersonating: false,
            impersonatedBy: null
          });
          
          toast.success('Stopped impersonating. Returned to admin account.');
          return;
        } catch (error: any) {
          console.error('Failed to stop impersonating:', error);
          toast.error(error.response?.data?.message || 'Failed to stop impersonating');
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated,
        isImpersonating: state.isImpersonating,
        impersonatedBy: state.impersonatedBy
      }),
    }
  )
);