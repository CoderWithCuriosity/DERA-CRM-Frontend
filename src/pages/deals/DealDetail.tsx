import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { dealsApi } from '../../api/deals';
import type { DealDetailResponse } from '../../types/deal';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useToast } from '../../hooks/useToast';

export default function DealDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [deal, setDeal] = useState<DealDetailResponse['data']['deal'] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchDeal();
  }, [id]);

  const fetchDeal = async () => {
    try {
      const response = await dealsApi.getDealById(Number(id));
      setDeal(response.deal);
    } catch (error) {
      toast.error('Failed to load deal');
      navigate('/deals');
    } finally {
      setLoading(false);
    }
  };

  const handleWin = async () => {
    try {
      await dealsApi.markAsWon(Number(id), { actual_close_date: new Date().toISOString() });
      toast.success('Deal marked as won');
      fetchDeal();
    } catch (error) {
      toast.error('Failed to update deal');
    }
  };

  const handleLost = async () => {
    const reason = prompt('Enter loss reason (optional)');
    try {
      await dealsApi.markAsLost(Number(id), {
        actual_close_date: new Date().toISOString(),
        loss_reason: reason || undefined,
      });
      toast.success('Deal marked as lost');
      fetchDeal();
    } catch (error) {
      toast.error('Failed to update deal');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this deal?')) return;
    try {
      await dealsApi.deleteDeal(Number(id));
      toast.success('Deal deleted');
      navigate('/deals');
    } catch (error) {
      toast.error('Failed to delete deal');
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  if (!deal) return null;

  const stageColors = {
    lead: 'bg-blue-100 text-blue-800',
    qualified: 'bg-purple-100 text-purple-800',
    proposal: 'bg-yellow-100 text-yellow-800',
    negotiation: 'bg-orange-100 text-orange-800',
    won: 'bg-green-100 text-green-800',
    lost: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/deals')}>
          <ArrowLeft size={18} className="mr-2" /> Back
        </Button>
        <h1 className="text-3xl font-bold text-deep-ink">Deal Details</h1>
      </div>

      <GlassCard className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-deep-ink">{deal.name}</h2>
            <p className="text-gray-600 mt-1">
              {deal.contact.first_name} {deal.contact.last_name} · {deal.contact.company}
            </p>
          </div>
          <div className="flex space-x-2">
            {deal.status === 'open' && (
              <>
                <Button variant="success" size="sm" onClick={handleWin}>
                  <CheckCircle size={16} className="mr-2" /> Won
                </Button>
                <Button variant="danger" size="sm" onClick={handleLost}>
                  <XCircle size={16} className="mr-2" /> Lost
                </Button>
              </>
            )}
            <Button variant="outline" size="sm">
              <Edit size={16} className="mr-2" /> Edit
            </Button>
            <Button variant="danger" size="sm" onClick={handleDelete}>
              <Trash2 size={16} className="mr-2" /> Delete
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="p-4 bg-white/50 rounded-lg">
            <p className="text-sm text-gray-500">Stage</p>
            <Badge className={stageColors[deal.stage]}>{deal.stage}</Badge>
          </div>
          <div className="p-4 bg-white/50 rounded-lg">
            <p className="text-sm text-gray-500">Amount</p>
            <p className="text-xl font-semibold text-deep-ink">{formatCurrency(deal.amount)}</p>
          </div>
          <div className="p-4 bg-white/50 rounded-lg">
            <p className="text-sm text-gray-500">Probability</p>
            <p className="text-xl font-semibold text-deep-ink">{deal.probability}%</p>
          </div>
          <div className="p-4 bg-white/50 rounded-lg">
            <p className="text-sm text-gray-500">Weighted</p>
            <p className="text-xl font-semibold text-deep-ink">{formatCurrency(deal.weighted_amount)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <p className="text-sm text-gray-500">Expected Close</p>
            <p>{deal.expected_close_date ? formatDate(deal.expected_close_date) : 'Not set'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Actual Close</p>
            <p>{deal.actual_close_date ? formatDate(deal.actual_close_date) : 'Not closed'}</p>
          </div>
        </div>

        {deal.notes && (
          <div className="mt-4 p-4 bg-white/50 rounded-lg">
            <p className="text-sm text-gray-500">Notes</p>
            <p className="mt-1">{deal.notes}</p>
          </div>
        )}

        <div className="mt-6">
          <h3 className="font-medium text-deep-ink mb-3">Activities</h3>
          {deal.activities?.length ? (
            <div className="space-y-2">
              {deal.activities.map(act => (
                <div key={act.id} className="flex justify-between p-2 bg-white/50 rounded">
                  <span>{act.subject}</span>
                  <span className="text-sm text-gray-500">{formatDate(act.scheduled_date)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No activities.</p>
          )}
        </div>
      </GlassCard>
    </div>
  );
}