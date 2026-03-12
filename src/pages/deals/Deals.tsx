import { useEffect, useState } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, Filter } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { dealsApi } from '../../api/deals';
import type { KanbanBoard, DealStage } from '../../types/deal';
import { DealColumn } from '../../components/deals/DealColumn';
import { useToast } from '../../hooks/useToast';

export default function Deals() {
    const [board, setBoard] = useState<KanbanBoard | null>(null);
    const [loading, setLoading] = useState(true);
    const toast = useToast();

    useEffect(() => {
        fetchBoard();
    }, []);

    const fetchBoard = async () => {
        try {
            const response = await dealsApi.getKanbanBoard();
            setBoard(response.data);
        } catch (error) {
            toast.error('Failed to load deals');
        } finally {
            setLoading(false);
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const activeId = active.id as number;
        const overId = over.id as string; // column id

        // Find the deal and its new stage
        const sourceColumn = board?.columns.find(col => col.deals.some(d => d.id === activeId));
        if (!sourceColumn) return;
        const deal = sourceColumn.deals.find(d => d.id === activeId);
        if (!deal) return;

        const newStage = overId as DealStage;

        // Optimistic update
        setBoard(prev => {
            if (!prev) return prev;
            const newColumns = prev.columns.map(col => {
                if (col.id === sourceColumn.id) {
                    return { ...col, deals: col.deals.filter(d => d.id !== activeId) };
                }
                if (col.id === newStage) {
                    return { ...col, deals: [...col.deals, deal] };
                }
                return col;
            });
            return { ...prev, columns: newColumns };
        });

        // API call
        try {
            await dealsApi.updateDealStage(activeId, newStage);
        } catch (error) {
            toast.error('Failed to update deal stage');
            fetchBoard(); // revert
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
    }

    if (!board) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-deep-ink">Deals</h1>
                    <p className="text-gray-600 mt-1">Manage your sales pipeline</p>
                </div>
                <div className="flex space-x-3">
                    <Button variant="outline">
                        <Filter size={18} className="mr-2" /> Filter
                    </Button>
                    <Button>
                        <Plus size={18} className="mr-2" /> Add Deal
                    </Button>
                </div>
            </div>

            <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={board.columns.map(col => col.id)} strategy={horizontalListSortingStrategy}>
                    <div className="flex space-x-4 overflow-x-auto pb-4">
                        {board.columns.map(column => (
                            <DealColumn key={column.id} column={column} />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    );
}