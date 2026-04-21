import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, CheckCircle, XCircle, Calendar, User, Building2, DollarSign, Clock } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { activitiesApi } from '../../api/activities';
import type { Activity } from '../../types/activity';
import { formatDate, formatRelativeTime } from '../../utils/formatters';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';

void XCircle;
void Building2;

export default function ActivityDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [outcome, setOutcome] = useState('');
  const [duration, setDuration] = useState('');

  useEffect(() => {
    if (id) fetchActivity();
  }, [id]);

  const fetchActivity = async () => {
    try {
      const response = await activitiesApi.getActivityById(Number(id));
      setActivity(response.data.activity);
    } catch (error) {
      toast.error('Failed to load activity');
      navigate('/activities');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!outcome.trim()) {
      toast.error('Please enter an outcome');
      return;
    }
    setCompleting(true);
    try {
      await activitiesApi.completeActivity(Number(id), outcome, duration ? parseInt(duration) : undefined);
      toast.success('Activity completed successfully');
      setShowCompleteModal(false);
      fetchActivity();
    } catch (error) {
      toast.error('Failed to complete activity');
    } finally {
      setCompleting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this activity?')) return;
    try {
      await activitiesApi.deleteActivity(Number(id));
      toast.success('Activity deleted successfully');
      navigate('/activities');
    } catch (error) {
      toast.error('Failed to delete activity');
    }
  };

  const canEdit = user?.role === 'admin' || user?.role === 'manager' || user?.id === activity?.user_id;
  const canComplete = canEdit && activity?.status === 'scheduled';

  const typeColors: Record<string, string> = {
    call: 'bg-green-100 text-green-800',
    email: 'bg-blue-100 text-blue-800',
    meeting: 'bg-purple-100 text-purple-800',
    task: 'bg-orange-100 text-orange-800',
    note: 'bg-gray-100 text-gray-800',
    'follow-up': 'bg-yellow-100 text-yellow-800',
  };

  const statusColors: Record<string, string> = {
    scheduled: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-gray-100 text-gray-800',
    overdue: 'bg-red-100 text-red-800',
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!activity) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/activities')}>
            <ArrowLeft size={18} className="mr-2" /> Back
          </Button>
          <h1 className="text-3xl font-bold text-deep-ink">Activity Details</h1>
        </div>
        <div className="flex space-x-2">
          {canComplete && (
            <Button variant="success" size="sm" onClick={() => setShowCompleteModal(true)}>
              <CheckCircle size={16} className="mr-2" /> Complete
            </Button>
          )}
          {canEdit && activity.status !== 'completed' && (
            <Button variant="outline" size="sm" onClick={() => navigate(`/activities/${id}/edit`)}>
              <Edit size={16} className="mr-2" /> Edit
            </Button>
          )}
          {(user?.role === 'admin' || user?.role === 'manager') && (
            <Button variant="danger" size="sm" onClick={handleDelete}>
              <Trash2 size={16} className="mr-2" /> Delete
            </Button>
          )}
        </div>
      </div>

      <GlassCard className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center space-x-2">
              <Badge className={typeColors[activity.type]}>
                {activity.type}
              </Badge>
              <Badge className={statusColors[activity.status]}>
                {activity.status}
              </Badge>
              {activity.is_overdue && (
                <Badge variant="danger">Overdue</Badge>
              )}
            </div>
            <h2 className="text-2xl font-bold text-deep-ink mt-3">{activity.subject}</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="p-3 bg-white/50 rounded-lg">
            <p className="text-xs text-gray-500 flex items-center">
              <Calendar size={12} className="mr-1" /> Scheduled Date
            </p>
            <p className="font-medium">
              {formatDate(activity.scheduled_date, 'MMMM dd, yyyy h:mm a')}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {formatRelativeTime(activity.scheduled_date)}
            </p>
          </div>

          {activity.duration && (
            <div className="p-3 bg-white/50 rounded-lg">
              <p className="text-xs text-gray-500 flex items-center">
                <Clock size={12} className="mr-1" /> Duration
              </p>
              <p className="font-medium">{activity.duration} minutes</p>
            </div>
          )}

          {activity.completed_date && (
            <div className="p-3 bg-white/50 rounded-lg">
              <p className="text-xs text-gray-500">Completed Date</p>
              <p className="font-medium">
                {formatDate(activity.completed_date, 'MMMM dd, yyyy h:mm a')}
              </p>
            </div>
          )}

          {activity.contact && (
            <div className="p-3 bg-white/50 rounded-lg">
              <p className="text-xs text-gray-500 flex items-center">
                <User size={12} className="mr-1" /> Contact
              </p>
              <p className="font-medium">
                {activity.contact.first_name} {activity.contact.last_name}
              </p>
              {activity.contact.company && (
                <p className="text-xs text-gray-500">{activity.contact.company}</p>
              )}
            </div>
          )}

          {activity.deal && (
            <div className="p-3 bg-white/50 rounded-lg">
              <p className="text-xs text-gray-500 flex items-center">
                <DollarSign size={12} className="mr-1" /> Deal
              </p>
              <p className="font-medium">{activity.deal.name}</p>
              <p className="text-xs text-gray-500">Amount: ${activity.deal.amount?.toLocaleString()}</p>
            </div>
          )}

          {activity.user && (
            <div className="p-3 bg-white/50 rounded-lg">
              <p className="text-xs text-gray-500">Assigned To</p>
              <p className="font-medium">
                {activity.user.first_name} {activity.user.last_name}
              </p>
            </div>
          )}
        </div>

        {activity.description && (
          <div className="mt-4 p-4 bg-white/50 rounded-lg">
            <p className="text-sm text-gray-500">Description</p>
            <p className="mt-1 whitespace-pre-wrap">{activity.description}</p>
          </div>
        )}

        {activity.outcome && (
          <div className="mt-4 p-4 bg-green-50/50 rounded-lg">
            <p className="text-sm text-gray-500">Outcome</p>
            <p className="mt-1">{activity.outcome}</p>
          </div>
        )}
      </GlassCard>

      {/* Complete Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCompleteModal(false)}>
          <GlassCard className="p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-semibold text-deep-ink mb-4">Complete Activity</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Outcome *</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                  rows={3}
                  placeholder="What was the result of this activity?"
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Actual Duration (minutes)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                  placeholder="Optional"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="outline" onClick={() => setShowCompleteModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleComplete} disabled={completing}>
                  <CheckCircle size={16} className="mr-2" />
                  {completing ? 'Completing...' : 'Complete'}
                </Button>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}