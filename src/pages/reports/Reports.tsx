import { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Ticket,
  Target,
  RefreshCw,
  PieChart,
  LineChart,
  Activity,
  Landmark,
} from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { dealsApi } from '../../api/deals';
import { ticketsApi } from '../../api/tickets';
import { activitiesApi } from '../../api/activities';
import { contactsApi } from '../../api/contacts';
import { dashboardApi } from '../../api/dashboard';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { useCurrency } from '../../hooks/useCurrency';
import { formatDate } from '../../utils/formatters';

// Types
type PeriodType = 'week' | 'month' | 'quarter' | 'year';
type DashboardPeriod = 'month' | 'quarter' | 'year';

interface SalesDataPoint {
  month: string;
  won: number;
  lost: number;
}

interface SalesData {
  period: string;
  year: number;
  data: SalesDataPoint[];
  totals: {
    won: number;
    lost: number;
    net: number;
  };
}

interface PipelineStageData {
  name: string;
  count: number;
  value: number;
  color: string;
}

interface PipelineStage extends PipelineStageData {
  display_name: string;
  weighted_value: number;
}

interface PipelineTotals {
  total_value: number;
  weighted_value: number;
  open_deals: number;
  won_deals: number;
  lost_deals: number;
  win_rate: number;
}

interface TicketChartDataPoint {
  date: string;
  new: number;
  resolved: number;
}

interface TicketChartData {
  days: number;
  data: TicketChartDataPoint[];
  totals: {
    new: number;
    resolved: number;
    open: number;
  };
}

interface TicketSummary {
  by_status: {
    new?: number;
    open?: number;
    pending?: number;
    resolved?: number;
    closed?: number;
  };
  by_priority: Record<string, number>;
}

interface ActivityItem {
  id: number;
  type: string;
  subject: string;
  status: string;
  created_at: string;
}

