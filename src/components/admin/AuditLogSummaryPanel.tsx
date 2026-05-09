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
import { cn } from '../../utils/cn';

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

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      CREATE: 'bg-emerald-500 dark:bg-emerald-600',
      UPDATE: 'bg-yellow-500 dark:bg-yellow-600',
      DELETE: 'bg-red-500 dark:bg-red-600',
      VIEW: 'bg-green-500 dark:bg-green-600',
      LOGIN: 'bg-purple-500 dark:bg-purple-600',
      LOGOUT: 'bg-orange-500 dark:bg-orange-600',
      EXPORT: 'bg-teal-500 dark:bg-teal-600',
      IMPORT: 'bg-cyan-500 dark:bg-cyan-600',
      IMPERSONATE: 'bg-pink-500 dark:bg-pink-600',
      STOP_IMPERSONATING: 'bg-indigo-500 dark:bg-indigo-600',
    };
    return colors[action] || 'bg-indigo-500';
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--bg-base)] rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-[var(--border-default)]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Audit Log Summary</h2>
              <p className="text-sm text-[var(--text-secondary)]">Last 30 days overview</p>
            </div>
          </div>
          <div className="flex gap-2">
            {data && (
              <button
                onClick={handleExport}
                className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-all duration-200"
                title="Export summary"
              >
                <Download className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)]"></div>
            </div>
          ) : !data ? (
            <div className="text-center py-12">
              <div className="p-4 bg-[var(--bg-subtle)] rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <PieChart className="w-10 h-10 text-[var(--text-tertiary)]" />
              </div>
              <p className="text-[var(--text-primary)] font-medium">No summary data available</p>
              <p className="text-sm text-[var(--text-secondary)] mt-1">Try adjusting your date range</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Overview Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-xl p-5 text-white shadow-lg">
                  <div className="flex items-center justify-between">
                    <Activity className="w-8 h-8 opacity-80" />
                    <TrendingUp className="w-5 h-5 opacity-80" />
                  </div>
                  <p className="text-3xl font-bold mt-3">{data.summary.total_activities.toLocaleString()}</p>
                  <p className="text-sm opacity-90 mt-1">Total Activities</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 rounded-xl p-5 text-white shadow-lg">
                  <div className="flex items-center justify-between">
                    <Users className="w-8 h-8 opacity-80" />
                    <TrendingUp className="w-5 h-5 opacity-80" />
                  </div>
                  <p className="text-3xl font-bold mt-3">{data.summary.unique_users}</p>
                  <p className="text-sm opacity-90 mt-1">Unique Active Users</p>
                </div>
              </div>

              {/* Period Information */}
              <div className="bg-[var(--bg-subtle)] rounded-xl p-4 border border-[var(--border-default)]">
                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <CalendarIcon className="w-4 h-4" />
                  <span>Reporting Period: </span>
                  <strong className="text-[var(--text-primary)]">{new Date(data.period.start_date).toLocaleDateString()}</strong>
                  <span>→</span>
                  <strong className="text-[var(--text-primary)]">{new Date(data.period.end_date).toLocaleDateString()}</strong>
                </div>
              </div>

              {/* By Action */}
              <div>
                <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Activity className="w-3 h-3" />
                  By Action
                </h3>
                <div className="space-y-2">
                  {data.by_action.map(item => {
                    const maxValue = getMaxValue(data.by_action);
                    const percentage = (item.count / maxValue) * 100;
                    const colorClass = getActionColor(item.action);
                    
                    return (
                      <div key={item.action} className="flex items-center gap-3 group">
                        <div className="w-32 text-sm font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
                          {item.action}
                        </div>
                        <div className="flex-1">
                          <div className="h-8 bg-[var(--bg-muted)] rounded-lg overflow-hidden shadow-inner">
                            <div
                              className={cn(
                                "h-full rounded-lg flex items-center justify-end px-3 text-xs text-white font-medium transition-all duration-500",
                                colorClass
                              )}
                              style={{ width: `${percentage}%` }}
                            >
                              {percentage > 15 && item.count.toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="w-20 text-right text-sm font-semibold text-[var(--text-primary)]">
                          {item.count.toLocaleString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* By Entity */}
              <div>
                <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <PieChart className="w-3 h-3" />
                  By Entity Type
                </h3>
                <div className="space-y-2">
                  {data.by_entity.map(item => {
                    const maxValue = getMaxValue(data.by_entity);
                    const percentage = (item.count / maxValue) * 100;
                    return (
                      <div key={item.entity_type} className="flex items-center gap-3 group">
                        <div className="w-32 text-sm font-medium text-[var(--text-secondary)] capitalize group-hover:text-[var(--text-primary)] transition-colors">
                          {item.entity_type.replace(/_/g, ' ')}
                        </div>
                        <div className="flex-1">
                          <div className="h-8 bg-[var(--bg-muted)] rounded-lg overflow-hidden shadow-inner">
                            <div
                              className="h-full bg-cyan-500 dark:bg-cyan-600 rounded-lg flex items-center justify-end px-3 text-xs text-white font-medium transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            >
                              {percentage > 15 && item.count.toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="w-20 text-right text-sm font-semibold text-[var(--text-primary)]">
                          {item.count.toLocaleString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top Users */}
              <div>
                <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Users className="w-3 h-3" />
                  Most Active Users
                </h3>
                <div className="space-y-2">
                  {data.by_user.slice(0, 5).map((item, index) => {
                    const gradients = [
                      'from-emerald-500 to-teal-600',
                      'from-blue-500 to-cyan-600',
                      'from-purple-500 to-pink-600',
                      'from-orange-500 to-red-600',
                      'from-indigo-500 to-purple-600',
                    ];
                    const gradient = gradients[index % gradients.length];
                    
                    return (
                      <div 
                        key={item.user.id} 
                        className="flex items-center justify-between p-3 bg-[var(--bg-subtle)] rounded-xl border border-[var(--border-default)] hover:border-[var(--border-strong)] transition-all duration-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-sm font-medium shadow-sm",
                            gradient
                          )}>
                            {item.user.first_name[0]}{item.user.last_name[0]}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[var(--text-primary)]">
                              {item.user.first_name} {item.user.last_name}
                            </p>
                            <p className="text-xs text-[var(--text-tertiary)]">{item.user.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-[var(--text-primary)]">{item.count.toLocaleString()}</p>
                          <p className="text-xs text-[var(--text-tertiary)]">actions</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Daily Trend */}
              {data.daily_trend && data.daily_trend.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3 flex items-center gap-2">
                    <TrendingUp className="w-3 h-3" />
                    Daily Activity Trend
                  </h3>
                  <div className="bg-[var(--bg-subtle)] rounded-xl p-5 border border-[var(--border-default)]">
                    <div className="flex items-end gap-1 h-32">
                      {data.daily_trend.slice(-14).map((day, idx) => {
                        const maxTrend = Math.max(...data.daily_trend.map(d => d.count));
                        const height = (day.count / maxTrend) * 100;
                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center group">
                            <div className="relative w-full">
                              <div
                                className="w-full bg-[var(--accent)] rounded-t transition-all duration-300 group-hover:bg-[var(--accent-hover)] cursor-pointer"
                                style={{ height: `${Math.max(height, 4)}%`, minHeight: '4px' }}
                              >
                                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-[var(--bg-base)] text-[var(--text-primary)] text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                  {day.count} activities
                                </div>
                              </div>
                            </div>
                            <div className="text-[10px] text-[var(--text-tertiary)] mt-2">
                              {new Date(day.date).getDate()}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-4 pt-3 border-t border-[var(--border-default)] flex justify-center text-xs text-[var(--text-tertiary)]">
                      Last 14 days
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[var(--border-default)] bg-[var(--bg-subtle)] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[var(--bg-base)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-default)] hover:bg-[var(--bg-muted)] transition-all duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuditLogSummaryPanel;