// src/pages/settings/Profile.tsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Camera, Save, Trash2 } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { usersApi } from '../../api/users';
import type { UpdateProfileData, User } from '../../types/user';
import { useToast } from '../../hooks/useToast';

const profileSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function Profile() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    setLoading(true);
    try {
      const response = await usersApi.updateProfile(data as UpdateProfileData);
      // Ensure we have the complete user object
      if (response?.data) {
        setUser(response.data);
        toast.success('Profile updated successfully');
      }
    } catch (error) {
      console.error('Profile update failed:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('Image size should be less than 5MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      const response = await usersApi.uploadAvatar(file);
      if (response?.data?.avatar && user) {
        // Type-safe update with proper User type
        const updatedUser: User = {
          ...user,
          avatar: response.data.avatar
        };
        setUser(updatedUser);
        toast.success('Avatar uploaded successfully');
      }
    } catch (error) {
      console.error('Avatar upload failed:', error);
      toast.error('Failed to upload avatar. Please try again.');
    } finally {
      setUploadingAvatar(false);
      // Reset the input
      e.target.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user?.avatar) return;

    try {
      await usersApi.removeAvatar();
      if (user) {
        // Type-safe update with proper User type
        const updatedUser: User = {
          ...user,
          avatar: null
        };
        setUser(updatedUser);
        toast.success('Avatar removed successfully');
      }
    } catch (error) {
      console.error('Failed to remove avatar:', error);
      toast.error('Failed to remove avatar. Please try again.');
    }
  };

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!user) return '';
    const firstInitial = user.first_name?.[0] || '';
    const lastInitial = user.last_name?.[0] || '';
    return (firstInitial + lastInitial).toUpperCase() || user.email?.[0]?.toUpperCase() || '?';
  };

  // Format role for display
  const formatRole = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-deep-ink">Profile Settings</h1>
        <p className="text-gray-600 mt-1">Manage your personal information and avatar</p>
      </div>

      <GlassCard className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 mb-6">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full bg-linear-to-br from-primary to-accent flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
              {user?.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={`${user.first_name} ${user.last_name}`} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{getUserInitials()}</span>
              )}
            </div>
            
            {/* Avatar upload overlay */}
            <label 
              htmlFor="avatar-upload" 
              className={`absolute bottom-0 right-0 p-1.5 bg-white rounded-full shadow-lg cursor-pointer hover:bg-gray-50 transition-colors ${uploadingAvatar ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Camera size={16} className="text-primary" />
              <input
                type="file"
                id="avatar-upload"
                className="hidden"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleAvatarChange}
                disabled={uploadingAvatar}
              />
            </label>

            {/* Uploading indicator */}
            {uploadingAvatar && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
              </div>
            )}
          </div>

          <div className="flex-1">
            <h2 className="text-xl font-semibold text-deep-ink">
              {user?.first_name} {user?.last_name}
            </h2>
            <p className="text-gray-600">{formatRole(user?.role || '')}</p>
            <p className="text-sm text-gray-500 mt-1">{user?.email}</p>
            
            {user?.avatar && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleRemoveAvatar} 
                className="mt-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                disabled={uploadingAvatar}
              >
                <Trash2 size={14} className="mr-1" /> Remove avatar
              </Button>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="First Name"
              placeholder="Enter your first name"
              error={errors.first_name?.message}
              disabled={loading}
              {...register('first_name')}
            />
            <Input
              label="Last Name"
              placeholder="Enter your last name"
              error={errors.last_name?.message}
              disabled={loading}
              {...register('last_name')}
            />
          </div>
          
          <Input
            label="Email"
            type="email"
            placeholder="Enter your email address"
            error={errors.email?.message}
            disabled={loading}
            {...register('email')}
          />

          <div className="flex justify-end pt-4">
            <Button 
              type="submit" 
              loading={loading}
              disabled={uploadingAvatar}
            >
              <Save size={18} className="mr-2" /> Save Changes
            </Button>
          </div>
        </form>
      </GlassCard>

      {/* Account Information */}
      <GlassCard className="p-6">
        <h2 className="text-lg font-semibold text-deep-ink mb-4">Account Information</h2>
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Member since</span>
            <span className="font-medium">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Last login</span>
            <span className="font-medium">
              {user?.last_login ? new Date(user.last_login).toLocaleString() : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Email verified</span>
            <span className={`font-medium ${user?.is_verified ? 'text-green-600' : 'text-yellow-600'}`}>
              {user?.is_verified ? 'Yes' : 'No'}
            </span>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}