export function Reports() {
  const { user } = useAuth();
  const toast = useToast();
  const { formatCurrency } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodType>('month');
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [ticketChartData, setTicketChartData] = useState<TicketChartData | null>(null);
  const [dealStages, setDealStages] = useState<PipelineStage[]>([]);
  const [dealStats, setDealStats] = useState<PipelineTotals | null>(null);
  const [ticketStats, setTicketStats] = useState<TicketSummary | null>(null);
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);

  const fetchReportsData = async () => {
    setLoading(true);
    try {
      // Map period to dashboard period type
      let dashboardPeriod: DashboardPeriod = 'month';
      if (period === 'month') dashboardPeriod = 'month';
      if (period === 'quarter') dashboardPeriod = 'quarter';
      if (period === 'year') dashboardPeriod = 'year';
      
      // Fetch sales chart data
      const salesRes = await dashboardApi.getSalesChart(dashboardPeriod);
      setSalesData(salesRes.data);

      // Fetch real pipeline data from deals API
      const pipelineResponse = await dealsApi.getPipelineSummary();
      if (pipelineResponse.data) {
        const pipeline = pipelineResponse.data;
        
        // Map pipeline stages to our format
        const stagesWithDisplayNames: PipelineStage[] = pipeline.stages.map(stage => ({
          name: stage.name,
          display_name: stage.display_name,
          count: stage.count,
          value: stage.value,
          weighted_value: stage.weighted_value,
          color: stage.color
        }));
        setDealStages(stagesWithDisplayNames);
        
        // Set deal stats from pipeline data
        setDealStats({
          total_value: pipeline.totals.total_value,
          weighted_value: pipeline.totals.weighted_value,
          open_deals: pipeline.totals.open_deals,
          won_deals: pipeline.totals.won_deals,
          lost_deals: pipeline.totals.lost_deals,
          win_rate: pipeline.totals.win_rate
        });
      }

      // Fetch ticket chart data
      const ticketChartRes = await dashboardApi.getTicketChart(30);
      setTicketChartData(ticketChartRes.data);

      // Fetch ticket summary
      const ticketsRes = await ticketsApi.getTickets({ limit: 1 });
      if (ticketsRes.data.summary) {
        setTicketStats(ticketsRes.data.summary as TicketSummary);
      }

      // Fetch recent activities
      const activitiesRes = await activitiesApi.getActivities({ limit: 10 });
      if (activitiesRes.data.data) {
        setRecentActivities(activitiesRes.data.data);
      }

    } catch (error) {
      console.error('Failed to fetch reports data:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, [period]);

  const getMaxSalesValue = (): number => {
    if (!salesData?.data) return 100;
    const allValues = salesData.data.flatMap(d => [d.won, d.lost]);
    return Math.max(...allValues, 100);
  };

  const getTicketChartMax = (): number => {
    if (!ticketChartData?.data) return 20;
    const allValues = ticketChartData.data.flatMap(d => [d.new, d.resolved]);
    return Math.max(...allValues, 20);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const totalOpenTickets = (ticketStats?.by_status?.new || 0) + 
    (ticketStats?.by_status?.open || 0) + 
    (ticketStats?.by_status?.pending || 0);

  // Format currency for display in chart labels
  const formatChartCurrency = (value: number): string => {
    return formatCurrency(value / 1000).replace(/\.0$/, '') + 'k';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-deep-ink">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Track your business performance</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as PeriodType)}
            className="px-3 py-2 bg-white/70 border border-blue-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="week">Last 7 days</option>
            <option value="month">Last 30 days</option>
            <option value="quarter">Last 90 days</option>
            <option value="year">Last 12 months</option>
          </select>
          <Button variant="outline" onClick={fetchReportsData}>
            <RefreshCw size={18} className="mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Pipeline Value</p>
              <p className="text-2xl font-bold text-deep-ink">
                {formatCurrency(dealStats?.total_value || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Weighted: {formatCurrency(dealStats?.weighted_value || 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Landmark size={24} className="text-primary" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Win Rate</p>
              <p className="text-2xl font-bold text-green-600">
                {dealStats?.win_rate?.toFixed(1) || 0}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Won: {dealStats?.won_deals || 0} | Lost: {dealStats?.lost_deals || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <TrendingUp size={24} className="text-green-600" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Open Tickets</p>
              <p className="text-2xl font-bold text-orange-600">
                {totalOpenTickets}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                New: {ticketStats?.by_status?.new || 0} | Open: {ticketStats?.by_status?.open || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Ticket size={24} className="text-orange-600" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Deals</p>
              <p className="text-2xl font-bold text-primary">
                {dealStats?.open_deals || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Avg deal size: {formatCurrency((dealStats?.total_value || 0) / (dealStats?.open_deals || 1))}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Target size={24} className="text-blue-600" />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Sales Chart */}
      {salesData && salesData.data && salesData.data.length > 0 && (
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-deep-ink flex items-center">
                <BarChart3 size={20} className="mr-2 text-primary" />
                Sales Performance
              </h2>
              <p className="text-sm text-gray-500">Won vs Lost deals over time</p>
            </div>
            <Badge variant="info" size="sm">
              {period === 'month' ? 'Last 12 Months' : period === 'year' ? 'Last 5 Years' : 'Selected Period'}
            </Badge>
          </div>
          <div className="mt-4">
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-xs text-gray-600">Won Deals</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-xs text-gray-600">Lost Deals</span>
              </div>
            </div>
            <div className="space-y-3">
              {salesData.data.map((item, index) => {
                const maxValue = getMaxSalesValue();
                const wonHeight = (item.won / maxValue) * 100;
                const lostHeight = (item.lost / maxValue) * 100;
                return (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="w-16 text-sm text-gray-600">{item.month}</div>
                    <div className="flex-1 space-y-1">
                      <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                        <div 
                          className="absolute left-0 top-0 h-full bg-green-500 rounded-l-lg transition-all duration-500"
                          style={{ width: `${wonHeight}%` }}
                        />
                        <div 
                          className="absolute left-0 top-0 h-full bg-red-500 rounded-l-lg transition-all duration-500"
                          style={{ width: `${lostHeight}%`, marginLeft: `${wonHeight}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-green-600">{formatChartCurrency(item.won)}</span>
                        <span className="text-red-600">{formatChartCurrency(item.lost)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Won:</span>
              <span className="font-semibold text-green-600">{formatCurrency(salesData.totals?.won || 0)}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-600">Total Lost:</span>
              <span className="font-semibold text-red-600">{formatCurrency(salesData.totals?.lost || 0)}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-600">Net:</span>
              <span className="font-semibold text-primary">{formatCurrency(salesData.totals?.net || 0)}</span>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Pipeline and Tickets Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Stages - Now using real deal data */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-deep-ink flex items-center">
                <PieChart size={20} className="mr-2 text-primary" />
                Pipeline Stages
              </h2>
              <p className="text-sm text-gray-500">Deals by stage from your actual pipeline</p>
            </div>
          </div>
          <div className="space-y-4">
            {dealStages.length > 0 ? (
              dealStages.map((stage) => (
                <div key={stage.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{stage.display_name}</span>
                    <span className="font-medium text-deep-ink">
                      {stage.count} deals • {formatCurrency(stage.value)}
                    </span>
                  </div>
                  <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${(stage.value / (dealStats?.total_value || 1)) * 100}%`,
                        backgroundColor: stage.color 
                      }}
                    />
                  </div>
                  {stage.weighted_value > 0 && (
                    <p className="text-xs text-gray-400 mt-1">
                      Weighted: {formatCurrency(stage.weighted_value)}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No pipeline data available</p>
            )}
            {dealStats && (
              <div className="pt-4 border-t border-blue-100">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Pipeline</span>
                  <span className="font-bold text-primary">{formatCurrency(dealStats.total_value)}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-600">Weighted Value</span>
                  <span className="font-medium text-deep-ink">{formatCurrency(dealStats.weighted_value)}</span>
                </div>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Ticket Status Distribution */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-deep-ink flex items-center">
                <Ticket size={20} className="mr-2 text-primary" />
                Ticket Status
              </h2>
              <p className="text-sm text-gray-500">Current ticket distribution</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-xl">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <span className="text-blue-600 font-bold">N</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{ticketStats?.by_status?.new || 0}</p>
              <p className="text-xs text-gray-500">New</p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-xl">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <span className="text-orange-600 font-bold">O</span>
              </div>
              <p className="text-2xl font-bold text-orange-600">{ticketStats?.by_status?.open || 0}</p>
              <p className="text-xs text-gray-500">Open</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-xl">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <span className="text-purple-600 font-bold">P</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">{ticketStats?.by_status?.pending || 0}</p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-xl">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <span className="text-green-600 font-bold">R</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{ticketStats?.by_status?.resolved || 0}</p>
              <p className="text-xs text-gray-500">Resolved</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Ticket Volume Chart */}
      {ticketChartData && ticketChartData.data && ticketChartData.data.length > 0 && (
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-deep-ink flex items-center">
                <LineChart size={20} className="mr-2 text-primary" />
                Ticket Volume
              </h2>
              <p className="text-sm text-gray-500">New vs Resolved tickets over time</p>
            </div>
          </div>
          <div className="space-y-4">
            {ticketChartData.data.slice(-14).map((item, index) => {
              const maxValue = getTicketChartMax();
              const newHeight = (item.new / maxValue) * 100;
              const resolvedHeight = (item.resolved / maxValue) * 100;
              return (
                <div key={index} className="flex items-center space-x-4">
                  <div className="w-24 text-xs text-gray-500">{item.date}</div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 relative h-6 bg-gray-100 rounded-lg overflow-hidden">
                        <div 
                          className="absolute left-0 top-0 h-full bg-blue-500 transition-all duration-500"
                          style={{ width: `${newHeight}%` }}
                        />
                        <div 
                          className="absolute left-0 top-0 h-full bg-green-500 transition-all duration-500"
                          style={{ 
                            width: `${resolvedHeight}%`,
                            marginLeft: `${newHeight}%`
                          }}
                        />
                      </div>
                      <div className="flex items-center space-x-2 text-xs">
                        <span className="text-blue-600">{item.new}</span>
                        <span className="text-gray-300">|</span>
                        <span className="text-green-600">{item.resolved}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-center space-x-4 mt-4 pt-4 border-t border-blue-100">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-xs text-gray-600">New Tickets</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-xs text-gray-600">Resolved Tickets</span>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Recent Activities */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-deep-ink flex items-center">
              <Activity size={20} className="mr-2 text-primary" />
              Recent Activities
            </h2>
            <p className="text-sm text-gray-500">Latest actions across the system</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => window.location.href = '/activities'}>
            View All
          </Button>
        </div>
        <div className="space-y-3">
          {recentActivities.length > 0 ? (
            recentActivities.slice(0, 5).map((activity) => {
              let iconBg = 'bg-gray-100';
              let iconColor = 'text-gray-600';
              
              if (activity.type === 'call') {
                iconBg = 'bg-green-100';
                iconColor = 'text-green-600';
              } else if (activity.type === 'email') {
                iconBg = 'bg-blue-100';
                iconColor = 'text-blue-600';
              } else if (activity.type === 'meeting') {
                iconBg = 'bg-purple-100';
                iconColor = 'text-purple-600';
              } else if (activity.type === 'task') {
                iconBg = 'bg-orange-100';
                iconColor = 'text-orange-600';
              }
              
              return (
                <div key={activity.id} className="flex items-center space-x-3 p-3 unded-lg">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
                    <Activity size={18} className={iconColor} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-deep-ink">{activity.subject}</p>
                    <p className="text-xs text-gray-500">
                      {activity.type} • {formatDate(activity.created_at)}
                    </p>
                  </div>
                  <Badge variant={activity.status === 'completed' ? 'success' : 'default'} size="sm">
                    {activity.status}
                  </Badge>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Activity size={32} className="mx-auto mb-2 opacity-50" />
              <p>No recent activities</p>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}