import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import { PageTransition } from './PageTransition';
import { useAuth } from '../../hooks/useAuth';
import { ImpersonationBanner } from '../ui/ImpersonationBanner';

export function Layout() {
    const { isImpersonating } = useAuth();

  return (
    <div className="flex h-screen bg-surface-light">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {isImpersonating && <ImpersonationBanner />}
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <PageTransition key={location.pathname}>
                <Outlet />
              </PageTransition>
            </AnimatePresence>
          </div>
        </main>
      </div>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'white',
            color: '#001A40',
            borderRadius: '12px',
            boxShadow: '0 8px 30px rgba(0, 102, 255, 0.12)',
          },
        }}
      />
    </div>
  );
}