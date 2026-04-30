import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Bell, CheckCircle, Mail, Calendar, AlertCircle, Trash2, Loader } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { notificationsApi } from '../../api/notifications';
import type { Notification } from '../../types/notification';
import { useToast } from '../../hooks/useToast';
import { formatDate } from '../../utils/formatters';
import { useNavigate } from 'react-router-dom';

export function NotificationsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [onlyUnread, setOnlyUnread] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await notificationsApi.getNotifications({
        page,
        limit: 20,
        unread_only: onlyUnread
      });
      setNotifications(response.data.data);
      setTotalPages(response.data.totalPages);
      setUnreadCount(response.data.unread_count);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [page, onlyUnread]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationsApi.markAsRead(id);
      fetchNotifications();
      toast.success('Notification marked as read');
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      fetchNotifications();
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await notificationsApi.deleteNotification(id);
      fetchNotifications();
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read_at) {
      handleMarkAsRead(notification.id);
    }
    
    // Navigate based on notification type
    if (notification.data?.url) {
      navigate(notification.data.url);
    } else if (notification.data?.ticket_id) {
      navigate(`/tickets/${notification.data.ticket_id}`);
    } else if (notification.data?.deal_id) {
      navigate(`/deals/${notification.data.deal_id}`);
    } else if (notification.data?.activity_id) {
      navigate(`/activities/${notification.data.activity_id}`);
    } else if (notification.data?.message_id) {
      navigate('/messages');
    }
  };

  const getIcon = (type: string) => {
    if (type.includes('ticket')) return <TicketIcon size={18} />;
    if (type.includes('deal')) return <BriefcaseIcon size={18} />;
    if (type.includes('message')) return <Mail size={18} />;
    if (type.includes('activity')) return <Calendar size={18} />;
    if (type.includes('backup') || type.includes('import')) return <AlertCircle size={18} />;
    return <Bell size={18} />;
  };

  const getIconBg = (type: string) => {
    if (type.includes('ticket')) return 'bg-orange-100 text-orange-600';
    if (type.includes('deal')) return 'bg-green-100 text-green-600';
    if (type.includes('message')) return 'bg-blue-100 text-blue-600';
    if (type.includes('activity')) return 'bg-purple-100 text-purple-600';
    if (type.includes('warning') || type.includes('breach')) return 'bg-red-100 text-red-600';
    if (type.includes('backup') || type.includes('import')) return 'bg-yellow-100 text-yellow-600';
    return 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-deep-ink">Notifications</h1>
          <p className="text-gray-600 mt-1">Stay updated with your activities</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={handleMarkAllAsRead}>
            <CheckCircle size={18} className="mr-2" />
            Mark All as Read
          </Button>
        )}
      </div>

      {/* Filters */}
      <GlassCard className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setOnlyUnread(false)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                !onlyUnread ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setOnlyUnread(true)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                onlyUnread ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Unread
              {unreadCount > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-primary/20 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Notifications List */}
      <GlassCard className="overflow-hidden">
        <div className="divide-y divide-blue-100">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader className="animate-spin text-primary" size={32} />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Bell size={48} className="mx-auto mb-3 opacity-50" />
              <p>No notifications</p>
              <p className="text-sm">You're all caught up!</p>
            </div>
          ) : (
            notifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className={`p-4 hover:bg-blue-50/50 transition-colors cursor-pointer ${
                  !notification.read_at ? 'bg-blue-50/30' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg shrink-0 ${getIconBg(notification.type)}`}>
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-deep-ink">{notification.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{notification.body}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          {formatDate(notification.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-1 shrink-0 ml-4">
                        {!notification.read_at && (
                          <Badge variant="primary" size="sm">New</Badge>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(notification.id);
                          }}
                          className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} className="text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-blue-100">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

// Helper components for icons
const TicketIcon = ({ size }: { size: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12a10 10 0 1 0 20 0 10 10 0 1 0-20 0Z" />
    <path d="M12 2v4" />
    <path d="M12 18v4" />
  </svg>
);

const BriefcaseIcon = ({ size }: { size: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);