import { useEffect, useState, useMemo } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { adminApi } from '../../api/admin';
import type { AuditLog } from '../../types/admin';
import { formatDateTime } from '../../utils/formatters';
import { Search } from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await adminApi.getAuditLogs();
      setLogs(response?.data?.data || []);
    } catch (error) {
      console.error('Failed to load audit logs');
      setLogs([]); // Ensure logs is always an array
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    const normalizedAction = action?.toUpperCase() || '';
    
    switch (normalizedAction) {
      case 'CREATE':
        return 'bg-green-100 text-green-800';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800';
      case 'DELETE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredLogs = useMemo(() => {
    if (!logs || logs.length === 0) return [];
    if (!search?.trim()) return logs;

    const searchLower = search.toLowerCase().trim();
    
    return logs.filter(log => {
      if (!log) return false;
      
      return (
        (log.user_name?.toLowerCase() || '').includes(searchLower) ||
        (log.action?.toLowerCase() || '').includes(searchLower) ||
        (log.details?.toLowerCase() || '').includes(searchLower) ||
        (log.entity_type?.toLowerCase() || '').includes(searchLower) ||
        (log.ip_address?.toLowerCase() || '').includes(searchLower)
      );
    });
  }, [logs, search]);

  const formatEntityDisplay = (entityType: string, entityId: number) => {
    if (!entityType && !entityId) return 'N/A';
    const type = entityType || 'Unknown';
    const id = entityId ?? '?';
    return `${type} #${id}`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-deep-ink">Audit Logs</h1>
        <GlassCard className="p-8">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-gray-600">Loading audit logs...</span>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-deep-ink">Audit Logs</h1>
        <span className="text-sm text-gray-500">
          {filteredLogs.length} {filteredLogs.length === 1 ? 'entry' : 'entries'}
        </span>
      </div>

      <GlassCard className="p-4">
        <div className="flex space-x-3">
          <Input
            placeholder="Search logs by user, action, details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search size={18} />}
            className="flex-1"
            aria-label="Search logs"
          />
          <Button variant="outline" disabled>Filter</Button>
        </div>
      </GlassCard>

      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-blue-100">
                <th className="text-left p-4 text-sm font-medium text-gray-600">Time</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">User</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Action</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Entity</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Details</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">IP</th>
              </tr>
            </thead>
            <tbody>
              {!filteredLogs || filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <p className="text-lg mb-2">
                        {logs.length === 0 ? 'No audit logs found' : 'No matching logs found'}
                      </p>
                      <p className="text-sm">
                        {logs.length === 0 
                          ? 'Audit logs will appear here as activities are recorded'
                          : 'Try adjusting your search criteria'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr 
                    key={log?.id || Math.random()} 
                    className="border-b border-blue-50 hover:bg-blue-50/30 transition-colors"
                  >
                    <td className="p-4 text-sm whitespace-nowrap">
                      {log?.created_at ? formatDateTime(log.created_at) : 'Unknown time'}
                    </td>
                    <td className="p-4 text-sm font-medium">
                      {log?.user_name || 'System'}
                    </td>
                    <td className="p-4">
                      {log?.action ? (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                          Unknown
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-sm whitespace-nowrap">
                      {formatEntityDisplay(log?.entity_type, log?.entity_id)}
                    </td>
                    <td className="p-4 text-sm max-w-xs truncate" title={log?.details}>
                      {log?.details || 'No details provided'}
                    </td>
                    <td className="p-4 text-sm text-gray-500 font-mono">
                      {log?.ip_address || '0.0.0.0'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {filteredLogs.length > 0 && (
        <div className="text-xs text-gray-500 text-right">
          Last updated: {new Date().toLocaleString()}
        </div>
      )}
    </div>
  );
}