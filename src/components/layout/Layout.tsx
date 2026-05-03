import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import { PageTransition } from './PageTransition';
import { useAuth } from '../../hooks/useAuth';
import { ImpersonationBanner } from '../ui/ImpersonationBanner';

export function Layout() {
  const { isImpersonating } = useAuth();
  const location = useLocation();

  return (
    <div className="flex h-screen bg-app overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {isImpersonating && <ImpersonationBanner />}
        <Header />
        <main className="flex-1 overflow-y-auto p-5">
          <AnimatePresence mode="wait" initial={false}>
            <PageTransition key={location.pathname}>
              <Outlet />
            </PageTransition>
          </AnimatePresence>
        </main>
      </div>
      <Toaster 
        position="bottom-right"
        gutter={8}
        toastOptions={{
          duration: 3500,
          style: {
            background: 'var(--bg-base)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            fontSize: 13,
            boxShadow: 'var(--shadow-lg)',
            padding: '10px 14px',
            maxWidth: 360,
          },
          success: {
            iconTheme: { primary: '#22C55E', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#EF4444', secondary: '#fff' },
          },
        }}
      />
    </div>
  );
}