import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../api/auth';
import type { User, LoginCredentials, RegisterData } from '../types/auth';
import toast from 'react-hot-toast';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, _get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const response = await authApi.login(credentials);
          const { user, token, refreshToken } = response.data;
          
          localStorage.setItem('accessToken', token);
          localStorage.setItem('refreshToken', refreshToken);
          
          set({ user, isAuthenticated: true });
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
          
          localStorage.setItem('accessToken', token);
          localStorage.setItem('refreshToken', refreshToken);
          
          set({ user, isAuthenticated: true });
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
        set({ user: null, isAuthenticated: false });
        toast.success('Logged out successfully');
      },

      setUser: (user) => set({ user, isAuthenticated: !!user }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);