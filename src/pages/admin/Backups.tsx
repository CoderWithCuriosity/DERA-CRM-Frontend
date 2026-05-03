import { useState, useEffect, useCallback, useRef } from 'react';
import { Download, RefreshCw, Clock, Trash2, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { adminApi } from '../../api/admin';
import { useToast } from '../../hooks/useToast';
import { formatBytes, formatDate } from '../../utils/formatters';
import type { Backup } from '../../types/admin';

export default function Backups() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const pollingRef = useRef<number | null>(null);
  const toast = useToast();

  // Fetch backups list
  const fetchBackups = useCallback(async () => {
    try {
      const response = await adminApi.getBackups();
      if (response.success) {
        setBackups(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch backups:', error);
      toast.error('Failed to load backups');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Check backup status (for polling)
  const checkBackupStatus = useCallback(async (backupId: number) => {
    try {
      const response = await adminApi.getBackupStatus(backupId.toString());
      if (response) {
        const updatedBackup = response.data;
        
        setBackups(prev => prev.map(backup => 
          backup.id === backupId 
            ? { 
                ...backup, 
                status: updatedBackup.status,
                size: updatedBackup.size ? parseSizeToBytes(updatedBackup.size) : backup.size,
                completed_at: updatedBackup.completed_at,
                download_url: updatedBackup.download_url,
                expires_at: updatedBackup.expires_at
              }
            : backup
        ));

        // If backup is completed or failed, stop polling
        if (updatedBackup.status === 'completed' || updatedBackup.status === 'failed') {
          if (pollingRef.current) {
            clearTimeout(pollingRef.current);
            pollingRef.current = null;
          }
          
          if (updatedBackup.status === 'completed') {
            toast.success('Backup completed successfully!');
            // Refresh the full list to get accurate data
            await fetchBackups();
          } else if (updatedBackup.status === 'failed') {
            toast.error('Backup failed. Please try again.');
          }
        } else {
          // Continue polling
          pollingRef.current = setTimeout(() => checkBackupStatus(backupId), 3000);
        }
      }
    } catch (error) {
      console.error('Failed to check backup status:', error);
      if (pollingRef.current) {
        clearTimeout(pollingRef.current);
        pollingRef.current = null;
      }
    }
  }, [toast, fetchBackups]);

  const handleCreateBackup = async () => {
    setCreating(true);
    try {
      const response = await adminApi.createBackup();
      if (response) {
        const newBackup: Backup = {
          id: response.data.backup_id,
          filename: `backup_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.sql.gz`,
          size: 0,
          status: 'processing',
          created_at: new Date().toISOString(),
        };
        
        setBackups(prev => [newBackup, ...prev]);
        toast.success('Backup started');
        
        // Start polling for status
        await checkBackupStatus(newBackup.id);
      }
    } catch (error) {
      toast.error('Failed to start backup');
      console.error('Backup error:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleDownload = async (backup: Backup) => {
    if (backup.status !== 'completed') {
      toast.warning('Backup not ready yet');
      return;
    }

    try {
      const response = await adminApi.downloadBackup(backup.id.toString());
      
      // Create blob download
      const blob = new Blob([response.data], { type: 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = backup.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Download started');
    } catch (error) {
      toast.error('Failed to download backup');
      console.error('Download error:', error);
    }
  };

  const handleDelete = async (backupId: number) => {
    if (!confirm('Are you sure you want to delete this backup? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await adminApi.deleteBackup(backupId.toString());
      if (response) {
        setBackups(prev => prev.filter(backup => backup.id !== backupId));
        toast.success('Backup deleted');
      }
    } catch (error) {
      toast.error('Failed to delete backup');
      console.error('Delete error:', error);
    }
  };

  useEffect(() => {
    fetchBackups();
    
    // Cleanup polling on unmount
    return () => {
      if (pollingRef.current) {
        clearTimeout(pollingRef.current);
      }
    };
  }, [fetchBackups]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle size={12} className="mr-1" /> Completed
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Loader size={12} className="mr-1 animate-spin" /> Processing
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <AlertCircle size={12} className="mr-1" /> Failed
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-deep-ink">Database Backups</h1>
          <p className="text-gray-500 mt-1">
            Create and manage database backups. Backups are stored for 30 days.
          </p>
        </div>
        <Button onClick={handleCreateBackup} loading={creating}>
          <RefreshCw size={18} className="mr-2" /> Create Backup
        </Button>
      </div>

      <GlassCard className="p-6">
        {backups.length === 0 ? (
          <div className="text-center py-12">
            <Clock size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No backups yet</h3>
            <p className="text-gray-500 mt-1">Create your first database backup</p>
            <Button onClick={handleCreateBackup} className="mt-4" variant="outline">
              Create Backup
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {backups.map((backup) => (
              <div
                key={backup.id}
                className="flex items-center justify-between p-4 bg-white/50 rounded-lg hover:bg-white/70 transition-colors"
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div className="flex-shrink-0">
                    {backup.status === 'completed' && <CheckCircle size={24} className="text-green-500" />}
                    {backup.status === 'processing' && <Loader size={24} className="text-yellow-500 animate-spin" />}
                    {backup.status === 'failed' && <AlertCircle size={24} className="text-red-500" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 flex-wrap gap-2">
                      <p className="font-medium">{backup.filename}</p>
                      {getStatusBadge(backup.status)}
                    </div>
                    <div className="flex items-center space-x-4 mt-1 flex-wrap gap-2">
                      <p className="text-sm text-gray-500">
                        Created: {formatDate(backup.created_at)}
                      </p>
                      {backup.size > 0 && (
                        <p className="text-sm text-gray-500">
                          Size: {formatBytes(backup.size)}
                        </p>
                      )}
                      {backup.completed_at && (
                        <p className="text-sm text-gray-500">
                          Completed: {formatDate(backup.completed_at)}
                        </p>
                      )}
                      {backup.expires_at && (
                        <p className="text-sm text-orange-600">
                          Expires: {formatDate(backup.expires_at)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(backup)}
                    disabled={backup.status !== 'completed'}
                  >
                    <Download size={16} className="mr-2" /> Download
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(backup.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Info Card */}
      <GlassCard className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3">
          <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">About Backups</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Backups include all database tables and records</li>
              <li>Backups are automatically compressed (.gz format)</li>
              <li>Backups are stored for 30 days</li>
              <li>You'll be notified when the backup is complete</li>
              <li>Only the 10 most recent backups are kept automatically</li>
            </ul>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

// Helper function to parse size string like "450 MB" to bytes
function parseSizeToBytes(sizeStr: string): number {
  const match = sizeStr.match(/^([\d.]+)\s*(Bytes|KB|MB|GB|TB)$/i);
  if (!match) return 0;
  
  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  
  const multipliers: Record<string, number> = {
    'BYTES': 1,
    'KB': 1024,
    'MB': 1024 * 1024,
    'GB': 1024 * 1024 * 1024,
    'TB': 1024 * 1024 * 1024 * 1024
  };
  
  return value * (multipliers[unit] || 1);
}