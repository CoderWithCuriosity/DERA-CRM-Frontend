import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { KanbanBoard } from '../../types/deal';
import { formatCurrency } from '../../utils/formatters';

interface DealCardProps {
  deal: KanbanBoard['columns'][0]['deals'][0];
}

export function DealCard({ deal }: DealCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: deal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-medium text-deep-ink">{deal.contact_name}</h4>
          <p className="text-sm text-gray-600">{deal.contact_company}</p>
        </div>
        {deal.has_activity_today && (
          <span className="w-2 h-2 bg-green-500 rounded-full" title="Activity today" />
        )}
      </div>
      <div className="mt-3">
        <p className="text-sm font-medium">{deal.name}</p>
        <div className="flex justify-between items-center mt-2">
          <span className="text-sm text-primary">{formatCurrency(deal.amount)}</span>
          <span className="text-xs text-gray-500">{deal.probability}%</span>
        </div>
        {deal.expected_close_date && (
          <p className="text-xs text-gray-400 mt-1">Due {new Date(deal.expected_close_date).toLocaleDateString()}</p>
        )}
      </div>
    </div>
  );
}