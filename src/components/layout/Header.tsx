import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Bell,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Calendar,
  Ticket,
  CheckCircle,
  Target,
  MessageSquare,
  Users,
  Briefcase,
  Loader2,
  X,
  Sun,
  Moon,
  Monitor,
  Power,
  PowerOff
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { GlassCard } from '../ui/GlassCard';
import { Input } from '../ui/Input';
import { notificationsApi } from '../../api/notifications';
import { messagesApi } from '../../api/messages';
import { contactsApi } from '../../api/contacts';
import { dealsApi } from '../../api/deals';
import { ticketsApi } from '../../api/tickets';
import { activitiesApi } from '../../api/activities';
import type { Notification as NotificationType } from '../../types/notification';
import { formatDate } from '../../utils/formatters';
import { useDebounce } from '../../hooks/useDebounce';

// Add this to localStorage key
const POLLING_ENABLED_KEY = 'dashboard_polling_enabled';

interface SearchResult {
  id: number;
  type: 'contact' | 'deal' | 'ticket' | 'activity';
  title: string;
  subtitle: string;
  url: string;
  icon: React.ReactNode;
  avatar?: string;
}

// Helper function to validate avatar URL
const isValidAvatar = (avatar: string | null | undefined): boolean => {
  if (!avatar) return false;
  if (avatar === 'null' || avatar === 'undefined' || avatar === '') return false;
  avatar = avatar.includes(import.meta.env.VITE_API_URL || '')
                    ? avatar
                    : `${import.meta.env.VITE_API_URL.replace(/\/api$/, '')}${avatar}`;
  try { new URL(avatar); return true; } catch { return false; }
};

// Helper function to get user initials
const getUserInitials = (firstName: string, lastName: string): string => {
  const firstInitial = firstName?.[0] || '';
  const lastInitial = lastName?.[0] || '';
  return `${firstInitial}${lastInitial}`.toUpperCase();
};

