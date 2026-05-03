// src/pages/settings/Profile.tsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Camera, Save, Trash2, Moon, Sun, Monitor, Bell, BellOff } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
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
  const { theme, setTheme } = useTheme();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [updatingNotifications, setUpdatingNotifications] = useState(false);

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

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      const response = await usersApi.uploadAvatar(file);
      if (response?.data?.avatar && user) {
        const updatedUser: User = {
          ...user,
          avatar: import.meta.env.VITE_API_URL.replace(/\/api$/, '') + response.data.avatar
        };
        setUser(updatedUser);
        toast.success('Avatar uploaded successfully');
      }
    } catch (error) {
      console.error('Avatar upload failed:', error);
      toast.error('Failed to upload avatar. Please try again.');
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user?.avatar) return;

    try {
      await usersApi.removeAvatar();
      if (user) {
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

  const handleToggleNotifications = async () => {
    if (!user) return;
    
    setUpdatingNotifications(true);
    try {
      const newNotificationState = !user.settings?.notifications;
      const response = await usersApi.updateProfile({
        settings: { ...user.settings, notifications: newNotificationState }
      });
      if (response?.data) {
        setUser(response.data);
        toast.success(newNotificationState ? 'Notifications enabled' : 'Notifications disabled');
      }
    } catch (error) {
      console.error('Failed to update notification settings:', error);
      toast.error('Failed to update notification settings');
    } finally {
      setUpdatingNotifications(false);
    }
  };

  const getUserInitials = () => {
    if (!user) return '';
    const firstInitial = user.first_name?.[0] || '';
    const lastInitial = user.last_name?.[0] || '';
    return (firstInitial + lastInitial).toUpperCase() || user.email?.[0]?.toUpperCase() || '?';
  };

  const formatRole = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-deep-ink">Profile Settings</h1>
        <p className="text-gray-600 mt-1">Manage your personal information and preferences</p>
      </div>

      {/* Profile Information */}
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

      {/* Theme Settings */}
      <GlassCard className="p-6">
        <h2 className="text-lg font-semibold text-deep-ink mb-4">Appearance</h2>
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => setTheme('light')}
            className={`p-4 border-2 rounded-xl text-center transition-all ${
              theme === 'light' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Sun size={28} className="mx-auto mb-2 text-yellow-500" />
            <p className="font-medium text-deep-ink">Light</p>
            <p className="text-xs text-gray-500 mt-1">Light mode</p>
          </button>
          
          <button
            onClick={() => setTheme('dark')}
            className={`p-4 border-2 rounded-xl text-center transition-all ${
              theme === 'dark' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Moon size={28} className="mx-auto mb-2 text-indigo-500" />
            <p className="font-medium text-deep-ink">Dark</p>
            <p className="text-xs text-gray-500 mt-1">Dark mode</p>
          </button>
          
          <button
            onClick={() => setTheme('system')}
            className={`p-4 border-2 rounded-xl text-center transition-all ${
              theme === 'system' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Monitor size={28} className="mx-auto mb-2 text-gray-500" />
            <p className="font-medium text-deep-ink">System</p>
            <p className="text-xs text-gray-500 mt-1">Follow system</p>
          </button>
        </div>
      </GlassCard>

      {/* Notification Settings */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-deep-ink">Notifications</h2>
            <p className="text-sm text-gray-500 mt-1">Receive notifications about your activities</p>
          </div>
          <button
            onClick={handleToggleNotifications}
            disabled={updatingNotifications}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
              user?.settings?.notifications !== false ? 'bg-primary' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                user?.settings?.notifications !== false ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        
        <div className="mt-4 flex items-center space-x-2 text-sm text-gray-500">
          {user?.settings?.notifications !== false ? (
            <>
              <Bell size={14} className="text-primary" />
              <span>You will receive email and in-app notifications</span>
            </>
          ) : (
            <>
              <BellOff size={14} className="text-gray-400" />
              <span>All notifications are currently turned off</span>
            </>
          )}
        </div>
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
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Theme preference</span>
            <span className="font-medium capitalize">{theme}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-600">Notifications</span>
            <span className={`font-medium ${user?.settings?.notifications !== false ? 'text-green-600' : 'text-gray-500'}`}>
              {user?.settings?.notifications !== false ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}