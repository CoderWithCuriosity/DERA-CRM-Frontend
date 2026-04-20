import { useState } from 'react';
import {  useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { authApi } from '../../api/auth';
import { useAuth } from '../../hooks/useAuth';

export default function VerifyEmailSent() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';
  const { logout } = useAuth(); // Get logout function
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [resendMessage, setResendMessage] = useState('');

  const handleResendVerification = async () => {
    if (!email) {
      setResendStatus('error');
      setResendMessage('Email address not found. Please try registering again.');
      return;
    }

    setIsResending(true);
    setResendStatus('idle');
    
    try {
      await authApi.resendVerification(email);
      setResendStatus('success');
      setResendMessage('Verification email resent successfully! Please check your inbox.');
    } catch (error: any) {
      setResendStatus('error');
      setResendMessage(
        error.response?.data?.message || 
        'Failed to resend verification email. Please try again later.'
      );
    } finally {
      setIsResending(false);
      setTimeout(() => {
        if (resendStatus !== 'idle') {
          setResendStatus('idle');
          setResendMessage('');
        }
      }, 5000);
    }
  };

  const handleBackToLogin = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-light p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <GlassCard className="p-8 text-center">
          <div className="w-20 h-20 bg-linear-to-br from-primary to-accent rounded-full mx-auto mb-6 flex items-center justify-center">
            <Mail className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-2xl font-bold text-deep-ink mb-2">
            Verify Your Email
          </h1>
          
          <p className="text-gray-600 mb-4">
            We've sent a verification link to <strong>{email || 'your email'}</strong>
          </p>
          
          <p className="text-sm text-gray-500 mb-6">
            Please check your email and click the verification link to activate your account.
            The link will expire in 24 hours.
          </p>

          {/* Resend Status Messages */}
          {resendStatus === 'success' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2"
            >
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
              <p className="text-sm text-green-700">{resendMessage}</p>
            </motion.div>
          )}

          {resendStatus === 'error' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2"
            >
              <XCircle className="w-5 h-5 text-red-600 shrink-0" />
              <p className="text-sm text-red-700">{resendMessage}</p>
            </motion.div>
          )}

          <div className="space-y-3">
            <Button
              onClick={handleResendVerification}
              variant="outline"
              fullWidth
              disabled={isResending}
            >
              {isResending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                'Resend Verification Email'
              )}
            </Button>
            
            <Button
              onClick={handleBackToLogin}
              variant="ghost"
              fullWidth
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Button>
          </div>

          {/* Help Text */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Didn't receive the email? Check your spam folder or{' '}
              <button
                onClick={handleResendVerification}
                className="text-primary hover:text-primary-600 font-medium"
                disabled={isResending}
              >
                click here
              </button>{' '}
              to resend.
            </p>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}