// src/components/layout/Header.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Bell,
  Menu,
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
  X
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { GlassCard } from '../ui/GlassCard';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { notificationsApi } from '../../api/notifications';
import { messagesApi } from '../../api/messages';
import { contactsApi } from '../../api/contacts';
import { dealsApi } from '../../api/deals';
import { ticketsApi } from '../../api/tickets';
import { activitiesApi } from '../../api/activities';
import type { Notification as NotificationType } from '../../types/notification';
import { formatDate } from '../../utils/formatters';
import { useDebounce } from '../../hooks/useDebounce';

interface SearchResult {
  id: number;
  type: 'contact' | 'deal' | 'ticket' | 'activity';
  title: string;
  subtitle: string;
  url: string;
  icon: React.ReactNode;
  avatar?: string;
}

export function Header() {
  const { user, logout } = useAuth();
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
  
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debouncedSearch = useDebounce(searchQuery, 300);

  const totalUnreadCount = notificationCount + messageCount;

  // Perform search when debounced query changes
  useEffect(() => {
    if (debouncedSearch.trim().length >= 2) {
      performSearch();
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [debouncedSearch]);

  // Close search results when clicking outside
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

  // Handle keyboard navigation
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
      // Search in parallel across all endpoints
      const [contactsRes, dealsRes, ticketsRes, activitiesRes] = await Promise.allSettled([
        contactsApi.getContacts({ search: debouncedSearch, limit: 5 }),
        dealsApi.getDeals({ search: debouncedSearch, limit: 5 }),
        ticketsApi.getTickets({ search: debouncedSearch, limit: 5 }),
        activitiesApi.getActivities({ search: debouncedSearch, limit: 5 })
      ]);

      const results: SearchResult[] = [];

      // Process contacts
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

      // Process deals
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

      // Process tickets
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

      // Process activities
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

      setSearchResults(results.slice(0, 10)); // Limit to 10 results
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
    if (type.includes('ticket')) return 'bg-orange-100 text-orange-600';
    if (type.includes('deal')) return 'bg-green-100 text-green-600';
    if (type.includes('message')) return 'bg-blue-100 text-blue-600';
    if (type.includes('activity')) return 'bg-purple-100 text-purple-600';
    if (type.includes('warning') || type.includes('breach')) return 'bg-red-100 text-red-600';
    if (type.includes('completed')) return 'bg-teal-100 text-teal-600';
    return 'bg-gray-100 text-gray-600';
  };

  const getResultTypeStyles = (type: string) => {
    switch (type) {
      case 'contact':
        return 'bg-blue-100 text-blue-600';
      case 'deal':
        return 'bg-green-100 text-green-600';
      case 'ticket':
        return 'bg-orange-100 text-orange-600';
      case 'activity':
        return 'bg-purple-100 text-purple-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  useEffect(() => {
    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (showNotifications) {
      fetchNotifications();
    }
  }, [showNotifications]);

  return (
    <header className="bg-white/70 backdrop-blur-md border-b border-blue-100/50 px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Left section - mobile menu toggle */}
        <div className="flex items-center lg:hidden">
          <Button variant="ghost" size="sm">
            <Menu size={20} />
          </Button>
        </div>

        {/* Search bar with results dropdown */}
        <div className="hidden md:block flex-1 max-w-md relative" ref={searchRef}>
          <form onSubmit={(e) => { e.preventDefault(); if (searchResults.length > 0) handleResultClick(searchResults[0]); }}>
            <div className="relative">
              <Input
                ref={searchInputRef}
                placeholder="Search contacts, deals, tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
                leftIcon={<Search size={18} className="text-gray-400" />}
                rightIcon={
                  searchQuery ? (
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X size={16} />
                    </button>
                  ) : searching ? (
                    <Loader2 size={16} className="animate-spin text-gray-400" />
                  ) : null
                }
                className="bg-white/50"
              />
            </div>
          </form>

          {/* Search Results Dropdown */}
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
                      <Loader2 size={24} className="animate-spin text-primary mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Searching...</p>
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="px-4 py-6 text-center">
                      <Search size={24} className="mx-auto text-gray-300 mb-2" />
                      <p className="text-sm text-gray-500">No results found</p>
                      <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
                    </div>
                  ) : (
                    <>
                      <div className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Search Results ({searchResults.length})
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {searchResults.map((result, index) => (
                          <button
                            key={`${result.type}-${result.id}`}
                            onClick={() => handleResultClick(result)}
                            className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                              index === selectedIndex ? 'bg-primary/10' : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className={`p-2 rounded-lg shrink-0 ${getResultTypeStyles(result.type)}`}>
                              {result.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-deep-ink truncate">{result.title}</p>
                              <p className="text-xs text-gray-500 truncate">{result.subtitle}</p>
                            </div>
                            <div className="text-xs text-gray-400 capitalize">
                              {result.type}
                            </div>
                          </button>
                        ))}
                      </div>
                      <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-400">
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

        {/* Right section - notifications and profile */}
        <div className="flex items-center space-x-3">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-600 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Bell size={20} />
              {totalUnreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs flex items-center justify-center rounded-full">
                  {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
                </span>
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
                      <h3 className="font-semibold text-deep-ink">Notifications</h3>
                      {notificationCount > 0 && (
                        <button
                          onClick={handleMarkAllAsRead}
                          disabled={markingAll}
                          className="text-xs text-primary hover:text-primary-600 transition-colors"
                        >
                          {markingAll ? 'Marking...' : 'Mark all as read'}
                        </button>
                      )}
                    </div>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className={`p-3 rounded-lg transition-colors cursor-pointer ${
                              !notif.read_at ? 'bg-blue-50/50' : 'bg-transparent'
                            } hover:bg-blue-100/50`}
                          >
                            <div className="flex items-start space-x-3">
                              <div className={`p-1.5 rounded-lg shrink-0 ${getNotificationBg(notif.type)}`}>
                                {getNotificationIcon(notif.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-deep-ink truncate">{notif.title}</p>
                                <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{notif.body}</p>
                                <p className="text-xs text-gray-400 mt-1">{formatDate(notif.created_at)}</p>
                              </div>
                              {!notif.read_at && (
                                <div className="w-2 h-2 bg-primary rounded-full shrink-0 mt-2"></div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <Bell size={32} className="mx-auto text-gray-300 mb-2" />
                          <p className="text-sm text-gray-500">No notifications</p>
                          <p className="text-xs text-gray-400">You're all caught up!</p>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 pt-3 border-t border-blue-100">
                      <button
                        onClick={handleViewAllNotifications}
                        className="text-sm text-primary hover:text-primary-600 w-full text-center transition-colors"
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
              className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-linear-to-br from-primary to-accent flex items-center justify-center text-white text-sm font-medium">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-deep-ink">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
              <ChevronDown size={16} className="text-gray-500" />
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
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <User size={16} />
                      <span>Your Profile</span>
                    </Link>
                    <Link
                      to="/settings/organization"
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <Settings size={16} />
                      <span>Organization</span>
                    </Link>
                    <hr className="my-2 border-blue-100" />
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        logout();
                      }}
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                    >
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </GlassCard>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Mobile search */}
      <div className="mt-3 md:hidden">
        <div className="relative" ref={searchRef}>
          <Input
            placeholder="Search contacts, deals, tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
            leftIcon={<Search size={18} className="text-gray-400" />}
            rightIcon={
              searchQuery ? (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              ) : searching ? (
                <Loader2 size={16} className="animate-spin text-gray-400" />
              ) : null
            }
            className="bg-white/50"
          />

          {/* Mobile search results - similar to desktop but simplified */}
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
                      <Loader2 size={24} className="animate-spin text-primary mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Searching...</p>
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="px-4 py-6 text-center">
                      <Search size={24} className="mx-auto text-gray-300 mb-2" />
                      <p className="text-sm text-gray-500">No results found</p>
                    </div>
                  ) : (
                    <div className="max-h-80 overflow-y-auto">
                      {searchResults.map((result) => (
                        <button
                          key={`${result.type}-${result.id}`}
                          onClick={() => handleResultClick(result)}
                          className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                        >
                          <div className={`p-2 rounded-lg shrink-0 ${getResultTypeStyles(result.type)}`}>
                            {result.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-deep-ink truncate">{result.title}</p>
                            <p className="text-xs text-gray-500 truncate">{result.subtitle}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}