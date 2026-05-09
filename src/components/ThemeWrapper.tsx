import { useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';

interface ThemeWrapperProps {
  children: React.ReactNode;
}

export function ThemeWrapper({ children }: ThemeWrapperProps) {
  const { theme } = useTheme();

  useEffect(() => {
    const root = document.documentElement;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      let isDark = false;
      if (theme === 'dark') isDark = true;
      if (theme === 'light') isDark = false;
      if (theme === 'system') isDark = mql.matches;
      
      root.classList.toggle('dark', isDark);
      
      root.setAttribute('data-theme', isDark ? 'dark' : 'light');
    };

    applyTheme();

    if (theme === 'system') {
      const handler = () => applyTheme();
      mql.addEventListener('change', handler);
      return () => mql.removeEventListener('change', handler);
    }
  }, [theme]);

  return <>{children}</>;
}