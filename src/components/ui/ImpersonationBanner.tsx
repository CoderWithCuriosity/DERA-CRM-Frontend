import { useState } from 'react';
import { AlertTriangle, XCircle, Shield } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from './Button';

export const ImpersonationBanner = () => {
  const [isStopping, setIsStopping] = useState(false);
  const { user, stopImpersonating } = useAuth();

  const handleStopImpersonating = async () => {
    if (!confirm('Stop impersonating and return to your admin account?')) {
      return;
    }

    setIsStopping(true);
    try {
      await stopImpersonating();
    } catch (error: any) {
      console.log(error);
      alert('Failed to stop impersonating');
    } finally {
      setIsStopping(false);
    }
  };

  if (!user?.isImpersonating) return null;

  return (
    <div className="bg-linear-to-r from-yellow-50 to-amber-50 border-b-2 border-yellow-400 shadow-sm">
      <div className="px-4 py-2.5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center flex-1 min-w-0">
            <div className="shrink-0">
              <div className="bg-yellow-100 rounded-full p-1.5">
                <Shield className="h-4 w-4 text-yellow-600" />
              </div>
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-yellow-800 truncate">
                <span className="font-bold">Impersonation Mode</span>
                <span className="mx-2">•</span>
                You are logged in as 
                <span className="font-semibold ml-1 text-yellow-900">
                  {user.first_name} {user.last_name}
                </span>
                <span className="mx-2">•</span>
                <span className="text-xs text-yellow-600">
                  Impersonated by: {user.impersonatedBy?.name}
                </span>
              </p>
              <p className="text-xs text-yellow-600 mt-0.5 flex items-center">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Session expires in 2 hours. All actions are being logged for audit purposes.
              </p>
            </div>
          </div>
          <div className="shrink-0">
            <Button
              onClick={handleStopImpersonating}
              disabled={isStopping}
              variant="outline"
              size="sm"
              className="bg-white border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400"
            >
              {isStopping ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-700 mr-2" />
                  Stopping...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Stop Impersonating
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};