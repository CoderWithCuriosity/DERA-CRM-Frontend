import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, User as UserIcon, AlertCircle, Calendar, UserPlus } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { ticketsApi } from '../../api/tickets';
import { contactsApi } from '../../api/contacts';
import { usersApi } from '../../api/users';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';
import type { Contact } from '../../types/contact';
import type { User } from '../../types/user';
import type { TicketPriority } from '../../types/ticket';

const createTicketSchema = z.object({
  subject: z.string().min(1, 'Subject is required').max(255, 'Subject is too long'),
  description: z.string().min(1, 'Description is required'),
  contact_id: z.number().min(1, 'Please select a contact'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  due_date: z.string().optional(),
  assigned_to: z.number().optional(),
});

type CreateTicketFormData = z.infer<typeof createTicketSchema>;

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

export default function CreateTicket() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<CreateTicketFormData>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      priority: 'medium',
    },
  });

  const selectedPriority = watch('priority');
  const selectedContactId = watch('contact_id');

  useEffect(() => {
    fetchContacts();
    if (user?.role === 'admin' || user?.role === 'manager') {
      fetchUsers();
    }
  }, [user]);

  const fetchContacts = async () => {
    try {
      const response = await contactsApi.getContacts({ limit: 100 });
      const contactsData = response.data?.data || response.data?.data || [];
      setContacts(contactsData);
    } catch (error) {
      toast.error('Failed to load contacts');
      setContacts([]);
    } finally {
      setLoadingContacts(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await usersApi.getUsers();
      const usersData = response.data?.data || [];
      setUsers(usersData);
    } catch (error) {
      console.error('Failed to load users');
      setUsers([]);
    }
  };

  const onSubmit = async (data: CreateTicketFormData) => {
    setLoading(true);
    try {
      await ticketsApi.createTicket({
        subject: data.subject,
        description: data.description,
        contact_id: data.contact_id,
        priority: data.priority as TicketPriority,
        due_date: data.due_date,
        assigned_to: data.assigned_to,
      });
      toast.success('Ticket created successfully');
      navigate('/tickets');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  const getSLADescription = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'Response: 1 hour, Resolution: 4 hours';
      case 'high':
        return 'Response: 4 hours, Resolution: 24 hours';
      case 'medium':
        return 'Response: 8 hours, Resolution: 48 hours';
      case 'low':
        return 'Response: 24 hours, Resolution: 120 hours';
      default:
        return '';
    }
  };

  if (loadingContacts) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const selectedContact = contacts.find(c => c.id === selectedContactId);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/tickets')}>
          <ArrowLeft size={18} className="mr-2" /> Back to Tickets
        </Button>
        <h1 className="text-3xl font-bold text-deep-ink">Create New Ticket</h1>
      </div>

      <GlassCard className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div>
            <h2 className="text-lg font-semibold text-deep-ink mb-4">Ticket Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Subject"
                placeholder="Brief summary of the issue"
                error={errors.subject?.message}
                leftIcon={<UserIcon size={18} />}
                {...register('subject')}
              />

              <Select
                label="Contact"
                error={errors.contact_id?.message}
                onChange={(e) => setValue('contact_id', Number(e.target.value))}
              >
                <option value="">Select a contact</option>
                {contacts.map(contact => (
                  <option key={contact.id} value={contact.id}>
                    {contact.first_name} {contact.last_name} {contact.company ? `- ${contact.company}` : ''}
                  </option>
                ))}
              </Select>

              <Select
                label="Priority"
                error={errors.priority?.message}
                {...register('priority')}
              >
                {priorityOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>

              <Input
                label="Due Date"
                type="date"
                error={errors.due_date?.message}
                leftIcon={<Calendar size={18} />}
                {...register('due_date')}
              />

              {(user?.role === 'admin' || user?.role === 'manager') && (
                <Select
                  label="Assign To"
                  error={errors.assigned_to?.message}
                  onChange={(e) => setValue('assigned_to', e.target.value ? Number(e.target.value) : undefined)}
                >
                  <option value="">Unassigned</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.first_name} {u.last_name}
                    </option>
                  ))}
                </Select>
              )}

              <div className="md:col-span-2">
                <Textarea
                  label="Description"
                  placeholder="Detailed description of the issue..."
                  rows={6}
                  error={errors.description?.message}
                  {...register('description')}
                />
              </div>
            </div>
          </div>

          {/* SLA Information */}
          {selectedPriority && (
            <div className="bg-primary/5 p-4 rounded-lg">
              <h3 className="font-medium text-deep-ink mb-2 flex items-center">
                <AlertCircle size={18} className="mr-2 text-primary" />
                Service Level Agreement (SLA)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Priority</p>
                  <p className="font-medium capitalize">{selectedPriority}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">SLA Targets</p>
                  <p className="font-medium">{getSLADescription(selectedPriority)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Selected Contact Info */}
          {selectedContact && (
            <div className="bg-blue-50/50 p-4 rounded-lg">
              <h3 className="font-medium text-deep-ink mb-2 flex items-center">
                <UserPlus size={18} className="mr-2 text-primary" />
                Contact Information
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">{selectedContact.first_name} {selectedContact.last_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{selectedContact.email || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{selectedContact.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Company</p>
                  <p className="font-medium">{selectedContact.company || '-'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/tickets')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              <Save size={18} className="mr-2" />
              {loading ? 'Creating...' : 'Create Ticket'}
            </Button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}