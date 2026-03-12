import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, Inbox, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../../components/ui/GlassCard';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ticketsApi } from '../../api/tickets';
import type { Ticket, TicketFilters } from '../../types/ticket';
import { useDebounce } from '../../hooks/useDebounce';
import { formatDate } from '../../utils/formatters';
import type { TicketStatus, TicketPriority } from '../../types/ticket';

export default function Tickets() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TicketFilters>({ page: 1, limit: 20 });
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    fetchTickets();
  }, [filters.page, debouncedSearch, filters.status, filters.priority]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ticketsApi.getTickets({ ...filters, search: debouncedSearch });
      // Guard against undefined response or items
      setTickets(response?.data?.items || []);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
      setError('Failed to load tickets. Please try again.');
      setTickets([]); // Ensure tickets is always an array
    } finally {
      setLoading(false);
    }
  };

  const priorityColors = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800',
  };

  const statusColors = {
    new: 'bg-purple-100 text-purple-800',
    open: 'bg-yellow-100 text-yellow-800',
    pending: 'bg-blue-100 text-blue-800',
    resolved: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800',
  };

  const clearFilters = () => {
    setSearch('');
    setFilters({ page: 1, limit: 20 });
  };

  const renderContent = () => {
    if (loading) {
      return (
        <tr>
          <td colSpan={7} className="text-center py-12">
            <div className="flex flex-col items-center justify-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4" />
              <p>Loading tickets...</p>
            </div>
          </td>
        </tr>
      );
    }

    if (error) {
      return (
        <tr>
          <td colSpan={7} className="text-center py-12">
            <div className="flex flex-col items-center justify-center text-gray-500">
              <AlertCircle size={48} className="text-red-400 mb-4" />
              <p className="text-red-600 mb-2">{error}</p>
              <Button variant="outline" onClick={fetchTickets}>
                Try Again
              </Button>
            </div>
          </td>
        </tr>
      );
    }

    if (!tickets || tickets.length === 0) {
      return (
        <tr>
          <td colSpan={7} className="text-center py-12">
            <div className="flex flex-col items-center justify-center text-gray-500">
              <Inbox size={48} className="text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">No tickets found</p>
              {search || filters.status || filters.priority ? (
                <>
                  <p className="text-gray-500 mb-4">Try adjusting your filters</p>
                  <Button variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-gray-500 mb-4">Get started by creating your first ticket</p>
                  <Button onClick={() => navigate('/tickets/new')}>
                    <Plus size={18} className="mr-2" /> Create Ticket
                  </Button>
                </>
              )}
            </div>
          </td>
        </tr>
      );
    }

    return tickets.map((ticket, idx) => (
      <motion.tr
        key={ticket?.id || idx}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: idx * 0.05 }}
        className="border-b border-blue-50 hover:bg-blue-50/30 cursor-pointer"
        onClick={() => ticket?.id && navigate(`/tickets/${ticket.id}`)}
      >
        <td className="p-4 font-mono text-sm">{ticket?.ticket_number || '-'}</td>
        <td className="p-4 max-w-xs truncate">{ticket?.subject || 'No subject'}</td>
        <td className="p-4">
          {ticket?.contact 
            ? `${ticket.contact.first_name || ''} ${ticket.contact.last_name || ''}`.trim() || '-' 
            : '-'}
        </td>
        <td className="p-4">
          {ticket?.priority ? (
            <Badge className={priorityColors[ticket.priority] || 'bg-gray-100 text-gray-800'}>
              {ticket.priority}
            </Badge>
          ) : '-'}
        </td>
        <td className="p-4">
          {ticket?.status ? (
            <Badge className={statusColors[ticket.status] || 'bg-gray-100 text-gray-800'}>
              {ticket.status}
            </Badge>
          ) : '-'}
        </td>
        <td className="p-4">
          {ticket?.due_date ? (
            <span className={ticket.isOverdue ? 'text-red-600 font-medium' : ''}>
              {formatDate(ticket.due_date)}
            </span>
          ) : '-'}
        </td>
        <td className="p-4">
          {ticket?.assignedTo 
            ? `${ticket.assignedTo.first_name || ''} ${ticket.assignedTo.last_name || ''}`.trim() || 'Unassigned'
            : 'Unassigned'}
        </td>
      </motion.tr>
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-deep-ink">Support Tickets</h1>
          <p className="text-gray-600 mt-1">Manage customer requests</p>
        </div>
        <Button onClick={() => navigate('/tickets/new')}>
          <Plus size={18} className="mr-2" /> New Ticket
        </Button>
      </div>

      <GlassCard className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search tickets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search size={18} />}
            />
          </div>
          <select
            className="px-3 py-2 bg-white/70 border border-blue-100 rounded-xl"
            value={filters.status || ''}
            onChange={(e) => setFilters({ ...filters, status: (e.target.value || undefined) as TicketStatus })}
          >
            <option value="">All Statuses</option>
            <option value="new">New</option>
            <option value="open">Open</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <select
            className="px-3 py-2 bg-white/70 border border-blue-100 rounded-xl"
            value={filters.priority || ''}
            onChange={(e) => setFilters({ ...filters, priority: (e.target.value || undefined) as TicketPriority })}
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          <Button variant="ghost" onClick={clearFilters}>
            <Filter size={18} />
          </Button>
        </div>
      </GlassCard>

      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-blue-100">
                <th className="text-left p-4 text-sm font-medium text-gray-600">Ticket</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Subject</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Contact</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Priority</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Status</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Due</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Assigned</th>
              </tr>
            </thead>
            <tbody>
              {renderContent()}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}