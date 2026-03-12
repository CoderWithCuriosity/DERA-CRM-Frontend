import { useState } from 'react';
import { Download, RefreshCw, Clock } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { adminApi } from '../../api/admin';
import { useToast } from '../../hooks/useToast';

export default function Backups() {
  const [creating, setCreating] = useState(false);
//   const [backups, setBackups] = useState<any[]>([]); // would fetch from API
  const toast = useToast();

  const handleCreateBackup = async () => {
    setCreating(true);
    try {
      const response = await adminApi.createBackup();
      void response;
      toast.success('Backup started');
      // In real app, poll for status
    } catch (error) {
      toast.error('Failed to start backup');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-deep-ink">Database Backups</h1>
        <Button onClick={handleCreateBackup} loading={creating}>
          <RefreshCw size={18} className="mr-2" /> Create Backup
        </Button>
      </div>

      <GlassCard className="p-6">
        <div className="space-y-4">
          {/* Example backup list - would be dynamic */}
          <div className="flex items-center justify-between p-4 bg-white/50 rounded-lg">
            <div className="flex items-center space-x-4">
              <Clock size={20} className="text-gray-400" />
              <div>
                <p className="font-medium">Backup 2025-03-12 02:00</p>
                <p className="text-sm text-gray-500">Size: 450 MB</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Download size={16} className="mr-2" /> Download
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 bg-white/50 rounded-lg">
            <div className="flex items-center space-x-4">
              <Clock size={20} className="text-gray-400" />
              <div>
                <p className="font-medium">Backup 2025-03-11 02:00</p>
                <p className="text-sm text-gray-500">Size: 448 MB</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Download size={16} className="mr-2" /> Download
            </Button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}