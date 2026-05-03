import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, User as UserIcon, DollarSign, Calendar } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { dealsApi } from '../../api/deals';
import { contactsApi } from '../../api/contacts';
import { usersApi } from '../../api/users';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';
import { useCurrency } from '../../hooks/useCurrency';
import type { Contact } from '../../types/contact';
import type { User } from '../../types/user';
import type { Option } from '../../components/ui/SearchableSelect';

const dealSchema = z.object({
  name: z.string().min(1, 'Deal name is required'),
  contact_id: z.number()
    .min(1, 'Contact is required')
    .positive('Contact must be a positive number'),
  stage: z.enum(['lead', 'qualified', 'proposal', 'negotiation']),
  amount: z.number().min(0, 'Amount must be positive'),
  probability: z.number().min(0, 'Probability must be at least 0').max(100, 'Probability cannot exceed 100'),
  expected_close_date: z.string().optional(),
  notes: z.string().optional(),
  user_id: z.number().optional(),
});

type DealFormData = z.infer<typeof dealSchema>;

const stageOptions = [
  { value: 'lead', label: 'Lead' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'negotiation', label: 'Negotiation' },
];

export default function CreateDeal() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const { formatCurrency } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [userOptions, setUserOptions] = useState<Option[]>([]);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<DealFormData>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      stage: 'lead',
      probability: 10,
      user_id: user?.id,
    },
  });

  const selectedStage = watch('stage');
  const selectedAmount = watch('amount') || 0;
  const selectedProbability = watch('probability') || 0;
  const selectedUserId = watch('user_id');
  const weightedAmount = (selectedAmount * selectedProbability) / 100;

  useEffect(() => {
    fetchContacts();
    if (user?.role === 'admin') {
      fetchUsers();
    }
  }, [user]);

  useEffect(() => {
    if (users.length > 0) {
      const options = users.map(u => ({
        value: u.id,
        label: `${u.first_name} ${u.last_name}`,
        sublabel: u.email,
        initials: `${u.first_name?.[0] || ''}${u.last_name?.[0] || ''}`
      }));
      setUserOptions(options);
    }
  }, [users]);

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
      const usersData = response.data?.data || response.data?.data || [];
      setUsers(usersData);
    } catch (error) {
      console.error('Failed to load users');
      setUsers([]);
    }
  };

  const onSubmit = async (data: DealFormData) => {
    setLoading(true);
    try {
      await dealsApi.createDeal(data);
      toast.success('Deal created successfully');
      navigate('/deals');
    } catch (error) {
      toast.error('Failed to create deal');
    } finally {
      setLoading(false);
    }
  };

  const handleStageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const stage = e.target.value;
    const probabilities = {
      lead: 10,
      qualified: 40,
      proposal: 60,
      negotiation: 80,
    };
    setValue('probability', probabilities[stage as keyof typeof probabilities]);
    setValue('stage', stage as any);
  };

  if (loadingContacts) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/deals')}>
          <ArrowLeft size={18} className="mr-2" /> Back to Deals
        </Button>
        <h1 className="text-3xl font-bold text-deep-ink">Create New Deal</h1>
      </div>

      <GlassCard className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-deep-ink mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Deal Name"
                placeholder="e.g., Enterprise Plan - Company Name"
                error={errors.name?.message}
                leftIcon={<UserIcon size={18} />}
                {...register('name')}
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

              {user?.role === 'admin' && (
                <SearchableSelect
                  label="Owner"
                  value={selectedUserId}
                  onChange={(value) => setValue('user_id', Number(value))}
                  options={userOptions}
                  placeholder="Search for a user..."
                  error={errors.user_id?.message}
                />
              )}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-deep-ink mb-4">Deal Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="Stage"
                error={errors.stage?.message}
                value={selectedStage}
                onChange={handleStageChange}
              >
                {stageOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>

              <Input
                label="Amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                error={errors.amount?.message}
                leftIcon={<DollarSign size={18} />}
                {...register('amount', { valueAsNumber: true })}
              />

              <Input
                label="Probability (%)"
                type="number"
                min="0"
                max="100"
                error={errors.probability?.message}
                {...register('probability', { valueAsNumber: true })}
              />

              <Input
                label="Expected Close Date"
                type="date"
                error={errors.expected_close_date?.message}
                leftIcon={<Calendar size={18} />}
                {...register('expected_close_date')}
              />

              <div className="md:col-span-3">
                <Textarea
                  label="Notes"
                  placeholder="Add any additional notes about this deal..."
                  rows={4}
                  error={errors.notes?.message}
                  {...register('notes')}
                />
              </div>
            </div>
          </div>

          <div className="bg-primary/5 p-4 rounded-lg">
            <h3 className="font-medium text-deep-ink mb-2">Deal Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Stage</p>
                <p className="font-medium capitalize">{selectedStage}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Amount</p>
                <p className="font-medium">{formatCurrency(selectedAmount)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Probability</p>
                <p className="font-medium">{selectedProbability}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Weighted Amount</p>
                <p className="font-medium text-primary">{formatCurrency(weightedAmount)}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/deals')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              <Save size={18} className="mr-2" />
              {loading ? 'Creating...' : 'Create Deal'}
            </Button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}