import { Trophy, Ticket } from 'lucide-react';
import type { TopPerformer } from '../../types/dashboard';
import { formatCurrency } from '../../utils/formatters';

interface TopPerformersProps {
  performers: TopPerformer[];
  currency: string
}

export function TopPerformers({ performers, currency }: TopPerformersProps) {
  if (performers.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No data available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {performers.map((performer, index) => (
        <div
          key={performer.user_id}
          className="flex items-center space-x-3 p-3 bg-white/50 rounded-xl hover:bg-white/80 transition-colors"
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-linear-to-br from-primary to-accent flex items-center justify-center text-white font-medium">
              {performer.name.split(' ').map(n => n[0]).join('')}
            </div>
            {index === 0 && (
              <div className="absolute -top-1 -right-1">
                <Trophy size={14} className="text-yellow-500 fill-yellow-500" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <p className="font-medium text-deep-ink">{performer.name}</p>
            <div className="flex items-center space-x-3 mt-1">
              <div className="flex items-center text-xs text-gray-600">
                {formatCurrency(performer.deals_value, currency)}
              </div>
              <div className="flex items-center text-xs text-gray-600">
                <Ticket size={12} className="mr-1" />
                {performer.tickets_resolved} resolved
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-sm font-medium text-green-600">
              {performer.deals_won} won
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}