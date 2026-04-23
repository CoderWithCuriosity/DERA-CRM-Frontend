import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Mail, BarChart2, AlertCircle, FileText, Calendar } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { campaignsApi } from '../../api/campaigns';
import type { Campaign, CampaignStatus } from '../../types/campaign';
import { formatDate } from '../../utils/formatters';

export default function Campaigns() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await campaignsApi.getCampaigns();
      setCampaigns(response?.data?.data || []);
    } catch (error) {
      console.error('Failed to load campaigns:', error);
      setError('Failed to load campaigns. Please try again.');
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  const statusColors: Record<CampaignStatus, string> = {
    draft: 'bg-gray-100 text-gray-800',
    scheduled: 'bg-blue-100 text-blue-800',
    sending: 'bg-yellow-100 text-yellow-800',
    sent: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  const getStatusBadgeVariant = (status: CampaignStatus): 'default' | 'success' | 'danger' | 'warning' => {
    switch (status) {
      case 'sent':
        return 'success';
      case 'cancelled':
        return 'danger';
      case 'sending':
        return 'warning';
      case 'scheduled':
        return 'warning';
      default:
        return 'default';
    }
  };

  void getStatusBadgeVariant;

  const calculateStats = (campaign: Campaign) => {
    const sentCount = campaign?.sent_count || 0;
    const targetCount = campaign?.target_count || 0;
    const openRate = campaign?.open_rate || 0;
    const clickRate = campaign?.click_rate || 0;
    const clickToOpenRate = campaign?.click_to_open_rate || 0;

    return {
      sentCount,
      targetCount,
      openRate,
      clickRate,
      clickToOpenRate,
      progress: targetCount > 0 ? Math.round((sentCount / targetCount) * 100) : 0
    };
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center py-12">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4" />
            <p className="text-gray-500">Loading campaigns...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle size={48} className="text-red-400 mb-4" />
          <p className="text-red-600 mb-2">{error}</p>
          <Button variant="outline" onClick={fetchCampaigns}>
            Try Again
          </Button>
        </div>
      );
    }

    if (!campaigns || campaigns.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="bg-gray-50 rounded-full p-4 mb-4">
            <Mail size={48} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns yet</h3>
          <p className="text-gray-500 mb-6 text-center max-w-sm">
            Get started by creating your first email campaign. You can choose a template or start from scratch.
          </p>
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
            <Button onClick={() => navigate('/campaigns/new')}>
              <Plus size={18} className="mr-2" /> Create Campaign
            </Button>
            <Button variant="outline" onClick={() => navigate('/campaigns/templates')}>
              <FileText size={18} className="mr-2" /> Browse Templates
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="grid gap-4">
        {campaigns.map((campaign, idx) => {
          const stats = calculateStats(campaign);
          const campaignStatus = campaign?.status || 'draft';
          const statusColor = statusColors[campaignStatus] || 'bg-gray-100 text-gray-800';
          
          return (
            <motion.div
              key={campaign?.id || idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <GlassCard 
                className="p-4 cursor-pointer hover:shadow-md transition-shadow" 
                onClick={() => campaign?.id && navigate(`/campaigns/${campaign.id}`)}
              >
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-deep-ink">
                        {campaign?.name || 'Untitled Campaign'}
                      </h3>
                      {campaignStatus === 'scheduled' && campaign?.scheduled_at && (
                        <Badge size="sm" variant="warning" className="flex items-center">
                          <Calendar size={12} className="mr-1" />
                          {formatDate(campaign.scheduled_at, 'MMM dd, yyyy')}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                      {campaign?.template && (
                        <p className="text-sm text-gray-600">
                          Template: <span className="font-medium">{campaign.template.name}</span>
                          <span className="text-gray-400 ml-1">({campaign.template.subject})</span>
                        </p>
                      )}
                      
                      <p className="text-sm text-gray-500">
                        Created {campaign?.created_at ? formatDate(campaign.created_at) : 'Unknown date'}
                      </p>

                      {campaign?.sent_at && (
                        <p className="text-sm text-gray-500">
                          Sent {formatDate(campaign.sent_at)}
                        </p>
                      )}
                    </div>

                    {/* Progress bar for sending campaigns */}
                    {campaignStatus === 'sending' && stats.targetCount > 0 && (
                      <div className="mt-3 max-w-md">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-600">Progress</span>
                          <span className="text-gray-600">{stats.progress}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full transition-all duration-500"
                            style={{ width: `${stats.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-4 lg:space-x-6">
                    {/* Stats */}
                    <div className="text-right">
                      <div className="flex items-center space-x-4">
                        <div>
                          <p className="text-sm font-medium">{stats.openRate}%</p>
                          <p className="text-xs text-gray-500">Opens</p>
                          <p className="text-xs text-gray-400">{campaign.open_count || 0}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{stats.clickRate}%</p>
                          <p className="text-xs text-gray-500">Clicks</p>
                          <p className="text-xs text-gray-400">{campaign.click_count || 0}</p>
                        </div>
                        {stats.clickToOpenRate > 0 && (
                          <div className="hidden md:block">
                            <p className="text-sm font-medium">{stats.clickToOpenRate}%</p>
                            <p className="text-xs text-gray-500">CTOR</p>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {stats.sentCount.toLocaleString()} / {stats.targetCount.toLocaleString()} sent
                      </p>
                    </div>

                    {/* Status Badge */}
                    <Badge className={statusColor}>
                      {campaignStatus}
                    </Badge>

                    {/* Chart Icon */}
                    <BarChart2 
                      size={20} 
                      className="text-gray-400 hidden sm:block" 
                    />
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-deep-ink">Email Campaigns</h1>
          <p className="text-gray-600 mt-1">Create and manage your email marketing</p>
        </div>
        
        <div className="flex space-x-3 w-full sm:w-auto">
          <Button 
            variant="outline" 
            onClick={() => navigate('/campaigns/templates')}
            className="flex-1 sm:flex-none"
          >
            <Mail size={18} className="mr-2" /> Templates
          </Button>
          <Button 
            onClick={() => navigate('/campaigns/new')}
            className="flex-1 sm:flex-none"
          >
            <Plus size={18} className="mr-2" /> New Campaign
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {!loading && !error && campaigns.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <GlassCard className="p-4">
            <p className="text-sm text-gray-600">Total Campaigns</p>
            <p className="text-2xl font-bold text-deep-ink">{campaigns.length}</p>
          </GlassCard>
          <GlassCard className="p-4">
            <p className="text-sm text-gray-600">Active Campaigns</p>
            <p className="text-2xl font-bold text-deep-ink">
              {campaigns.filter(c => c.status === 'sending' || c.status === 'scheduled').length}
            </p>
          </GlassCard>
          <GlassCard className="p-4">
            <p className="text-sm text-gray-600">Total Sent</p>
            <p className="text-2xl font-bold text-deep-ink">
              {campaigns.reduce((acc, c) => acc + (c.sent_count || 0), 0).toLocaleString()}
            </p>
          </GlassCard>
          <GlassCard className="p-4">
            <p className="text-sm text-gray-600">Avg. Open Rate</p>
            <p className="text-2xl font-bold text-deep-ink">
              {campaigns.length > 0 
                ? Math.round(campaigns.reduce((acc, c) => acc + (c.open_rate || 0), 0) / campaigns.length) 
                : 0}%
            </p>
          </GlassCard>
        </div>
      )}

      {renderContent()}
    </div>
  );
}