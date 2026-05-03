// src/hooks/useTheme.ts
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { usersApi } from '../api/users';

type Theme = 'light' | 'dark' | 'system';

export function useTheme() {
  const { user, setUser } = useAuth();
  const [theme, setThemeState] = useState<Theme>('system');

  useEffect(() => {
    // Load from localStorage first for faster initial render
    const savedTheme = localStorage.getItem('crm-theme') as Theme | null;
    if (savedTheme) {
      setThemeState(savedTheme);
    } else if (user?.settings?.theme) {
      setThemeState(user.settings.theme as Theme);
    }

    // Also check if user has preference in their profile
    if (user?.settings?.theme && user.settings.theme !== savedTheme) {
      setThemeState(user.settings.theme as Theme);
    }
  }, [user?.settings?.theme]);

  useEffect(() => {
    const root = document.documentElement;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');

    const apply = (t: Theme) => {
      let isDark = false;
      if (t === 'dark') isDark = true;
      if (t === 'light') isDark = false;
      if (t === 'system') isDark = mql.matches;
      
      root.classList.toggle('dark', isDark);
    };

    apply(theme);
    localStorage.setItem('crm-theme', theme);

    // Save to backend if user is logged in and theme changed
    if (user && user.settings?.theme !== theme && theme !== 'system') {
      usersApi.updateProfile({ settings: { ...user.settings, theme } }).catch(console.error);
    }

    if (theme === 'system') {
      const handler = () => apply('system');
      mql.addEventListener('change', handler);
      return () => mql.removeEventListener('change', handler);
    }
  }, [theme, user]);

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    
    // Save to backend if user is logged in
    if (user) {
      try {
        const response = await usersApi.updateProfile({ 
          settings: { ...user.settings, theme: newTheme === 'system' ? 'light' : newTheme }
        });
        if (response?.data) {
          setUser(response.data);
        }
      } catch (error) {
        console.error('Failed to save theme preference:', error);
      }
    }
  };

  return { theme, setTheme };
}