import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Target, 
  Ticket, 
  TrendingUp,
  CheckCircle
} from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { StatsCard } from '../../components/dashboard/StatsCard';
import { SalesChart } from '../../components/dashboard/SalesChart';
import { PipelineChart } from '../../components/dashboard/PipelineChart';
import { RecentActivities } from '../../components/dashboard/RecentActivities';
import { TopPerformers } from '../../components/dashboard/TopPerformers';
import { dashboardApi } from '../../api/dashboard';
import { usePolling } from '../../hooks/usePolling';
import type { DashboardData, RawSalesChartData, RawTicketChartData } from '../../types/dashboard';
import { cn } from '../../utils/cn';

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [salesData, setSalesData] = useState<RawSalesChartData | null>(null);
  const [ticketData, setTicketData] = useState<RawTicketChartData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const response = await dashboardApi.getDashboard();
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    }
  };

  const fetchSalesChart = async () => {
    try {
      const response = await dashboardApi.getSalesChart();
      setSalesData(response.data);
    } catch (error) {
      console.error('Failed to fetch sales chart:', error);
    }
  };

  const fetchTicketChart = async () => {
    try {
      const response = await dashboardApi.getTicketChart();
      setTicketData(response.data);
    } catch (error) {
      console.error('Failed to fetch ticket chart:', error);
    } finally {
      setLoading(false);
    }
  };

  usePolling(fetchDashboard, 30000); // Poll every 30 seconds

  useEffect(() => {
    Promise.all([
      fetchDashboard(),
      fetchSalesChart(),
      fetchTicketChart()
    ]);
  }, []);

  if (loading || !data || !salesData || !ticketData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Transform sales data for chart
  const salesChartData = salesData?.data ? {
    labels: salesData.data.map(item => item.month),
    won_deals: salesData.data.map(item => item.won),
    lost_deals: salesData.data.map(item => item.lost),
  } : {
    labels: [],
    won_deals: [],
    lost_deals: [],
  };

  const stats = [
    {
      title: 'Total Contacts',
      value: data.summary.total_contacts,
      change: `+${data.summary.new_contacts_today} today`,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Open Deals',
      value: data.summary.open_deals,
      value2: `$${data.summary.total_pipeline_value.toLocaleString()}`,
      icon: Target,
      color: 'from-purple-500 to-purple-600',
    },
    {
      title: 'Open Tickets',
      value: data.summary.open_tickets,
      warning: data.summary.overdue_tickets > 0 ? `${data.summary.overdue_tickets} overdue` : undefined,
      icon: Ticket,
      color: 'from-orange-500 to-orange-600',
    },
    {
      title: 'Win Rate',
      value: `${data.summary.win_rate}%`,
      icon: TrendingUp,
      color: 'from-green-500 to-green-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-deep-ink">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <StatsCard {...stat} />
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <h2 className="text-lg font-semibold text-deep-ink mb-4">Sales Performance</h2>
          <SalesChart data={salesChartData} />
          <div className="mt-4 flex justify-between text-sm text-gray-600">
            <span>Total Won: ${salesData.totals ? salesData.totals.won.toLocaleString() : 0}</span>
            <span>Total Lost: ${salesData.totals ? salesData.totals.lost.toLocaleString() : 0}</span>
            <span>Net: ${salesData.totals ? salesData.totals.net.toLocaleString(): 0}</span>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="text-lg font-semibold text-deep-ink mb-4">Pipeline Value</h2>
          <PipelineChart data={data.pipeline_value_chart} />
        </GlassCard>
      </div>

      {/* Ticket Volume */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-deep-ink">Ticket Volume (Last {ticketData.days} Days)</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-primary rounded-full mr-2" />
              <span className="text-sm text-gray-600">New</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2" />
              <span className="text-sm text-gray-600">Resolved</span>
            </div>
          </div>
        </div>
        {/* Add your chart component here */}
        <div className="h-64 bg-blue-50/30 rounded-xl flex items-center justify-center">
          <p className="text-gray-500">Ticket volume chart will be displayed here</p>
        </div>
        <div className="mt-4 flex justify-between text-sm text-gray-600">
          <span>Total New: {ticketData.totals.new}</span>
          <span>Total Resolved: {ticketData.totals.resolved}</span>
          <span>Currently Open: {ticketData.totals.open}</span>
        </div>
      </GlassCard>

      {/* Recent Activities & Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold text-deep-ink mb-4">Recent Activities</h2>
            <RecentActivities activities={data.recent_activities} />
          </GlassCard>
        </div>

        <div>
          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold text-deep-ink mb-4">Top Performers</h2>
            <TopPerformers performers={data.top_performers} />
          </GlassCard>
        </div>
      </div>

      {/* Task List */}
      <GlassCard className="p-6">
        <h2 className="text-lg font-semibold text-deep-ink mb-4">Upcoming Tasks</h2>
        <div className="space-y-3">
          {data.task_list.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between p-3 bg-white/50 rounded-xl hover:bg-white/80 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  task.priority === 'high' ? 'bg-red-500' : 'bg-yellow-500'
                )} />
                <div>
                  <p className="font-medium text-deep-ink">{task.description}</p>
                  <p className="text-sm text-gray-600">{task.contact}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  Due {new Date(task.due_date).toLocaleDateString()}
                </span>
                <button className="text-primary hover:text-primary-600">
                  <CheckCircle size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}