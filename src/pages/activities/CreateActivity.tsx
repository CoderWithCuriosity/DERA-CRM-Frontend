import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, X } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { activitiesApi } from '../../api/activities';
import { contactsApi } from '../../api/contacts';
import { dealsApi } from '../../api/deals';
import { usersApi } from '../../api/users';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';
import type { Contact } from '../../types/contact';
import type { Deal } from '../../types/deal';
import type { User } from '../../types/user';
import type { ActivityType } from '../../types/activity';

// Dynamic schema based on activity type
const getActivitySchema = (type: ActivityType) => {
  const baseSchema = {
    type: z.enum(['call', 'email', 'meeting', 'task', 'note', 'follow-up']),
    subject: z.string().min(1, 'Subject is required'),
    description: z.string().optional(),
    contact_id: z.number().optional(),
    deal_id: z.number().optional(),
    user_id: z.number().optional(),
  };

  // Notes don't need scheduled_date or duration
  if (type === 'note') {
    return z.object({
      ...baseSchema,
      scheduled_date: z.string().optional(),
      duration: z.number().optional(),
    });
  }

  // Tasks use scheduled_date as due date
  // Calls/Meetings/Emails use scheduled_date as appointment time
  return z.object({
    ...baseSchema,
    scheduled_date: z.string().min(1, 'Scheduled date is required'),
    duration: z.number().min(0).optional(),
  });
};

const typeOptions = [
  { value: 'call', label: 'Call', requiresScheduling: true, hasDuration: true },
  { value: 'email', label: 'Email', requiresScheduling: true, hasDuration: false },
  { value: 'meeting', label: 'Meeting', requiresScheduling: true, hasDuration: true },
  { value: 'task', label: 'Task', requiresScheduling: true, hasDuration: false },
  { value: 'note', label: 'Note', requiresScheduling: false, hasDuration: false },
  { value: 'follow-up', label: 'Follow-up', requiresScheduling: true, hasDuration: false },
];

