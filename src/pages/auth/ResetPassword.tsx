import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom'; // Change this
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { GlassCard } from '../../components/ui/GlassCard';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { authApi } from '../../api/auth';
import { useToast } from '../../hooks/useToast';

const resetSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Za-z]/, 'Must contain at least one letter')
    .regex(/[0-9]/, 'Must contain at least one number')
    .regex(/[@$!%*#?&]/, 'Must contain at least one special character'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ResetFormData = z.infer<typeof resetSchema>;

export default function ResetPassword() {
  const [searchParams] = useSearchParams(); // Use useSearchParams instead of useParams
  const token = searchParams.get('token'); // Get token from query params
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
  });

  // Add validation to check if token exists
  useEffect(() => {
    if (!token) {
      toast.error('Invalid or missing reset token');
      navigate('/forgot-password');
    }
  }, [token, navigate, toast]);

  const onSubmit = async (data: ResetFormData) => {
    if (!token) {
      toast.error('Invalid reset token');
      return;
    }

    try {
      setLoading(true);
      // Make sure the data structure matches what backend expects
      await authApi.resetPassword({ 
        token: token,  // Explicitly pass the token
        password: data.password 
      });
      toast.success('Password reset successfully');
      
      // Add a small delay before redirecting to show success message
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error: any) {
      console.error('Reset password error:', error);
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
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
            <h1 className="text-2xl font-bold text-deep-ink">Set New Password</h1>
            <p className="text-gray-600 mt-1">Enter your new password below</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="New Password"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            <Button type="submit" fullWidth loading={loading}>
              Reset Password
            </Button>
          </form>
        </GlassCard>
      </motion.div>
    </div>
  );
}