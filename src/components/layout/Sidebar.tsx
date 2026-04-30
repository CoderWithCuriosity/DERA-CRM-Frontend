import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  Target, 
  Ticket, 
  Calendar,
  Mail,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  BarChart3,
  FileText,
  MessageSquare,
  Building2,
  Shield,
  Activity,
  UserCog,
  Database,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../hooks/useAuth';
import { messagesApi } from '../../api/messages';
import { notificationsApi } from '../../api/notifications';

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  badge?: number;
  roles?: Array<'admin' | 'manager' | 'agent'>;
}

// Helper function to format badge display
const formatBadge = (count: number | undefined): string | null => {
  if (!count || count <= 0) return null;
  if (count > 99) return '99+';
  if (count > 9) return count.toString();
  return count.toString();
};

// Helper function to get user initials
const getUserInitials = (firstName: string, lastName: string): string => {
  const firstInitial = firstName?.[0] || '';
  const lastInitial = lastName?.[0] || '';
  return `${firstInitial}${lastInitial}`.toUpperCase();
};

// Helper function to check if avatar URL is valid
const isValidAvatar = (avatar: string | null | undefined): boolean => {
  if (!avatar) return false;
  if (avatar === 'null') return false;
  if (avatar === 'undefined') return false;
  if (avatar === '') return false;
  // Check if it's a valid URL string
  try {
    new URL(avatar);
    return true;
  } catch {
    return false;
  }
};

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(true);
  const location = useLocation();
  const { user, logout } = useAuth();
  const [messageCount, setMessageCount] = useState(0);
  const [avatarError, setAvatarError] = useState(false);

  // Fetch unread counts
  const fetchUnreadCounts = async () => {
    if (!user) return;
    
    try {
      const messagesRes = await messagesApi.getUnreadCount();
      setMessageCount(messagesRes.data.unread_count);
    } catch (error) {
      console.error('Failed to fetch unread counts:', error);
    }
  };

  useEffect(() => {
    fetchUnreadCounts();
    const interval = setInterval(fetchUnreadCounts, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Reset avatar error when user or avatar changes
  useEffect(() => {
    setAvatarError(false);
  }, [user?.avatar]);

  // Define all navigation items with their role requirements
  const navigationItems: NavItem[] = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['admin', 'manager', 'agent'] },
    { name: 'Contacts', path: '/contacts', icon: Users, roles: ['admin', 'manager', 'agent'] },
    { name: 'Deals', path: '/deals', icon: Target, roles: ['admin', 'manager', 'agent'] },
    { name: 'Tickets', path: '/tickets', icon: Ticket, roles: ['admin', 'manager', 'agent'] },
    { name: 'Activities', path: '/activities', icon: Calendar, roles: ['admin', 'manager', 'agent'] },
    { name: 'Campaigns', path: '/campaigns', icon: Mail, roles: ['admin', 'manager', 'agent'] },
    { name: 'Documents', path: '/documents', icon: FileText, roles: ['admin', 'manager', 'agent'] },
    { name: 'Messages', path: '/messages', icon: MessageSquare, badge: messageCount, roles: ['admin', 'manager', 'agent'] },
    // { name: 'Reports', path: '/reports', icon: BarChart3, roles: ['admin', 'manager'] },
    { name: 'Profile', path: '/settings/profile', icon: Settings, roles: ['admin', 'manager', 'agent'] },
    { name: 'Organization', path: '/settings/organization', icon: Building2, roles: ['admin'] },
    { name: 'User Management', path: '/settings/users', icon: UserCog, roles: ['admin'] },
    { name: 'Audit Logs', path: '/admin/audit-logs', icon: Activity, roles: ['admin'] },
    { name: 'System Health', path: '/admin/system-health', icon: Shield, roles: ['admin'] },
    { name: 'Backups', path: '/admin/backups', icon: Database, roles: ['admin'] },
  ];

  // Filter navigation based on user role
  const navigation = navigationItems.filter(item => {
    if (!user) return false;
    return item.roles?.includes(user.role);
  });

  const hasRole = (role: 'admin' | 'manager' | 'agent') => user?.role === role;
  const isAdmin = hasRole('admin');
  const isManager = hasRole('manager');

  const mainNav = navigation.filter(item => 
    !item.path.startsWith('/settings') && !item.path.startsWith('/admin')
  );
  
  const settingsNav = navigation.filter(item => 
    item.path.startsWith('/settings')
  );
  
  const adminNav = navigation.filter(item => 
    item.path.startsWith('/admin')
  );

  const renderNavSection = (items: NavItem[], showTitle: boolean = false, title?: string) => {
    if (items.length === 0) return null;

    return (
      <div className="mb-4">
        {!collapsed && showTitle && title && (
          <p className="px-4 mb-2 text-xs font-semibold text-blue-300 uppercase tracking-wider">
            {title}
          </p>
        )}
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          const badgeText = formatBadge(item.badge);
          const hasBadge = badgeText !== null;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center mx-2 px-3 py-2 rounded-xl transition-all duration-200 group relative',
                isActive 
                  ? 'bg-linear-to-r from-primary to-accent text-white' 
                  : 'text-blue-200 hover:bg-blue-800/30 hover:text-white'
              )}
            >
              <Icon size={20} />
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="ml-3 flex-1"
                  >
                    {item.name}
                  </motion.span>
                )}
              </AnimatePresence>
              {hasBadge && !collapsed && (
                <span className="ml-2 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full min-w-5 text-center">
                  {badgeText}
                </span>
              )}
              {hasBadge && collapsed && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs flex items-center justify-center rounded-full">
                  {badgeText}
                </div>
              )}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-deep-ink text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                  {item.name}
                  {hasBadge && badgeText && (
                    <span className="ml-2 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full">
                      {badgeText}
                    </span>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    );
  };

  // Determine if we should show the avatar image or fallback
  const hasValidAvatar = isValidAvatar(user?.avatar) && !avatarError;
  const userInitials = user ? getUserInitials(user.first_name || '', user.last_name || '') : 'U';

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 240 }}
      className="h-screen bg-deep-ink text-white relative flex flex-col"
    >
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-blue-800/30">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center space-x-2"
            >
              <div className="w-8 h-8 bg-linear-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">D</span>
              </div>
              <span className="font-bold text-xl">DERA CRM</span>
            </motion.div>
          )}
          {collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-8 h-8 bg-linear-to-br from-primary to-accent rounded-lg flex items-center justify-center mx-auto"
            >
              <span className="text-white font-bold text-lg">D</span>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-blue-800/50 transition-colors"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {renderNavSection(mainNav)}
        
        {settingsNav.length > 0 && (
          <>
            <div className="border-t border-blue-800/30 my-4" />
            {renderNavSection(settingsNav, true, 'Settings')}
          </>
        )}
        
        {adminNav.length > 0 && (
          <>
            <div className="border-t border-blue-800/30 my-4" />
            {renderNavSection(adminNav, true, 'Administration')}
          </>
        )}
      </nav>

      {/* User Profile */}
      <div className="border-t border-blue-800/30 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-linear-to-br from-primary to-accent flex items-center justify-center shrink-0 overflow-hidden">
              {hasValidAvatar ? (
                <img 
                  src={user!.avatar!}
                  alt={`${user?.first_name || ''} ${user?.last_name || ''}`}
                  className="w-full h-full rounded-full object-cover"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <span className="text-white font-medium text-sm">
                  {userInitials}
                </span>
              )}
            </div>
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 min-w-0"
                >
                  <p className="font-medium truncate">
                    {user?.first_name || ''} {user?.last_name || ''}
                  </p>
                  <div className="flex items-center space-x-2">
                    <p className="text-xs text-blue-300 capitalize truncate">
                      {user?.role || 'User'}
                    </p>
                    {isAdmin && (
                      <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-300 rounded text-[10px] font-medium whitespace-nowrap">
                        Admin
                      </span>
                    )}
                    {isManager && (
                      <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-300 rounded text-[10px] font-medium whitespace-nowrap">
                        Manager
                      </span>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {!collapsed && (
            <button
              onClick={logout}
              className="p-2 rounded-lg hover:bg-blue-800/50 transition-colors text-blue-300 hover:text-white shrink-0"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>

        {/* Last login info - only when expanded */}
        {!collapsed && user?.last_login && (
          <p className="text-xs text-blue-400/60 mt-2 truncate">
            Last login: {new Date(user.last_login).toLocaleDateString()}
          </p>
        )}

        {/* Collapsed logout button */}
        {collapsed && (
          <button
            onClick={logout}
            className="mt-3 w-full p-2 rounded-lg hover:bg-blue-800/50 transition-colors text-blue-300 hover:text-white flex justify-center"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        )}
      </div>
    </motion.aside>
  );
}