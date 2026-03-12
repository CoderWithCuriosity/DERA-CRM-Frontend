import React, { useState } from 'react';
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
  Mail,
  Calendar,
  Ticket
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { GlassCard } from '../ui/GlassCard';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const notifications = [
    { id: 1, type: 'ticket', message: 'New ticket assigned to you', time: '5 min ago', read: false },
    { id: 2, type: 'deal', message: 'Deal "Enterprise Plan" was won!', time: '1 hour ago', read: false },
    { id: 3, type: 'activity', message: 'Meeting with Sarah in 30 minutes', time: '2 hours ago', read: true },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  return (
    <header className="bg-white/70 backdrop-blur-md border-b border-blue-100/50 px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Left section - could include mobile menu toggle if needed */}
        <div className="flex items-center lg:hidden">
          <Button variant="ghost" size="sm">
            <Menu size={20} />
          </Button>
        </div>

        {/* Search bar - hidden on mobile, visible on md and up */}
        <div className="hidden md:block flex-1 max-w-md">
          <form onSubmit={handleSearch}>
            <Input
              placeholder="Search contacts, deals, tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search size={18} className="text-gray-400" />}
              className="bg-white/50"
            />
          </form>
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
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs flex items-center justify-center rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-80 z-50"
                >
                  <GlassCard className="p-4" intensity="heavy">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-deep-ink">Notifications</h3>
                      {unreadCount > 0 && (
                        <button className="text-xs text-primary hover:text-primary-600">
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className={`p-3 rounded-lg transition-colors ${
                              notif.read ? 'bg-transparent' : 'bg-blue-50/50'
                            } hover:bg-blue-100/50 cursor-pointer`}
                          >
                            <div className="flex items-start space-x-3">
                              <div className={`p-1.5 rounded-lg ${
                                notif.type === 'ticket' ? 'bg-orange-100 text-orange-600' :
                                notif.type === 'deal' ? 'bg-green-100 text-green-600' :
                                'bg-purple-100 text-purple-600'
                              }`}>
                                {notif.type === 'ticket' ? <Ticket size={14} /> :
                                 notif.type === 'deal' ? <Mail size={14} /> :
                                 <Calendar size={14} />}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm text-deep-ink">{notif.message}</p>
                                <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
                              </div>
                              {!notif.read && (
                                <div className="w-2 h-2 bg-primary rounded-full"></div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-4">No notifications</p>
                      )}
                    </div>
                    <div className="mt-3 pt-3 border-t border-blue-100">
                      <button className="text-sm text-primary hover:text-primary-600 w-full text-center">
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
                      to="/settings"
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <Settings size={16} />
                      <span>Settings</span>
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

      {/* Mobile search - visible only on small screens */}
      <div className="mt-3 md:hidden">
        <form onSubmit={handleSearch}>
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search size={18} className="text-gray-400" />}
            className="bg-white/50"
          />
        </form>
      </div>
    </header>
  );
}