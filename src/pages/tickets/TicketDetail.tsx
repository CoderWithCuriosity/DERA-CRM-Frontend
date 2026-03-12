import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, UserPlus, Clock } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { ticketsApi } from '../../api/tickets';
import type { TicketDetailResponse, TicketComment } from '../../types/ticket';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { formatDate, formatRelativeTime } from '../../utils/formatters';

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  void user;
  const toast = useToast();
  const [ticket, setTicket] = useState<TicketDetailResponse['data']['ticket'] | null>(null);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [ticketRes, commentsRes] = await Promise.all([
        ticketsApi.getTicketById(Number(id)),
        ticketsApi.getComments(Number(id), true),
      ]);
      setTicket(ticketRes.ticket);
      setComments(commentsRes.data.comments);
    } catch (error) {
      toast.error('Failed to load ticket');
      navigate('/tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    try {
      await ticketsApi.updateTicketStatus(Number(id), status);
      toast.success('Status updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleAssign = async () => {
    // In a real app, you'd open a user selector modal
    const assigneeId = prompt('Enter user ID to assign (or leave blank to unassign)');
    if (assigneeId === null) return;
    try {
      await ticketsApi.assignTicket(Number(id), assigneeId ? Number(assigneeId) : null);
      toast.success('Assignment updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to assign');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await ticketsApi.addComment(Number(id), { comment: newComment });
      setNewComment('');
      fetchData(); // refresh comments
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  if (!ticket) return null;

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
  void statusColors;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/tickets')}>
          <ArrowLeft size={18} className="mr-2" /> Back
        </Button>
        <h1 className="text-3xl font-bold text-deep-ink">Ticket {ticket.ticket_number}</h1>
      </div>

      <GlassCard className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold text-deep-ink">{ticket.subject}</h2>
            <p className="text-gray-600 mt-1">
              Opened by {ticket.createdBy?.first_name} {ticket.createdBy?.last_name} · {formatRelativeTime(ticket.created_at)}
            </p>
          </div>
          <div className="flex space-x-2">
            <select
              value={ticket.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="px-3 py-2 border border-blue-100 rounded-xl bg-white"
            >
              <option value="new">New</option>
              <option value="open">Open</option>
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <Button variant="outline" size="sm" onClick={handleAssign}>
              <UserPlus size={16} className="mr-2" /> Assign
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="p-3 bg-white/50 rounded-lg">
            <p className="text-xs text-gray-500">Priority</p>
            <Badge className={priorityColors[ticket.priority]}>{ticket.priority}</Badge>
          </div>
          <div className="p-3 bg-white/50 rounded-lg">
            <p className="text-xs text-gray-500">Assigned To</p>
            <p>{ticket.assignedTo ? `${ticket.assignedTo.first_name} ${ticket.assignedTo.last_name}` : 'Unassigned'}</p>
          </div>
          <div className="p-3 bg-white/50 rounded-lg">
            <p className="text-xs text-gray-500">Due Date</p>
            <p className={ticket.isOverdue ? 'text-red-600' : ''}>
              {ticket.due_date ? formatDate(ticket.due_date) : 'None'}
              {ticket.isOverdue && <Clock size={14} className="inline ml-1" />}
            </p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-white/50 rounded-lg">
          <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
        </div>

        {/* Contact info */}
        {ticket.contact && (
          <div className="mt-4 p-4 bg-blue-50/50 rounded-lg flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Contact: {ticket.contact.first_name} {ticket.contact.last_name}</p>
              <p className="text-xs text-gray-600">{ticket.contact.email} · {ticket.contact.phone}</p>
            </div>
            <Button variant="outline" size="sm">View Contact</Button>
          </div>
        )}
      </GlassCard>

      {/* Comments section */}
      <GlassCard className="p-6">
        <h3 className="font-medium text-deep-ink mb-4">Comments</h3>
        <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
          {comments.map(comment => (
            <div key={comment.id} className="flex space-x-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm">
                {comment.user?.first_name?.[0]}{comment.user?.last_name?.[0]}
              </div>
              <div className="flex-1 bg-white/50 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-sm">
                    {comment.user?.first_name} {comment.user?.last_name}
                    {comment.is_internal && <Badge size="sm" className="ml-2 bg-yellow-100">Internal</Badge>}
                  </span>
                  <span className="text-xs text-gray-500">{formatRelativeTime(comment.created_at)}</span>
                </div>
                <p className="text-sm mt-1">{comment.comment}</p>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleAddComment} className="flex space-x-2">
          <Input
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={!newComment.trim()}>
            <Send size={18} />
          </Button>
        </form>
      </GlassCard>
    </div>
  );
}