export default function CreateActivity() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const isEdit = !!id;

  // Initialize form FIRST
  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<any>({
    defaultValues: {
      type: 'task',
      scheduled_date: new Date().toISOString().slice(0, 16),
      user_id: user?.id,
      duration: undefined,
    },
  });

  // NOW you can use watch
  const selectedType = watch('type');
  const currentTypeOptions = typeOptions.find(opt => opt.value === selectedType);

  // Dynamic form schema based on selected type
  const [formSchema, setFormSchema] = useState(() => getActivitySchema('task'));

  // Update resolver when schema changes
  useEffect(() => {
    const newSchema = getActivitySchema(selectedType);
    setFormSchema(() => newSchema);
    
    // Clear fields that are no longer needed
    if (selectedType === 'note') {
      setValue('scheduled_date', undefined);
      setValue('duration', undefined);
    }
  }, [selectedType, setValue]);

  // Re-run resolver when schema changes
  useEffect(() => {
    // Re-validate form when schema changes
    const newResolver = zodResolver(formSchema);
    // You might need to re-trigger validation here
  }, [formSchema]);

  useEffect(() => {
    fetchData();
    if (isEdit) fetchActivity();
  }, [id]);

  const fetchData = async () => {
    try {
      const [contactsRes, dealsRes, usersRes] = await Promise.all([
        contactsApi.getContacts({ limit: 100 }),
        dealsApi.getDeals({ limit: 100, status: 'open' }),
        user?.role === 'admin' || user?.role === 'manager' ? usersApi.getUsers() : Promise.resolve({ data: { data: [] } }),
      ]);
      setContacts(contactsRes.data?.data || []);
      setDeals(dealsRes.data?.data || []);
      setUsers(usersRes.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchActivity = async () => {
    try {
      const response = await activitiesApi.getActivityById(Number(id));
      const activity = response.data;
      reset({
        type: activity.type,
        subject: activity.subject,
        description: activity.description || '',
        contact_id: activity.contact_id || undefined,
        deal_id: activity.deal_id || undefined,
        scheduled_date: activity.scheduled_date ? new Date(activity.scheduled_date).toISOString().slice(0, 16) : undefined,
        duration: activity.duration ?? undefined,
        user_id: activity.user_id,
      });
    } catch (error) {
      toast.error('Failed to load activity');
      navigate('/activities');
    }
  };

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      // Clean up data based on activity type
      const cleanedData = { ...data };
      
      // Remove duration if it's undefined or null
      if (cleanedData.duration === undefined || cleanedData.duration === null || cleanedData.duration === '') {
        delete cleanedData.duration;
      }
      
      // make scheduled_date for notes to be now
      if (cleanedData.type === 'note') {
        cleanedData.scheduled_date = new Date().toISOString();
      }
      
      // Convert duration to number if present
      if (cleanedData.duration) {
        cleanedData.duration = Number(cleanedData.duration);
      }

      if (isEdit) {
        await activitiesApi.updateActivity(Number(id), cleanedData);
        toast.success('Activity updated successfully');
      } else {
        await activitiesApi.createActivity(cleanedData);
        toast.success('Activity created successfully');
      }
      navigate('/activities');
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} activity`);
    } finally {
      setLoading(false);
    }
  };

  const contactOptions = contacts.map(c => ({
    value: c.id,
    label: `${c.first_name} ${c.last_name}`,
    sublabel: c.company || c.email,
  }));

  const dealOptions = deals.map(d => ({
    value: d.id,
    label: d.name,
    sublabel: `$${d.amount?.toLocaleString()}`,
  }));

  const userOptions = users.map(u => ({
    value: u.id,
    label: `${u.first_name} ${u.last_name}`,
    sublabel: u.email,
  }));

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Helper to get date label based on activity type
  const getDateLabel = () => {
    switch (selectedType) {
      case 'task':
        return 'Due Date & Time';
      case 'note':
        return 'Date & Time (Optional)';
      default:
        return 'Scheduled Date & Time';
    }
  };

  // Helper to get date placeholder/helper text
  const getDateHelperText = () => {
    switch (selectedType) {
      case 'task':
        return 'When is this task due?';
      case 'note':
        return 'When was this note created? (Defaults to now if empty)';
      case 'follow-up':
        return 'When should you follow up?';
      default:
        return 'When is this activity scheduled?';
    }
  };

  // Wrapper component for Input with helper text
  const InputWithHelper = ({ helperText, ...props }: any) => (
    <div className="space-y-1">
      <Input {...props} />
      {helperText && (
        <p className="text-xs text-gray-500 mt-1">{helperText}</p>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/activities')}>
          <ArrowLeft size={18} className="mr-2" /> Back
        </Button>
        <h1 className="text-3xl font-bold text-deep-ink">
          {isEdit ? 'Edit Activity' : 'Log New Activity'}
        </h1>
      </div>

      <GlassCard className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Activity Type"
              error={errors.type?.message as string | undefined}
              {...register('type')}
            >
              {typeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>

            <Input
              label="Subject"
              placeholder={
                selectedType === 'note' 
                  ? 'Note title...' 
                  : selectedType === 'task'
                  ? 'Task name...'
                  : `Brief description of the ${selectedType}...`
              }
              error={errors.subject?.message as string | undefined}
              {...register('subject')}
            />

            {/* Contact field with clear button below */}
            <div>
              <SearchableSelect
                label="Contact (Optional)"
                value={watch('contact_id')}
                onChange={(value) => setValue('contact_id', value ? Number(value) : undefined)}
                options={contactOptions}
                placeholder="Search for a contact..."
                error={errors.contact_id?.message as string | undefined}
              />
              {watch('contact_id') && (
                <button
                  type="button"
                  onClick={() => setValue('contact_id', undefined)}
                  className="text-xs text-red-500 hover:text-red-700 mt-1 flex items-center gap-1"
                >
                  <X size={12} /> Clear selection
                </button>
              )}
            </div>

            {/* Deal field with clear button below */}
            <div>
              <SearchableSelect
                label="Deal (Optional)"
                value={watch('deal_id')}
                onChange={(value) => setValue('deal_id', value ? Number(value) : undefined)}
                options={dealOptions}
                placeholder="Search for a deal..."
                error={errors.deal_id?.message as string | undefined}
              />
              {watch('deal_id') && (
                <button
                  type="button"
                  onClick={() => setValue('deal_id', undefined)}
                  className="text-xs text-red-500 hover:text-red-700 mt-1 flex items-center gap-1"
                >
                  <X size={12} /> Clear selection
                </button>
              )}
            </div>

            {/* Scheduled Date - conditionally shown */}
            {selectedType !== 'note' && (
              <InputWithHelper
                label={getDateLabel()}
                type="datetime-local"
                helperText={getDateHelperText()}
                error={errors.scheduled_date?.message as string | undefined}
                {...register('scheduled_date')}
              />
            )}

            {/* Note: show simple date picker instead */}
            {selectedType === 'note' && (
              <InputWithHelper
                label={getDateLabel()}
                type="datetime-local"
                helperText={getDateHelperText()}
                error={errors.scheduled_date?.message as string | undefined}
                {...register('scheduled_date')}
              />
            )}

            {/* Duration - only for call and meeting */}
            {(selectedType === 'call' || selectedType === 'meeting') && (
              <InputWithHelper
                label="Duration (minutes)"
                type="number"
                placeholder="e.g., 30"
                helperText="How long will this take?"
                error={errors.duration?.message as string | undefined}
                {...register('duration', { 
                  setValueAs: (v) => v === '' ? undefined : Number(v)
                })}
              />
            )}

            {/* Assign To field with clear button below - only for admin/manager */}
            {(user?.role === 'admin' || user?.role === 'manager') && (
              <div>
                <SearchableSelect
                  label="Assign To"
                  value={watch('user_id')}
                  onChange={(value) => setValue('user_id', value ? Number(value) : undefined)}
                  options={userOptions}
                  placeholder="Search for a user..."
                  error={errors.user_id?.message as string | undefined}
                />
                {watch('user_id') && watch('user_id') !== user?.id && (
                  <button
                    type="button"
                    onClick={() => setValue('user_id', user?.id)}
                    className="text-xs text-red-500 hover:text-red-700 mt-1 flex items-center gap-1"
                  >
                    <X size={12} /> Clear selection (reset to me)
                  </button>
                )}
              </div>
            )}
          </div>

          <Textarea
            label="Description"
            placeholder={
              selectedType === 'call'
                ? "Agenda, talking points, or notes for the call..."
                : selectedType === 'meeting'
                ? "Meeting agenda, location, or video link..."
                : selectedType === 'note'
                ? "Write your note here..."
                : "Additional details..."
            }
            rows={4}
            error={errors.description?.message as string | undefined}
            {...register('description')}
          />

          {/* Contextual tips based on activity type */}
          {selectedType === 'call' && (
            <div className="bg-blue-50/50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 Tip: After the call, you can log the outcome and any follow-up actions.
              </p>
            </div>
          )}

          {selectedType === 'meeting' && (
            <div className="bg-purple-50/50 p-4 rounded-lg">
              <p className="text-sm text-purple-800">
                💡 Tip: Remember to add the meeting location or video call link in the description.
              </p>
            </div>
          )}

          {selectedType === 'email' && (
            <div className="bg-green-50/50 p-4 rounded-lg">
              <p className="text-sm text-green-800">
                💡 Tip: Consider using email templates for common communication.
              </p>
            </div>
          )}

          {selectedType === 'task' && (
            <div className="bg-yellow-50/50 p-4 rounded-lg">
              <p className="text-sm text-yellow-800">
                💡 Tip: Set a realistic due date and break down complex tasks.
              </p>
            </div>
          )}

          {selectedType === 'note' && (
            <div className="bg-gray-50/50 p-4 rounded-lg">
              <p className="text-sm text-gray-800">
                📝 Notes are saved immediately and don't require a scheduled date.
              </p>
            </div>
          )}

          {selectedType === 'follow-up' && (
            <div className="bg-orange-50/50 p-4 rounded-lg">
              <p className="text-sm text-orange-800">
                🔔 Set a follow-up date to ensure you don't miss important opportunities.
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/activities')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              <Save size={18} className="mr-2" />
              {loading ? 'Saving...' : (isEdit ? 'Update Activity' : 'Create Activity')}
            </Button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}