export function Header() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [notificationCount, setNotificationCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [markingAll, setMarkingAll] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  // NEW: Polling toggle state (default: false = OFF to save traffic)
  const [pollingEnabled, setPollingEnabled] = useState(() => {
    const saved = localStorage.getItem(POLLING_ENABLED_KEY);
    return saved === 'true'; // Default to false if not set
  });

  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debouncedSearch = useDebounce(searchQuery, 300);

  const totalUnreadCount = notificationCount + messageCount;

  // Get API URL for avatar
  const server_api_url = import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || '';

  // Reset avatar error when user avatar changes
  useEffect(() => {
    setAvatarError(false);
  }, [user?.avatar]);

  // NEW: Toggle polling function
  const togglePolling = () => {
    const newState = !pollingEnabled;
    setPollingEnabled(newState);
    localStorage.setItem(POLLING_ENABLED_KEY, String(newState));

    // If turning ON, fetch counts immediately
    if (newState) {
      fetchCounts();
    } else {
      // If turning OFF, clear counts (optional)
      console.log('Polling disabled - saving traffic');
    }
  };

  // Search effect (unchanged)
  useEffect(() => {
    if (debouncedSearch.trim().length >= 2) {
      performSearch();
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [debouncedSearch]);

  // Click outside handler (unchanged)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
        setSelectedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard handler (unchanged)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showSearchResults || searchResults.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % searchResults.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + searchResults.length) % searchResults.length);
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && searchResults[selectedIndex]) {
            handleResultClick(searchResults[selectedIndex]);
          }
          break;
        case 'Escape':
          setShowSearchResults(false);
          setSelectedIndex(-1);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showSearchResults, searchResults, selectedIndex]);

  const performSearch = async () => {
    if (!debouncedSearch.trim() || debouncedSearch.trim().length < 2) return;

    setSearching(true);
    setShowSearchResults(true);
    setSelectedIndex(-1);

    try {
      const [contactsRes, dealsRes, ticketsRes, activitiesRes] = await Promise.allSettled([
        contactsApi.getContacts({ search: debouncedSearch, limit: 5 }),
        dealsApi.getDeals({ search: debouncedSearch, limit: 5 }),
        ticketsApi.getTickets({ search: debouncedSearch, limit: 5 }),
        activitiesApi.getActivities({ search: debouncedSearch, limit: 5 })
      ]);

      const results: SearchResult[] = [];

      if (contactsRes.status === 'fulfilled' && contactsRes.value.data?.data) {
        contactsRes.value.data.data.forEach((contact: any) => {
          results.push({
            id: contact.id,
            type: 'contact',
            title: `${contact.first_name} ${contact.last_name}`,
            subtitle: contact.email || contact.company || 'Contact',
            url: `/contacts/${contact.id}`,
            icon: <Users size={14} />,
            avatar: contact.avatar
          });
        });
      }

      if (dealsRes.status === 'fulfilled' && dealsRes.value.data?.data) {
        dealsRes.value.data.data.forEach((deal: any) => {
          results.push({
            id: deal.id,
            type: 'deal',
            title: deal.name,
            subtitle: `$${deal.amount?.toLocaleString()} • ${deal.stage}`,
            url: `/deals/${deal.id}`,
            icon: <Briefcase size={14} />
          });
        });
      }

      if (ticketsRes.status === 'fulfilled' && ticketsRes.value.data?.data) {
        ticketsRes.value.data.data.forEach((ticket: any) => {
          results.push({
            id: ticket.id,
            type: 'ticket',
            title: ticket.subject,
            subtitle: `${ticket.ticket_number} • ${ticket.status} • ${ticket.priority}`,
            url: `/tickets/${ticket.id}`,
            icon: <Ticket size={14} />
          });
        });
      }

      if (activitiesRes.status === 'fulfilled' && activitiesRes.value.data?.data) {
        activitiesRes.value.data.data.forEach((activity: any) => {
          results.push({
            id: activity.id,
            type: 'activity',
            title: activity.subject,
            subtitle: `${activity.type} • ${activity.status}`,
            url: `/activities/${activity.id}`,
            icon: <Calendar size={14} />
          });
        });
      }

      setSearchResults(results.slice(0, 10));
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    setSearchQuery('');
    setShowSearchResults(false);
    setSelectedIndex(-1);
    navigate(result.url);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setShowSearchResults(false);
    setSelectedIndex(-1);
    searchInputRef.current?.focus();
  };

  const fetchCounts = async () => {
    // ONLY fetch if polling is enabled
    if (!pollingEnabled) return;

    try {
      const [notificationsRes, messagesRes] = await Promise.all([
        notificationsApi.getNotifications({ limit: 1, unread_only: true }),
        messagesApi.getUnreadCount()
      ]);
      setNotificationCount(notificationsRes.data.unread_count);
      setMessageCount(messagesRes.data.unread_count);
    } catch (error) {
      console.error('Failed to fetch counts:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await notificationsApi.getNotifications({ limit: 5 });
      setNotifications(response.data.data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true);
    try {
      await notificationsApi.markAllAsRead();
      await fetchCounts();
      await fetchNotifications();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString(), is_read: true } : n)
      );
      setNotificationCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleNotificationClick = (notification: NotificationType) => {
    if (!notification.read_at) {
      handleMarkAsRead(notification.id);
    }

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
    setShowNotifications(false);
  };

  const handleViewAllNotifications = () => {
    setShowNotifications(false);
    navigate('/notifications');
  };

  const getNotificationIcon = (type: string) => {
    if (type.includes('ticket')) return <Ticket size={14} />;
    if (type.includes('deal')) return <Target size={14} />;
    if (type.includes('message')) return <MessageSquare size={14} />;
    if (type.includes('activity')) return <Calendar size={14} />;
    if (type.includes('completed') || type.includes('success')) return <CheckCircle size={14} />;
    return <Bell size={14} />;
  };

  const getNotificationBg = (type: string) => {
    if (type.includes('ticket')) return 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400';
    if (type.includes('deal')) return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
    if (type.includes('message')) return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
    if (type.includes('activity')) return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
    if (type.includes('warning') || type.includes('breach')) return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
    if (type.includes('completed')) return 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400';
    return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
  };

  const getResultTypeStyles = (type: string) => {
    switch (type) {
      case 'contact':
        return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
      case 'deal':
        return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
      case 'ticket':
        return 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400';
      case 'activity':
        return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
      default:
        return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  // MODIFIED: Polling effect with toggle control
  useEffect(() => {
    // Initial fetch only if polling is enabled
    if (pollingEnabled) {
      fetchCounts();
    }

    let interval: number | null = null;

    // Only set up interval if polling is enabled
    if (pollingEnabled) {
      interval = setInterval(() => {
        // Don't poll if tab is hidden (saves even more traffic)
        if (!document.hidden) {
          fetchCounts();
        }
      }, 30000); // 30 seconds
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [pollingEnabled]); // Re-run when toggle changes

  // Notifications fetch when dropdown opens (always works, but count might be stale)
  useEffect(() => {
    if (showNotifications) {
      fetchNotifications();
    }
  }, [showNotifications]);

  const themeOptions = [
    { value: 'light' as const, icon: Sun },
    { value: 'dark' as const, icon: Moon },
    { value: 'system' as const, icon: Monitor },
  ];

  // Check if avatar is valid and not errored
  const hasValidAvatar = isValidAvatar(user?.avatar) && !avatarError;
  const userInitials = user ? getUserInitials(user.first_name || '', user.last_name || '') : 'U';

  // Get avatar URL with proper API base
  const getAvatarUrl = () => {
    if (!user?.avatar) return null;
    // Check if it's already a full URL
    if (user.avatar.startsWith('http://') || user.avatar.startsWith('https://')) {
      return user.avatar;
    }
    // Otherwise prepend API base URL
    return `${server_api_url}${user.avatar}`;
  };

  const avatarUrl = getAvatarUrl();

  return (
    <header className="h-12 flex items-center gap-3 px-4 border-b border-[var(--border-default)] flex-shrink-0 bg-[var(--bg-base)]">
      {/* Search bar */}
      <div className="hidden md:block flex-1 max-w-md relative" ref={searchRef}>
        <form onSubmit={(e) => { e.preventDefault(); if (searchResults.length > 0) handleResultClick(searchResults[0]); }}>
          <div className="relative">
            <Input
              ref={searchInputRef}
              placeholder="Search contacts, deals, tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
              leftIcon={<Search size={13} className="text-[var(--text-tertiary)]" />}
              rightIcon={
                searchQuery ? (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                  >
                    <X size={13} />
                  </button>
                ) : searching ? (
                  <Loader2 size={13} className="animate-spin text-[var(--text-tertiary)]" />
                ) : null
              }
              className="h-7 text-[12px] pl-8"
            />
          </div>
        </form>

        <AnimatePresence>
          {showSearchResults && (searchResults.length > 0 || searching) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute top-full left-0 right-0 mt-2 z-50"
            >
              <GlassCard className="py-2 overflow-hidden" intensity="heavy">
                {searching ? (
                  <div className="px-4 py-6 text-center">
                    <Loader2 size={24} className="animate-spin text-[var(--accent)] mx-auto mb-2" />
                    <p className="text-sm text-[var(--text-secondary)]">Searching...</p>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="px-4 py-6 text-center">
                    <Search size={24} className="mx-auto text-[var(--text-tertiary)] mb-2" />
                    <p className="text-sm text-[var(--text-secondary)]">No results found</p>
                    <p className="text-xs text-[var(--text-tertiary)] mt-1">Try a different search term</p>
                  </div>
                ) : (
                  <>
                    <div className="px-3 py-1 text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                      Search Results ({searchResults.length})
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {searchResults.map((result, index) => (
                        <button
                          key={`${result.type}-${result.id}`}
                          onClick={() => handleResultClick(result)}
                          className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${index === selectedIndex ? 'bg-[var(--accent-subtle)]' : 'hover:bg-[var(--bg-subtle)]'
                            }`}
                        >
                          <div className={`p-2 rounded-lg shrink-0 ${getResultTypeStyles(result.type)}`}>
                            {result.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-[var(--text-primary)] truncate">{result.title}</p>
                            <p className="text-xs text-[var(--text-tertiary)] truncate">{result.subtitle}</p>
                          </div>
                          <div className="text-xs text-[var(--text-tertiary)] capitalize">
                            {result.type}
                          </div>
                        </button>
                      ))}
                    </div>
                    <div className="px-4 py-2 border-t border-[var(--border-default)] text-[10px] text-[var(--text-tertiary)]">
                      <span className="mr-3">↑↓ Navigate</span>
                      <span className="mr-3">↵ Select</span>
                      <span>Esc Close</span>
                    </div>
                  </>
                )}
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-1" />

      {/* NEW: Polling Toggle Switch */}
      <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-[var(--bg-subtle)]">
        <button
          onClick={togglePolling}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-all duration-200 text-xs font-medium ${pollingEnabled
              ? 'bg-[var(--accent)] text-white'
              : 'bg-[var(--bg-base)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          title={pollingEnabled ? 'Live updates ON - Click to save traffic' : 'Live updates OFF - Click to enable notifications'}
        >
          {pollingEnabled ? (
            <>
              <Power size={12} />
              <span>Live ON</span>
            </>
          ) : (
            <>
              <PowerOff size={12} />
              <span>Live OFF</span>
            </>
          )}
        </button>
      </div>

      {/* Theme Switcher */}
      <div className="flex items-center gap-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-subtle)] p-0.5">
        {themeOptions.map(({ value, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className={`
        h-7 w-7 flex items-center justify-center rounded-md transition-all duration-150
        ${theme === value
                ? 'bg-[var(--accent)] text-white shadow-sm scale-95'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)]'
              }
      `}
            title={`${value.charAt(0).toUpperCase() + value.slice(1)} mode`}
          >
            <Icon size={14} />
          </button>
        ))}
      </div>

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative p-2 text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--bg-subtle)] rounded-lg transition-colors"
        >
          <Bell size={15} />
          {/* Only show badge if polling is enabled OR we have cached counts */}
          {totalUnreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--danger)] text-white text-[10px] flex items-center justify-center rounded-full">
              {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
            </span>
          )}
          {/* Show indicator when polling is OFF */}
          {!pollingEnabled && totalUnreadCount === 0 && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-[var(--text-tertiary)] rounded-full" />
          )}
        </button>

        <AnimatePresence>
          {showNotifications && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute right-0 mt-2 w-96 z-50"
            >
              <GlassCard className="p-4" intensity="heavy">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-[var(--text-primary)]">Notifications</h3>
                  {notificationCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      disabled={markingAll}
                      className="text-[11px] text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
                    >
                      {markingAll ? 'Marking...' : 'Mark all as read'}
                    </button>
                  )}
                </div>
                {/* Show warning banner when polling is OFF */}
                {!pollingEnabled && (
                  <div className="mb-3 p-2 rounded-lg bg-[var(--warning-subtle)] border border-[var(--warning)]">
                    <p className="text-xs text-[var(--warning-text)]">
                      ⚡ Live updates are OFF. Enable the "Live ON" switch to receive real-time notifications.
                    </p>
                  </div>
                )}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-3 rounded-lg transition-colors cursor-pointer ${!notif.read_at ? 'bg-[var(--accent-subtle)]' : 'bg-transparent'
                          } hover:bg-[var(--bg-subtle)]`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`p-1.5 rounded-lg shrink-0 ${getNotificationBg(notif.type)}`}>
                            {getNotificationIcon(notif.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[var(--text-primary)] truncate">{notif.title}</p>
                            <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-2">{notif.body}</p>
                            <p className="text-[10px] text-[var(--text-tertiary)] mt-1">{formatDate(notif.created_at)}</p>
                          </div>
                          {!notif.read_at && (
                            <div className="w-2 h-2 bg-[var(--accent)] rounded-full shrink-0 mt-2"></div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Bell size={32} className="mx-auto text-[var(--text-tertiary)] mb-2" />
                      <p className="text-sm text-[var(--text-secondary)]">No notifications</p>
                      <p className="text-xs text-[var(--text-tertiary)]">You're all caught up!</p>
                    </div>
                  )}
                </div>
                <div className="mt-3 pt-3 border-t border-[var(--border-default)]">
                  <button
                    onClick={handleViewAllNotifications}
                    className="text-sm text-[var(--accent)] hover:text-[var(--accent-hover)] w-full text-center transition-colors"
                  >
                    View all notifications
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Profile menu */}
      <div className="relative">
        <button
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-[var(--bg-subtle)] transition-colors group"
        >
          {/* Avatar with proper image handling */}
          <div className="w-7 h-7 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-xs font-medium overflow-hidden flex-shrink-0">
            {hasValidAvatar && avatarUrl ? (
              <img
                src={avatarUrl}
                alt={`${user?.first_name || ''} ${user?.last_name || ''}`}
                className="w-full h-full object-cover"
                onError={() => setAvatarError(true)}
              />
            ) : (
              <span className="text-xs font-semibold">
                {userInitials}
              </span>
            )}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-[11px] text-[var(--text-tertiary)] capitalize">{user?.role}</p>
          </div>
          <ChevronDown size={13} className="text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)] transition-colors" />
        </button>

        <AnimatePresence>
          {showProfileMenu && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute right-0 mt-2 w-48 z-50"
            >
              <GlassCard className="py-2" intensity="heavy">
                <Link
                  to="/settings/profile"
                  className="flex items-center space-x-2 px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
                  onClick={() => setShowProfileMenu(false)}
                >
                  <User size={14} />
                  <span>Your Profile</span>
                </Link>
                <Link
                  to="/settings/organization"
                  className="flex items-center space-x-2 px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
                  onClick={() => setShowProfileMenu(false)}
                >
                  <Settings size={14} />
                  <span>Organization</span>
                </Link>
                <hr className="my-2 border-[var(--border-default)]" />
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                  }}
                  className="flex items-center space-x-2 px-4 py-2 text-sm text-[var(--danger-text)] hover:bg-[var(--danger-subtle)] transition-colors w-full text-left"
                >
                  <LogOut size={14} />
                  <span>Logout</span>
                </button>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}