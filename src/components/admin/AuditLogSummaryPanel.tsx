import React from 'react';
import {
  X,
  BarChart3,
  Users,
  Activity,
  Calendar as CalendarIcon,
  TrendingUp,
  PieChart,
  Download,
} from 'lucide-react';
import type { AuditLogSummary } from '../../types/admin';

interface Props {
  data: AuditLogSummary | null;
  loading: boolean;
  onClose: () => void;
}

const AuditLogSummaryPanel: React.FC<Props> = ({ data, loading, onClose }) => {
  const handleExport = () => {
    if (!data) return;
    const csv = [
      ['Action', 'Count'].join(','),
      ...data.by_action.map(item => [item.action, item.count].join(',')),
      ['', ''],
      ['Entity Type', 'Count'].join(','),
      ...data.by_entity.map(item => [item.entity_type, item.count].join(',')),
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-summary-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getMaxValue = (items: Array<{ count: number }>) => {
    return Math.max(...items.map(i => i.count), 1);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Audit Log Summary</h2>
              <p className="text-sm text-gray-500">Last 30 days overview</p>
            </div>
          </div>
          <div className="flex gap-2">
            {data && (
              <button
                onClick={handleExport}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Export summary"
              >
                <Download className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : !data ? (
            <div className="text-center py-12">
              <PieChart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No summary data available</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Overview Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white">
                  <div className="flex items-center justify-between">
                    <Activity className="w-8 h-8 opacity-80" />
                    <TrendingUp className="w-5 h-5 opacity-80" />
                  </div>
                  <p className="text-3xl font-bold mt-3">{data.summary.total_activities.toLocaleString()}</p>
                  <p className="text-sm opacity-90 mt-1">Total Activities</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white">
                  <div className="flex items-center justify-between">
                    <Users className="w-8 h-8 opacity-80" />
                    <TrendingUp className="w-5 h-5 opacity-80" />
                  </div>
                  <p className="text-3xl font-bold mt-3">{data.summary.unique_users}</p>
                  <p className="text-sm opacity-90 mt-1">Unique Active Users</p>
                </div>
              </div>

              {/* Period Information */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CalendarIcon className="w-4 h-4" />
                  <span>Reporting Period: </span>
                  <strong>{new Date(data.period.start_date).toLocaleDateString()}</strong>
                  <span>→</span>
                  <strong>{new Date(data.period.end_date).toLocaleDateString()}</strong>
                </div>
              </div>

              {/* By Action */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
                  By Action
                </h3>
                <div className="space-y-2">
                  {data.by_action.map(item => {
                    const maxValue = getMaxValue(data.by_action);
                    const percentage = (item.count / maxValue) * 100;
                    const color = 
                      item.action === 'CREATE' ? 'bg-emerald-500' :
                      item.action === 'UPDATE' ? 'bg-blue-500' :
                      item.action === 'DELETE' ? 'bg-red-500' :
                      item.action === 'VIEW' ? 'bg-gray-500' :
                      item.action === 'LOGIN' ? 'bg-purple-500' :
                      'bg-indigo-500';
                    
                    return (
                      <div key={item.action} className="flex items-center gap-3">
                        <div className="w-32 text-sm text-gray-600">{item.action}</div>
                        <div className="flex-1">
                          <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                            <div
                              className={`h-full ${color} rounded-lg flex items-center justify-end px-3 text-xs text-white font-medium`}
                              style={{ width: `${percentage}%` }}
                            >
                              {percentage > 15 && item.count}
                            </div>
                          </div>
                        </div>
                        <div className="w-20 text-right text-sm font-medium text-gray-900">
                          {item.count.toLocaleString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* By Entity */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
                  By Entity Type
                </h3>
                <div className="space-y-2">
                  {data.by_entity.map(item => {
                    const maxValue = getMaxValue(data.by_entity);
                    const percentage = (item.count / maxValue) * 100;
                    return (
                      <div key={item.entity_type} className="flex items-center gap-3">
                        <div className="w-32 text-sm text-gray-600 capitalize">{item.entity_type}</div>
                        <div className="flex-1">
                          <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                            <div
                              className="h-full bg-cyan-500 rounded-lg flex items-center justify-end px-3 text-xs text-white font-medium"
                              style={{ width: `${percentage}%` }}
                            >
                              {percentage > 15 && item.count}
                            </div>
                          </div>
                        </div>
                        <div className="w-20 text-right text-sm font-medium text-gray-900">
                          {item.count.toLocaleString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top Users */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
                  Most Active Users
                </h3>
                <div className="space-y-2">
                  {data.by_user.slice(0, 5).map(item => (
                    <div key={item.user.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white text-xs font-medium">
                          {item.user.first_name[0]}{item.user.last_name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {item.user.first_name} {item.user.last_name}
                          </p>
                          <p className="text-xs text-gray-500">{item.user.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">{item.count}</p>
                        <p className="text-xs text-gray-500">actions</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Daily Trend */}
              {data.daily_trend && data.daily_trend.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
                    Daily Activity Trend
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-end gap-1 h-32">
                      {data.daily_trend.slice(-14).map((day, idx) => {
                        const maxTrend = Math.max(...data.daily_trend.map(d => d.count));
                        const height = (day.count / maxTrend) * 100;
                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center">
                            <div
                              className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                              style={{ height: `${height}%` }}
                            >
                              <div className="text-center text-xs text-white -mt-5 opacity-0 hover:opacity-100 transition-opacity">
                                {day.count}
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-top-left">
                              {new Date(day.date).getDate()}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuditLogSummaryPanel;