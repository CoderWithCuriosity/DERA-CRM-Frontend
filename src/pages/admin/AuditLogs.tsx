import React, { useState, useEffect } from 'react';
import {
  Filter,
  Users as UsersIcon,
  Activity,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  BarChart3,
  Clock,
  Database,
  AlertCircle,
} from 'lucide-react';
import { adminApi } from '../../api/admin';
import { parseAuditDetails, getActionIconComponent, getActionColorClass, getEntityIconComponent, getEntityColorClass, getEntityBgColorClass, getEntityDisplayName, getDisplaySummary } from '../../utils/auditHelpers';
import type { 
  AuditLogListItem, 
  AuditLogDetail, 
  AuditLogFilters 
} from '../../types/admin';
import AuditLogDetailModal from '../../components/admin/AuditLogDetailModal';
import AuditLogSummaryPanel from '../../components/admin/AuditLogSummaryPanel';
import { cn } from '../../utils/cn';

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AuditLogFilters>({
    page: 1,
    limit: 50,
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 50,
    pages: 0,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLogDetail | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showSummaryPanel, setShowSummaryPanel] = useState(false);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Filter options
  const [availableUsers, setAvailableUsers] = useState<Array<{ id: number; name: string }>>([]);
  const [tempFilters, setTempFilters] = useState({
    user_id: '',
    action: '',
    entity_type: '',
    date_from: '',
    date_to: '',
  });

  const actionTypes = [
    'CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN', 'LOGOUT', 
    'EXPORT', 'IMPORT', 'IMPERSONATE', 'STOP_IMPERSONATING'
  ];

  const entityTypes = [
    'contact', 'deal', 'ticket', 'activity', 'campaign', 
    'user', 'organization', 'email_template', 'campaign_recipient', 'backup'
  ];

  useEffect(() => {
    fetchAuditLogs();
    fetchUsers();
  }, [filters]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getAuditLogs(filters);
      if (response.success) {
        setLogs(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setAvailableUsers(data.data.map((user: any) => ({
          id: user.id,
          name: `${user.first_name} ${user.last_name}`
        })));
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleApplyFilters = () => {
    const newFilters: AuditLogFilters = {
      page: 1,
      limit: filters.limit,
    };
    if (tempFilters.user_id) newFilters.user_id = parseInt(tempFilters.user_id);
    if (tempFilters.action) newFilters.action = tempFilters.action;
    if (tempFilters.entity_type) newFilters.entity_type = tempFilters.entity_type;
    if (tempFilters.date_from) newFilters.date_from = tempFilters.date_from;
    if (tempFilters.date_to) newFilters.date_to = tempFilters.date_to;
    setFilters(newFilters);
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setTempFilters({
      user_id: '',
      action: '',
      entity_type: '',
      date_from: '',
      date_to: '',
    });
    setFilters({ page: 1, limit: 50 });
    setShowFilters(false);
  };

  const handlePageChange = (newPage: number) => {
    setFilters({ ...filters, page: newPage });
  };

  const handleViewDetails = async (log: AuditLogListItem) => {
    try {
      const response = await adminApi.getAuditLogDetail(log.id);
      if (response.success) {
        setSelectedLog(response.data);
        setShowDetailModal(true);
      }
    } catch (error) {
      console.error('Failed to fetch log details:', error);
    }
  };

  const handleViewSummary = async () => {
    setShowSummaryPanel(true);
    setLoadingSummary(true);
    try {
      const response = await adminApi.getAuditLogSummary(30);
      if (response.success) {
        setSummaryData(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    } finally {
      setLoadingSummary(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">Audit Logs</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Track all user activities and system changes
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleViewSummary}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-all duration-200 shadow-sm"
          >
            <BarChart3 className="w-4 h-4" />
            Summary
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200",
              showFilters 
                ? "bg-[var(--accent)] text-white" 
                : "bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-default)]"
            )}
          >
            <Filter className="w-4 h-4" />
            Filters
            {(filters.user_id || filters.action || filters.entity_type || filters.date_from || filters.date_to) && (
              <span className="ml-1 w-2 h-2 bg-[var(--accent)] rounded-full animate-pulse"></span>
            )}
          </button>
          <button
            onClick={fetchAuditLogs}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-default)] transition-all duration-200"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-[var(--bg-base)] rounded-xl border border-[var(--border-default)] p-5 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-[var(--text-primary)]">Filter Audit Logs</h3>
            <button 
              onClick={() => setShowFilters(false)} 
              className="p-1 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                User
              </label>
              <select
                value={tempFilters.user_id}
                onChange={(e) => setTempFilters({ ...tempFilters, user_id: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] transition-all"
              >
                <option value="">All Users</option>
                {availableUsers.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                Action
              </label>
              <select
                value={tempFilters.action}
                onChange={(e) => setTempFilters({ ...tempFilters, action: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] transition-all"
              >
                <option value="">All Actions</option>
                {actionTypes.map(action => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                Entity Type
              </label>
              <select
                value={tempFilters.entity_type}
                onChange={(e) => setTempFilters({ ...tempFilters, entity_type: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] transition-all"
              >
                <option value="">All Entities</option>
                {entityTypes.map(type => (
                  <option key={type} value={type}>{getEntityDisplayName(type)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                Date From
              </label>
              <input
                type="date"
                value={tempFilters.date_from}
                onChange={(e) => setTempFilters({ ...tempFilters, date_from: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                Date To
              </label>
              <input
                type="date"
                value={tempFilters.date_to}
                onChange={(e) => setTempFilters({ ...tempFilters, date_to: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] transition-all"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-[var(--border-default)]">
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
            >
              Clear All
            </button>
            <button
              onClick={handleApplyFilters}
              className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-all duration-200 shadow-sm"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[var(--bg-base)] rounded-xl border border-[var(--border-default)] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Total Activities</p>
              <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{pagination.total.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-lg bg-[var(--bg-subtle)]">
              <Activity className="w-6 h-6 text-[var(--text-tertiary)]" />
            </div>
          </div>
        </div>
        <div className="bg-[var(--bg-base)] rounded-xl border border-[var(--border-default)] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Current Page</p>
              <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">
                {pagination.page} / {pagination.pages || 1}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-[var(--bg-subtle)]">
              <Eye className="w-6 h-6 text-[var(--text-tertiary)]" />
            </div>
          </div>
        </div>
        <div className="bg-[var(--bg-base)] rounded-xl border border-[var(--border-default)] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Items Per Page</p>
              <select
                value={filters.limit}
                onChange={(e) => setFilters({ ...filters, limit: parseInt(e.target.value), page: 1 })}
                className="mt-1 text-lg font-semibold text-[var(--text-primary)] bg-transparent border border-[var(--border-default)] rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]"
              >
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="p-3 rounded-lg bg-[var(--bg-subtle)]">
              <Database className="w-6 h-6 text-[var(--text-tertiary)]" />
            </div>
          </div>
        </div>
        <div className="bg-[var(--bg-base)] rounded-xl border border-[var(--border-default)] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Unique Users</p>
              <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">
                {new Set(logs.map(l => l.user_id)).size}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-[var(--bg-subtle)]">
              <UsersIcon className="w-6 h-6 text-[var(--text-tertiary)]" />
            </div>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-[var(--bg-base)] rounded-xl border border-[var(--border-default)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--bg-subtle)] border-b border-[var(--border-default)]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                  Entity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                  Summary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                  IP Address
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-default)]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)]"></div>
                    </div>
                    <p className="mt-2 text-[var(--text-secondary)]">Loading audit logs...</p>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <AlertCircle className="w-12 h-12 text-[var(--text-tertiary)] mx-auto mb-3" />
                    <p className="text-[var(--text-primary)] font-medium">No audit logs found</p>
                    <p className="text-sm text-[var(--text-tertiary)] mt-1">Try adjusting your filters</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const details = parseAuditDetails(log.details);
                  const summary = getDisplaySummary(details, log.details);
                  const ActionIcon = getActionIconComponent(log.action);
                  const EntityIcon = getEntityIconComponent(log.entity_type);
                  
                  return (
                    <tr key={log.id} className="hover:bg-[var(--bg-subtle)] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-[var(--text-tertiary)]" />
                          <span className="text-sm text-[var(--text-primary)]" title={formatDate(log.created_at)}>
                            {getRelativeTime(log.created_at)}
                          </span>
                        </div>
                        <div className="text-xs text-[var(--text-tertiary)] mt-1">
                          {new Date(log.created_at).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] flex items-center justify-center text-white text-sm font-medium shadow-sm">
                            {log.user?.first_name?.[0]}{log.user?.last_name?.[0]}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-[var(--text-primary)]">
                              {log.user ? `${log.user.first_name} ${log.user.last_name}` : `User ${log.user_id}`}
                            </div>
                            <div className="text-xs text-[var(--text-tertiary)]">
                              {log.user?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getActionColorClass(log.action)}`}>
                          <ActionIcon className="w-3 h-3" />
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${getEntityBgColorClass(log.entity_type)}`}>
                            <EntityIcon className={`w-4 h-4 ${getEntityColorClass(log.entity_type)}`} />
                          </div>
                          <span className="text-sm text-[var(--text-primary)]">
                            {getEntityDisplayName(log.entity_type)}
                          </span>
                          {log.entity_id && (
                            <span className="text-xs text-[var(--text-tertiary)]">#{log.entity_id}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-[var(--text-primary)] max-w-md truncate" title={summary}>
                          {summary}
                        </div>
                        {details?.changes && details.changes.length > 0 && (
                          <div className="text-xs text-[var(--text-tertiary)] mt-1">
                            {details.changes.length} field{details.changes.length > 1 ? 's' : ''} changed
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <code className="text-xs bg-[var(--bg-subtle)] text-[var(--text-secondary)] px-2 py-1 rounded font-mono">
                          {log.ip_address || '—'}
                        </code>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleViewDetails(log)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent-subtle)] transition-all duration-200"
                        >
                          <Eye className="w-4 h-4" />
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && logs.length > 0 && (
          <div className="px-6 py-4 border-t border-[var(--border-default)] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-[var(--text-secondary)]">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="p-2 rounded-lg border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  let pageNum;
                  if (pagination.pages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.pages - 2) {
                    pageNum = pagination.pages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={cn(
                        "min-w-[2rem] h-8 px-2 rounded-lg text-sm transition-all",
                        pagination.page === pageNum
                          ? "bg-[var(--accent)] text-white shadow-sm"
                          : "border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]"
                      )}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="p-2 rounded-lg border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedLog && (
        <AuditLogDetailModal
          log={selectedLog}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedLog(null);
          }}
        />
      )}

      {/* Summary Panel */}
      {showSummaryPanel && (
        <AuditLogSummaryPanel
          data={summaryData}
          loading={loadingSummary}
          onClose={() => {
            setShowSummaryPanel(false);
            setSummaryData(null);
          }}
        />
      )}
    </div>
  );
};

export default AuditLogs;