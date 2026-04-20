import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { authApi } from '../../api/auth';

export default function RequestVerification() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setStatus('error');
      setMessage('Please enter your email address');
      return;
    }

    setStatus('sending');
    
    try {
      await authApi.resendVerification(email);
      setStatus('success');
      setMessage(`Verification email sent to ${email}! Please check your inbox.`);
      
      // Redirect to login after 3 seconds on success
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error: any) {
      setStatus('error');
      setMessage(
        error.response?.data?.message || 
        'Failed to send verification email. Please try again later.'
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-light p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <GlassCard className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-linear-to-br from-primary to-accent rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-deep-ink">Resend Verification Email</h1>
            <p className="text-gray-600 mt-1">
              We'll send a new verification link to your email
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === 'sending' || status === 'success'}
            />

            {status === 'success' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2"
              >
                <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                <p className="text-sm text-green-700">{message}</p>
              </motion.div>
            )}

            {status === 'error' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2"
              >
                <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                <p className="text-sm text-red-700">{message}</p>
              </motion.div>
            )}

            <Button
              type="submit"
              fullWidth
              loading={status === 'sending'}
              disabled={status === 'sending' || status === 'success'}
            >
              {status === 'sending' ? 'Sending...' : 'Send Verification Email'}
            </Button>

            <Link to="/login">
              <Button type="button" variant="ghost" fullWidth>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </Link>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Didn't receive the email? Check your spam folder or{' '}
              <Link to="/register" className="text-primary hover:text-primary-600">
                create a new account
              </Link>
            </p>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}