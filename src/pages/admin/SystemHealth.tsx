import { useEffect, useState } from 'react';
import { Activity, Database, Wifi } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { adminApi } from '../../api/admin';
import type { SystemHealth } from '../../types/admin';

export default function SystemHealthPage() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchHealth = async () => {
    try {
      const response = await adminApi.getSystemHealth();
      setHealth(response.data);
    } catch (error) {
      console.error('Failed to fetch health');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  if (!health) return null;

  const statusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-deep-ink">System Health</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Overall Status</p>
              <p className={`text-2xl font-semibold ${statusColor(health.status)}`}>
                {health.status.toUpperCase()}
              </p>
            </div>
            <Activity size={32} className={statusColor(health.status)} />
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Uptime</p>
              <p className="text-2xl font-semibold text-deep-ink">{health.system.uptime}</p>
            </div>
            <Wifi size={32} className="text-primary" />
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Connections</p>
              <p className="text-2xl font-semibold text-deep-ink">{health.system.active_connections}</p>
            </div>
            <Database size={32} className="text-accent" />
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GlassCard className="p-6">
          <h2 className="text-lg font-semibold text-deep-ink mb-4">Database</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Status</span>
              <span className={health.services.database.status === 'connected' ? 'text-green-600' : 'text-red-600'}>
                {health.services.database.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Latency</span>
              <span>{health.services.database.latency}ms</span>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="text-lg font-semibold text-deep-ink mb-4">Storage</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Status</span>
              <span className={health.services.storage.status === 'healthy' ? 'text-green-600' : 'text-yellow-600'}>
                {health.services.storage.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Used</span>
              <span>{health.services.storage.used} / {health.services.storage.total}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-primary h-2.5 rounded-full"
                style={{ width: `${health.services.storage.usage_percentage}%` }}
              ></div>
            </div>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-6">
        <h2 className="text-lg font-semibold text-deep-ink mb-4">Memory Usage</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Heap Used</p>
            <p className="text-xl font-semibold">{health.system.memory.heap_used}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Heap Total</p>
            <p className="text-xl font-semibold">{health.system.memory.heap_total}</p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}