import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { DealCard } from './DealCard';
import type { KanbanBoard } from '../../types/deal';

interface DealColumnProps {
  column: KanbanBoard['columns'][0];
}

export function DealColumn({ column }: DealColumnProps) {
  const { setNodeRef } = useDroppable({ id: column.id });

  return (
    <div
      ref={setNodeRef}
      className="shrink-0 w-80 bg-white/50 backdrop-blur-sm rounded-xl p-4"
      style={{ borderTop: `3px solid ${column.color}` }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-deep-ink">{column.title}</h3>
        <span className="text-sm text-gray-500">{column.deals.length} / {column.limit}</span>
      </div>
      <SortableContext items={column.deals.map(d => d.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {column.deals.map(deal => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}