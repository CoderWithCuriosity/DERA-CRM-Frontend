import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, Upload } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { organizationApi } from '../../api/organization';
import type { UpdateOrganizationData } from '../../types/organization';
import { useToast } from '../../hooks/useToast';

const orgSchema = z.object({
  company_name: z.string().min(1, 'Company name required'),
  company_email: z.string().email('Invalid email').optional().nullable(),
  company_phone: z.string().optional().nullable(),
  company_address: z.string().optional().nullable(),
  website: z.string().url('Invalid URL').optional().nullable(),
  timezone: z.string(),
  date_format: z.string(),
  currency: z.string(),
});

type OrgFormData = z.infer<typeof orgSchema>;

export default function Organization() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [org, setOrg] = useState<any>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OrgFormData>({
    resolver: zodResolver(orgSchema),
  });

  useEffect(() => {
    fetchOrg();
  }, []);

  const fetchOrg = async () => {
    try {
      const response = await organizationApi.getSettings();
      setOrg(response.data);
      reset(response.data);
    } catch (error) {
      toast.error('Failed to load organization');
    }
  };

  const onSubmit = async (data: OrgFormData) => {
    setLoading(true);
    try {
      await organizationApi.updateSettings(data as UpdateOrganizationData);
      toast.success('Organization updated');
      fetchOrg();
    } catch (error) {
      toast.error('Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await organizationApi.uploadLogo(file);
      toast.success('Logo uploaded');
      fetchOrg();
    } catch (error) {
      toast.error('Logo upload failed');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-deep-ink">Organization Settings</h1>

      <GlassCard className="p-6">
        <div className="flex items-center space-x-6 mb-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-xl bg-linear-to-br from-primary to-accent flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
              {org?.company_logo ? (
                <img src={org.company_logo} alt="logo" className="w-full h-full object-cover" />
              ) : (
                <span>{org?.company_name?.[0]}</span>
              )}
            </div>
            <label htmlFor="logo-upload" className="absolute bottom-0 right-0 p-1 bg-white rounded-full shadow cursor-pointer">
              <Upload size={16} className="text-primary" />
              <input
                type="file"
                id="logo-upload"
                className="hidden"
                accept="image/*"
                onChange={handleLogoUpload}
              />
            </label>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-deep-ink">{org?.company_name}</h2>
            <p className="text-gray-600">Company logo</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Company Name"
            error={errors.company_name?.message}
            {...register('company_name')}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Email"
              type="email"
              error={errors.company_email?.message}
              {...register('company_email')}
            />
            <Input
              label="Phone"
              error={errors.company_phone?.message}
              {...register('company_phone')}
            />
          </div>
          <Input
            label="Address"
            error={errors.company_address?.message}
            {...register('company_address')}
          />
          <Input
            label="Website"
            error={errors.website?.message}
            {...register('website')}
          />
          <div className="grid grid-cols-3 gap-3">
            <select
              className="px-3 py-2 bg-white/70 border border-blue-100 rounded-xl"
              {...register('timezone')}
            >
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
            </select>
            <select
              className="px-3 py-2 bg-white/70 border border-blue-100 rounded-xl"
              {...register('date_format')}
            >
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
            <select
              className="px-3 py-2 bg-white/70 border border-blue-100 rounded-xl"
              {...register('currency')}
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
          <div className="flex justify-end">
            <Button type="submit" loading={loading}>
              <Save size={18} className="mr-2" /> Save Changes
            </Button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}