import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, XCircle, Copy } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { campaignsApi } from '../../api/campaigns';
import type { CampaignDetailResponse } from '../../types/campaign';
import { formatDate } from '../../utils/formatters';
import { useToast } from '../../hooks/useToast';

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [campaign, setCampaign] = useState<CampaignDetailResponse['data']['campaign'] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchCampaign();
  }, [id]);

  const fetchCampaign = async () => {
    try {
      const response = await campaignsApi.getCampaignById(Number(id));
      setCampaign(response.campaign);
    } catch (error) {
      toast.error('Failed to load campaign');
      navigate('/campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    try {
      await campaignsApi.sendCampaign(Number(id));
      toast.success('Campaign sending started');
      fetchCampaign();
    } catch (error) {
      toast.error('Failed to send campaign');
    }
  };

  const handleCancel = async () => {
    try {
      await campaignsApi.cancelCampaign(Number(id));
      toast.success('Campaign cancelled');
      fetchCampaign();
    } catch (error) {
      toast.error('Failed to cancel campaign');
    }
  };

  const handleDuplicate = async () => {
    try {
      const response = await campaignsApi.duplicateCampaign(Number(id));
      navigate(`/campaigns/${response.data.campaign.id}`);
      toast.success('Campaign duplicated');
    } catch (error) {
      toast.error('Failed to duplicate');
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  if (!campaign) return null;

  const statusColors = {
    draft: 'bg-gray-100 text-gray-800',
    scheduled: 'bg-blue-100 text-blue-800',
    sending: 'bg-yellow-100 text-yellow-800',
    sent: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/campaigns')}>
          <ArrowLeft size={18} className="mr-2" /> Back
        </Button>
        <h1 className="text-3xl font-bold text-deep-ink">Campaign Details</h1>
      </div>

      <GlassCard className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-deep-ink">{campaign.name}</h2>
            <p className="text-gray-600 mt-1">
              Using template: <span className="font-medium">{campaign.template?.name}</span>
            </p>
          </div>
          <div className="flex space-x-2">
            {campaign.status === 'draft' && (
              <Button onClick={handleSend}>
                <Send size={16} className="mr-2" /> Send Now
              </Button>
            )}
            {campaign.status === 'scheduled' && (
              <Button variant="danger" onClick={handleCancel}>
                <XCircle size={16} className="mr-2" /> Cancel
              </Button>
            )}
            <Button variant="outline" onClick={handleDuplicate}>
              <Copy size={16} className="mr-2" /> Duplicate
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="p-3 bg-white/50 rounded-lg">
            <p className="text-xs text-gray-500">Status</p>
            <Badge className={statusColors[campaign.status]}>{campaign.status}</Badge>
          </div>
          <div className="p-3 bg-white/50 rounded-lg">
            <p className="text-xs text-gray-500">Target</p>
            <p className="text-lg font-semibold">{campaign.target_count}</p>
          </div>
          <div className="p-3 bg-white/50 rounded-lg">
            <p className="text-xs text-gray-500">Sent</p>
            <p className="text-lg font-semibold">{campaign.sent_count}</p>
          </div>
          <div className="p-3 bg-white/50 rounded-lg">
            <p className="text-xs text-gray-500">Open Rate</p>
            <p className="text-lg font-semibold">{campaign.open_rate}%</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <p className="text-sm text-gray-500">Scheduled</p>
            <p>{campaign.scheduled_at ? formatDate(campaign.scheduled_at, 'MMM dd, yyyy h:mm a') : 'Not scheduled'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Sent At</p>
            <p>{campaign.sent_at ? formatDate(campaign.sent_at) : 'Not sent'}</p>
          </div>
        </div>

        {campaign.analytics && (
          <div className="mt-6">
            <h3 className="font-medium text-deep-ink mb-3">Performance</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-gray-500">Opens</p>
                <p className="text-xl font-semibold">{campaign.analytics.summary.opens}</p>
                <p className="text-xs text-green-600">{campaign.analytics.rates.open_rate}%</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-gray-500">Clicks</p>
                <p className="text-xl font-semibold">{campaign.analytics.summary.clicks}</p>
                <p className="text-xs text-blue-600">{campaign.analytics.rates.click_rate}%</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="text-xs text-gray-500">CTR</p>
                <p className="text-xl font-semibold">{campaign.analytics.rates.click_to_open_rate}%</p>
              </div>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}