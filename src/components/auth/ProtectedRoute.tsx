import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../api/client';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading, refreshUser } = useAuth();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      // If has token but not authenticated, try to refresh
      if (!isAuthenticated && api.isAuthenticated()) {
        try {
          await refreshUser();
        } catch (error) {
          // Error is handled in refreshUser
          console.log('Auth check failed, will redirect');
        }
      }
      setIsChecking(false);
    };

    checkAuth();
  }, [isAuthenticated, refreshUser]);

  if (isLoading || isChecking) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if email is verified - redirect to verification page if not
  if (user && !user.is_verified) {
    return <Navigate to="/verify-email-sent" replace state={{ email: user.email }} />;
  }

  return <>{children}</>;
}