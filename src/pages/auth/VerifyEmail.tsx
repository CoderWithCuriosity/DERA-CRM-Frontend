import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided');
      return;
    }

    authApi.verifyEmail(token)
      .then(() => {
        setStatus('success');
        setMessage('Email verified successfully! You can now login.');
        // Redirect to login after 3 seconds
        setTimeout(() => navigate('/login'), 3000);
      })
      .catch((error) => {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Email verification failed');
      });
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <Loader className="mx-auto h-12 w-12 text-indigo-600 animate-spin" />
              <h2 className="mt-4 text-xl font-semibold">Verifying your email...</h2>
            </>
          )}
          
          {status === 'success' && (
            <>
              <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
              <h2 className="mt-4 text-xl font-semibold text-green-700">Success!</h2>
              <p className="mt-2 text-gray-600">{message}</p>
              <p className="mt-4 text-sm text-gray-500">Redirecting to login...</p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <XCircle className="mx-auto h-12 w-12 text-red-500" />
              <h2 className="mt-4 text-xl font-semibold text-red-700">Verification Failed</h2>
              <p className="mt-2 text-gray-600">{message}</p>
              <button
                onClick={() => navigate('/login')}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Go to Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}