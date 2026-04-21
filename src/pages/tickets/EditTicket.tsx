import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Trash2, AlertCircle, Calendar } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { ticketsApi } from '../../api/tickets';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';
import type { Ticket, TicketPriority, TicketStatus } from '../../types/ticket';

const editTicketSchema = z.object({
  subject: z.string().min(1, 'Subject is required').max(255, 'Subject is too long'),
  description: z.string().min(1, 'Description is required'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  due_date: z.string().optional(),
});

type EditTicketFormData = z.infer<typeof editTicketSchema>;

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const statusOptions = [
  { value: 'new', label: 'New' },
  { value: 'open', label: 'Open' },
  { value: 'pending', label: 'Pending' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

void Calendar;

export default function EditTicket() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<TicketStatus>('new');

  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<EditTicketFormData>({
    resolver: zodResolver(editTicketSchema),
  });
  void setValue;

  const selectedPriority = watch('priority');

  useEffect(() => {
    if (id) fetchTicket();
  }, [id]);

  const fetchTicket = async () => {
    try {
      const response = await ticketsApi.getTicketById(Number(id));
      const ticketData = response.data.ticket;
      setTicket(ticketData);
      setSelectedStatus(ticketData.status);
      
      reset({
        subject: ticketData.subject,
        description: ticketData.description,
        priority: ticketData.priority,
        due_date: ticketData.due_date?.split('T')[0] || '',
      });
    } catch (error) {
      toast.error('Failed to load ticket');
      navigate('/tickets');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: EditTicketFormData) => {
    if (!id) return;
    setSaving(true);
    try {
      await ticketsApi.updateTicket(Number(id), {
        subject: data.subject,
        description: data.description,
        priority: data.priority as TicketPriority,
        due_date: data.due_date,
      });
      toast.success('Ticket updated successfully');
      navigate(`/tickets/${id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update ticket');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (status: TicketStatus) => {
    if (!id) return;
    try {
      await ticketsApi.updateTicketStatus(Number(id), status);
      setSelectedStatus(status);
      toast.success('Status updated successfully');
      fetchTicket(); // Refresh to get updated data
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await ticketsApi.deleteTicket(Number(id));
      toast.success('Ticket deleted successfully');
      navigate('/tickets');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete ticket');
    }
  };

  // Check if user can edit (admin, manager, owner, or assignee)
  const canEdit = user?.role === 'admin' || 
                  user?.role === 'manager' || 
                  user?.id === ticket?.user_id || 
                  user?.id === ticket?.assigned_to;
  
  // Check if user can delete (admin only)
  const canDelete = user?.role === 'admin';

  // Check if ticket is in a final state (can't edit resolved/closed tickets)
  const isFinalState = selectedStatus === 'resolved' || selectedStatus === 'closed';
  const canEditFields = canEdit && !isFinalState;

  const getSLADescription = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'Response: 1 hour, Resolution: 4 hours';
      case 'high':
        return 'Response: 4 hours, Resolution: 24 hours';
      case 'medium':
        return 'Response: 8 hours, Resolution: 48 hours';
      case 'low':
        return 'Response: 24 hours, Resolution: 120 hours';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!ticket) return null;

  if (!canEdit) {
    return (
      <GlassCard className="p-6 text-center">
        <h2 className="text-xl font-semibold text-deep-ink mb-2">Access Denied</h2>
        <p className="text-gray-600 mb-4">You don't have permission to edit this ticket.</p>
        <Button onClick={() => navigate(`/tickets/${id}`)}>
          <ArrowLeft size={18} className="mr-2" /> Back to Ticket
        </Button>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/tickets/${id}`)}>
            <ArrowLeft size={18} className="mr-2" /> Back to Ticket
          </Button>
          <h1 className="text-3xl font-bold text-deep-ink">Edit Ticket {ticket.ticket_number}</h1>
        </div>
        {canDelete && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 size={18} className="mr-2" /> Delete Ticket
          </Button>
        )}
      </div>

      <GlassCard className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Status Update Section */}
          <div>
            <h2 className="text-lg font-semibold text-deep-ink mb-4">Status</h2>
            <div className="flex items-center space-x-4">
              <Select
                value={selectedStatus}
                onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                className="w-48"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
              {isFinalState && (
                <p className="text-sm text-amber-600">
                  ⚠️ This ticket is {selectedStatus}. Some fields cannot be edited.
                </p>
              )}
            </div>
          </div>

          {/* Ticket Information */}
          <div>
            <h2 className="text-lg font-semibold text-deep-ink mb-4">Ticket Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Subject"
                error={errors.subject?.message}
                disabled={!canEditFields}
                {...register('subject')}
              />

              <Select
                label="Priority"
                error={errors.priority?.message}
                disabled={!canEditFields}
                {...register('priority')}
              >
                {priorityOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>

              <Input
                label="Due Date"
                type="date"
                error={errors.due_date?.message}
                disabled={!canEditFields}
                {...register('due_date')}
              />

              <div className="md:col-span-2">
                <Textarea
                  label="Description"
                  rows={6}
                  error={errors.description?.message}
                  disabled={!canEditFields}
                  {...register('description')}
                />
              </div>
            </div>
          </div>

          {/* SLA Information */}
          {selectedPriority && (
            <div className="bg-primary/5 p-4 rounded-lg">
              <h3 className="font-medium text-deep-ink mb-2 flex items-center">
                <AlertCircle size={18} className="mr-2 text-primary" />
                Service Level Agreement (SLA)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Priority</p>
                  <p className="font-medium capitalize">{selectedPriority}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">SLA Targets</p>
                  <p className="font-medium">{getSLADescription(selectedPriority)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Contact Information (Read-only) */}
          {ticket.contact && (
            <div className="bg-blue-50/50 p-4 rounded-lg">
              <h3 className="font-medium text-deep-ink mb-2">Contact Information</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">{ticket.contact.first_name} {ticket.contact.last_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{ticket.contact.email || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{ticket.contact.phone || '-'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Assignment Information (Read-only) */}
          <div className="bg-gray-50/50 p-4 rounded-lg">
            <h3 className="font-medium text-deep-ink mb-2">Assignment</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Created By</p>
                <p className="font-medium">
                  {ticket.createdBy?.first_name} {ticket.createdBy?.last_name}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Assigned To</p>
                <p className="font-medium">
                  {ticket.assignedTo 
                    ? `${ticket.assignedTo.first_name} ${ticket.assignedTo.last_name}`
                    : 'Unassigned'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Created At</p>
                <p className="font-medium">
                  {new Date(ticket.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/tickets/${id}`)}
            >
              Cancel
            </Button>
            {canEditFields && (
              <Button
                type="submit"
                disabled={saving}
              >
                <Save size={18} className="mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            )}
          </div>
        </form>
      </GlassCard>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <GlassCard className="p-6 max-w-md">
            <h3 className="text-xl font-semibold text-deep-ink mb-2">Delete Ticket</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete ticket "{ticket.ticket_number}"? 
              This action cannot be undone and will remove all comments.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
              >
                Delete
              </Button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}