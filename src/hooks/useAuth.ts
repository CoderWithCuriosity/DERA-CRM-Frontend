// store/useAuth.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../api/auth';
import type { User, LoginCredentials, RegisterData } from '../types/auth';
import toast from 'react-hot-toast';

// Extend User type to include impersonation metadata
interface ImpersonatedBy {
  id: number;
  name: string;
  email: string;
}

interface ExtendedUser extends User {
  isImpersonating?: boolean;
  impersonatedBy?: ImpersonatedBy;
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
  startImpersonating: (user: ExtendedUser, token: string, impersonatedBy: ImpersonatedBy) => void;
  stopImpersonating: () => Promise<void>; // Keep as Promise<void>
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

      // New method to start impersonation
      startImpersonating: (user, token, impersonatedBy) => {
        // Update avatar URL if needed
        if (user.avatar) {
          user.avatar = import.meta.env.VITE_API_URL.replace(/\/api$/, '') + user.avatar;
        }
        
        // Add impersonation metadata to user
        const userWithImpersonation = {
          ...user,
          isImpersonating: true,
          impersonatedBy
        };
        
        // Store the new token
        localStorage.setItem('accessToken', token);
        
        // Update state
        set({
          user: userWithImpersonation,
          isAuthenticated: true,
          isImpersonating: true,
          impersonatedBy
        });
        
        toast.success(`Now impersonating ${user.first_name} ${user.last_name}`);
      },

      // Fixed: stopImpersonating now returns Promise<void>
      stopImpersonating: async () => {
        const { user } = get();
        
        if (!user?.isImpersonating) {
          toast.error('Not currently impersonating');
          return;
        }

        set({ isLoading: true });
        
        try {
          // Import dynamically to avoid circular dependency
          const { usersApi } = await import('../api/users');
          const response = await usersApi.stopImpersonating();
          const { token, user: adminUser } = response.data;
          
          // Fix avatar URL
          if (adminUser.avatar) {
            adminUser.avatar = import.meta.env.VITE_API_URL.replace(/\/api$/, '') + adminUser.avatar;
          }
          
          // Update token
          localStorage.setItem('accessToken', token);
          
          // Reset state
          set({
            user: adminUser,
            isAuthenticated: true,
            isImpersonating: false,
            impersonatedBy: null
          });
          
          toast.success('Stopped impersonating. Returned to admin account.');
          
          // Don't return anything - just resolve the promise
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