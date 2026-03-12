import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Plus, Filter, Inbox, AlertCircle, Clock } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { activitiesApi } from '../../api/activities';
import type { Activity, ActivityFilters } from '../../types/activity';
import { formatDate, formatRelativeTime } from '../../utils/formatters';

type ActivityType = 'call' | 'email' | 'meeting' | 'task' | 'note' | 'follow-up';
type ActivityStatus = 'scheduled' | 'completed' | 'cancelled' | 'overdue';

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ActivityFilters>({ page: 1, limit: 20 });

  useEffect(() => {
    fetchActivities();
  }, [filters]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await activitiesApi.getActivities(filters);
      setActivities(response?.data?.items || []);
    } catch (error) {
      console.error('Failed to load activities:', error);
      setError('Failed to load activities. Please try again.');
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const typeColors: Record<ActivityType, string> = {
    call: 'bg-green-100 text-green-800',
    email: 'bg-blue-100 text-blue-800',
    meeting: 'bg-purple-100 text-purple-800',
    task: 'bg-orange-100 text-orange-800',
    note: 'bg-gray-100 text-gray-800',
    'follow-up': 'bg-yellow-100 text-yellow-800',
  };

  const getStatusVariant = (status: ActivityStatus): 'success' | 'danger' | 'default' | 'warning' => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'overdue':
        return 'danger';
      case 'cancelled':
        return 'default';
      default:
        return 'warning';
    }
  };

  const clearFilters = () => {
    setFilters({ page: 1, limit: 20 });
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center py-12">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4" />
            <p className="text-gray-500">Loading activities...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle size={48} className="text-red-400 mb-4" />
          <p className="text-red-600 mb-2">{error}</p>
          <Button variant="outline" onClick={fetchActivities}>
            Try Again
          </Button>
        </div>
      );
    }

    if (!activities || activities.length === 0) {
      const hasFilters = filters.type || filters.status;
      
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="bg-gray-50 rounded-full p-4 mb-4">
            <Inbox size={48} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No activities found</h3>
          {hasFilters ? (
            <>
              <p className="text-gray-500 mb-4">Try adjusting your filters to see more results</p>
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </>
          ) : (
            <>
              <p className="text-gray-500 mb-4">Get started by logging your first activity</p>
              <Button>
                <Plus size={18} className="mr-2" /> Log Activity
              </Button>
            </>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {activities.map((activity, idx) => {
          // Safely access activity properties with fallbacks
          const activityType = (activity?.type || 'note') as ActivityType;
          const activityStatus = (activity?.status || 'scheduled') as ActivityStatus;
          const typeColor = typeColors[activityType] || 'bg-gray-100 text-gray-800';
          
          // Format contact name safely
          const contactName = activity?.contact 
            ? [activity.contact.first_name, activity.contact.last_name]
                .filter(Boolean)
                .join(' ') || 'Unknown contact'
            : null;

          // Format user name safely
          const userName = activity?.user
            ? [activity.user.first_name, activity.user.last_name]
                .filter(Boolean)
                .join(' ') || 'Unknown user'
            : null;

          // Format deal name safely
          const dealName = activity?.deal?.name;

          return (
            <motion.div
              key={activity?.id || idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <GlassCard className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className={`p-2 rounded-lg ${typeColor} flex-shrink-0`}>
                      <Calendar size={18} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-deep-ink">
                        {activity?.subject || 'Untitled Activity'}
                      </h3>
                      
                      {activity?.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {activity.description}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <Badge size="sm" variant={getStatusVariant(activityStatus)}>
                          {activityStatus}
                        </Badge>
                        
                        {activity?.is_overdue && (
                          <Badge size="sm" variant="danger">
                            Overdue
                          </Badge>
                        )}
                        
                        {contactName && (
                          <span className="text-xs text-gray-500">
                            Contact: {contactName}
                            {activity.contact?.company && ` (${activity.contact.company})`}
                          </span>
                        )}
                        
                        {dealName && (
                          <span className="text-xs text-gray-500">
                            Deal: {dealName}
                          </span>
                        )}
                        
                        {userName && (
                          <span className="text-xs text-gray-400">
                            Assigned to: {userName}
                          </span>
                        )}

                        {activity?.duration && (
                          <span className="text-xs text-gray-400">
                            Duration: {activity.duration} min
                          </span>
                        )}
                      </div>

                      {activity?.outcome && (
                        <p className="text-xs text-gray-500 mt-2">
                          Outcome: {activity.outcome}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right flex-shrink-0 ml-4">
                    {activity?.scheduled_date ? (
                      <>
                        <p className="text-sm font-medium whitespace-nowrap">
                          {formatDate(activity.scheduled_date, 'MMM dd, yyyy h:mm a')}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 whitespace-nowrap">
                          {formatRelativeTime(activity.scheduled_date)}
                        </p>
                        {activity?.completed_date && (
                          <p className="text-xs text-green-600 mt-1 whitespace-nowrap">
                            Completed: {formatDate(activity.completed_date, 'MMM dd, h:mm a')}
                          </p>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center text-gray-400">
                        <Clock size={14} className="mr-1" />
                        <span className="text-xs">No date set</span>
                      </div>
                    )}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-deep-ink">Activities</h1>
          <p className="text-gray-600 mt-1">Track your interactions</p>
        </div>
        <Button>
          <Plus size={18} className="mr-2" /> Log Activity
        </Button>
      </div>

      <GlassCard className="p-4">
        <div className="flex flex-wrap gap-3">
          <select
            className="px-3 py-2 bg-white/70 border border-blue-100 rounded-xl min-w-[150px]"
            value={filters.type || ''}
            onChange={(e) => setFilters({ 
              ...filters, 
              type: (e.target.value || undefined) as ActivityType 
            })}
          >
            <option value="">All Types</option>
            <option value="call">Call</option>
            <option value="email">Email</option>
            <option value="meeting">Meeting</option>
            <option value="task">Task</option>
            <option value="note">Note</option>
            <option value="follow-up">Follow-up</option>
          </select>
          
          <select
            className="px-3 py-2 bg-white/70 border border-blue-100 rounded-xl min-w-[150px]"
            value={filters.status || ''}
            onChange={(e) => setFilters({ 
              ...filters, 
              status: (e.target.value || undefined) as ActivityStatus 
            })}
          >
            <option value="">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          
          <Button 
            variant="ghost" 
            onClick={clearFilters}
            disabled={!filters.type && !filters.status}
          >
            <Filter size={18} className="mr-2" />
            Clear Filters
          </Button>
        </div>
        
        {/* Active filters indicator */}
        {(filters.type || filters.status) && (
          <div className="mt-3 flex items-center space-x-2">
            <span className="text-xs text-gray-500">Active filters:</span>
            {filters.type && (
              <Badge size="sm" className="bg-blue-100 text-blue-800">
                Type: {filters.type}
              </Badge>
            )}
            {filters.status && (
              <Badge size="sm" className="bg-blue-100 text-blue-800">
                Status: {filters.status}
              </Badge>
            )}
          </div>
        )}
      </GlassCard>

      {renderContent()}
    </div>
  );
}