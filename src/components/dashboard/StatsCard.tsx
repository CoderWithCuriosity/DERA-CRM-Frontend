import type { LucideIcon } from 'lucide-react';
import { Card } from '../ui/Card';
import { cn } from '../../utils/cn';

interface StatsCardProps {
  title: string;
  value: number | string;
  value2?: string;
  change?: string;
  warning?: string;
  icon: LucideIcon;
  color: string;
}

export function StatsCard({ 
  title, 
  value, 
  value2, 
  change, 
  warning, 
  icon: Icon, 
  color 
}: StatsCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <div className="flex items-baseline space-x-2">
            <h3 className="text-2xl font-bold text-deep-ink">{value}</h3>
            {value2 && (
              <span className="text-sm text-gray-500">{value2}</span>
            )}
          </div>
          {change && (
            <p className="text-xs text-green-600 mt-1">{change}</p>
          )}
          {warning && (
            <p className="text-xs text-red-600 mt-1">{warning}</p>
          )}
        </div>
        <div className={cn(
          'p-3 rounded-xl bg-linear-to-br',
          color,
          'bg-opacity-10'
        )}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </Card>
  );
}