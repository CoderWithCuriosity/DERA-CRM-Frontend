import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Trash2, DollarSign, Calendar } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { dealsApi } from '../../api/deals';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';
import { useCurrency } from '../../hooks/useCurrency';
import type { Deal } from '../../types/deal';

const editDealSchema = z.object({
  name: z.string().min(1, 'Deal name is required'),
  stage: z.enum(['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost']),
  amount: z.number().min(0, 'Amount must be positive'),
  probability: z.number().min(0).max(100),
  expected_close_date: z.string().optional(),
  notes: z.string().optional(),
});

type EditDealFormData = z.infer<typeof editDealSchema>;

const stageOptions = [
  { value: 'lead', label: 'Lead' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
];

export default function EditDeal() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const { formatCurrency } = useCurrency();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<EditDealFormData>({
    resolver: zodResolver(editDealSchema),
  });
  void setValue;

  const selectedStage = watch('stage');
  const selectedAmount = watch('amount') || 0;
  const selectedProbability = watch('probability') || 0;
  const weightedAmount = (selectedAmount * selectedProbability) / 100;

  useEffect(() => {
    if (id) fetchDeal();
  }, [id]);

  const fetchDeal = async () => {
    try {
      const response = await dealsApi.getDealById(Number(id));
      const dealData = response.data.deal;
      setDeal(dealData);
      
      // Reset form with deal data
      reset({
        name: dealData.name,
        stage: dealData.stage,
        amount: dealData.amount,
        probability: dealData.probability,
        expected_close_date: dealData.expected_close_date?.split('T')[0] || '',
        notes: dealData.notes || '',
      });
    } catch (error) {
      toast.error('Failed to load deal');
      navigate('/deals');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: EditDealFormData) => {
    if (!id) return;
    setSaving(true);
    try {
      await dealsApi.updateDeal(Number(id), data);
      toast.success('Deal updated successfully');
      navigate(`/deals/${id}`);
    } catch (error) {
      toast.error('Failed to update deal');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await dealsApi.deleteDeal(Number(id));
      toast.success('Deal deleted successfully');
      navigate('/deals');
    } catch (error) {
      toast.error('Failed to delete deal');
    }
  };

  // Check if user can edit (admin or owner)
  const canEdit = user?.role === 'admin' || user?.id === deal?.user_id;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!deal) return null;

  if (!canEdit) {
    return (
      <GlassCard className="p-6 text-center">
        <h2 className="text-xl font-semibold text-deep-ink mb-2">Access Denied</h2>
        <p className="text-gray-600 mb-4">You don't have permission to edit this deal.</p>
        <Button onClick={() => navigate(`/deals/${id}`)}>
          <ArrowLeft size={18} className="mr-2" /> Back to Deal
        </Button>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/deals/${id}`)}>
            <ArrowLeft size={18} className="mr-2" /> Back to Deal
          </Button>
          <h1 className="text-3xl font-bold text-deep-ink">Edit Deal</h1>
        </div>
        <Button
          variant="danger"
          size="sm"
          onClick={() => setShowDeleteConfirm(true)}
        >
          <Trash2 size={18} className="mr-2" /> Delete Deal
        </Button>
      </div>

      <GlassCard className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Deal Information */}
          <div>
            <h2 className="text-lg font-semibold text-deep-ink mb-4">Deal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Deal Name"
                error={errors.name?.message}
                {...register('name')}
              />

              <Select
                label="Stage"
                error={errors.stage?.message}
                {...register('stage')}
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

              <div className="md:col-span-2">
                <Textarea
                  label="Notes"
                  rows={4}
                  error={errors.notes?.message}
                  {...register('notes')}
                />
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-primary/5 p-4 rounded-lg">
            <h3 className="font-medium text-deep-ink mb-2">Deal Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Contact</p>
                <p className="font-medium">
                  {deal.contact?.first_name} {deal.contact?.last_name}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Stage</p>
                <p className="font-medium capitalize">{selectedStage}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Amount</p>
                <p className="font-medium">{formatCurrency(selectedAmount)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Weighted Amount</p>
                <p className="font-medium text-primary">{formatCurrency(weightedAmount)}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/deals/${id}`)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
            >
              <Save size={18} className="mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </GlassCard>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <GlassCard className="p-6 max-w-md">
            <h3 className="text-xl font-semibold text-deep-ink mb-2">Delete Deal</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete "{deal.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
              >
                Delete
              </Button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}