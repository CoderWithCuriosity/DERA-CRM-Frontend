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
import { organizationApi } from '../../api/organization';

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  badge?: number;
  roles?: Array<'admin' | 'manager' | 'agent'>;
}

interface Organization {
  id: number;
  company_name: string;
  company_logo: string | null;
}

const formatBadge = (count: number | undefined): string | null => {
  if (!count || count <= 0) return null;
  if (count > 99) return '99+';
  if (count > 9) return count.toString();
  return count.toString();
};

const getUserInitials = (firstName: string, lastName: string): string => {
  const firstInitial = firstName?.[0] || '';
  const lastInitial = lastName?.[0] || '';
  return `${firstInitial}${lastInitial}`.toUpperCase();
};

const isValidAvatar = (avatar: string | null | undefined): boolean => {
  if (!avatar) return false;
  if (avatar === 'null' || avatar === 'undefined' || avatar === '') return false;
  try { new URL(avatar); return true; } catch { return false; }
};

interface NavItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  collapsed: boolean;
  badge?: number;
  isActive: boolean;
  onClick?: () => void;
}

function NavItem({ to, icon: Icon, label, collapsed, badge, isActive, onClick }: NavItemProps) {
  const badgeText = formatBadge(badge);
  const hasBadge = badgeText !== null;

  return (
    <Link to={to} onClick={onClick}>
      <div
        className={cn(
          'flex items-center gap-2.5 px-2.5 py-1.5 rounded-[var(--radius-md)]',
          'transition-all duration-[120ms] cursor-pointer select-none group relative',
          isActive
            ? 'bg-[var(--sidebar-item-active)] text-[var(--sidebar-text-active)]'
            : 'text-[var(--sidebar-text)] hover:bg-[var(--sidebar-item-hover)] hover:text-[var(--sidebar-text-active)]'
        )}
      >
        <Icon
          style={{
            width: 15,
            height: 15,
            flexShrink: 0,
            color: isActive ? 'var(--sidebar-icon-active)' : 'var(--sidebar-icon)',
            transition: 'color 120ms',
          }}
        />
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.15 }}
              className="text-[13px] font-medium whitespace-nowrap overflow-hidden flex-1"
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
        {hasBadge && !collapsed && (
          <span className="ml-auto px-1.5 py-0.5 text-[10px] font-medium bg-[var(--danger)] text-white rounded-full min-w-5 text-center">
            {badgeText}
          </span>
        )}
        {hasBadge && collapsed && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--danger)] text-white text-[10px] font-medium flex items-center justify-center rounded-full">
            {badgeText}
          </div>
        )}
        {collapsed && (
          <div className="absolute left-full ml-2 px-2 py-1 bg-[var(--bg-base)] text-[var(--text-primary)] text-[13px] rounded-[var(--radius-md)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-popover border border-[var(--border-default)]">
            {label}
            {hasBadge && badgeText && (
              <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-[var(--danger)] text-white rounded-full">
                {badgeText}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [logoError, setLogoError] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  const [messageCount, setMessageCount] = useState(0);
  const [avatarError, setAvatarError] = useState(false);

  const fetchUnreadCounts = async () => {
    if (!user) return;
    try {
      const messagesRes = await messagesApi.getUnreadCount();
      setMessageCount(messagesRes.data.unread_count);
    } catch (error) {
      console.error('Failed to fetch unread counts:', error);
    }
  };

  const fetchOrganization = async () => {
    try {
      const response = await organizationApi.getSettings();
      setOrganization(response.data);
      setLogoError(false);
    } catch (error) {
      console.error('Failed to fetch organization:', error);
    }
  };

  useEffect(() => {
    fetchUnreadCounts();
    fetchOrganization();
    const interval = setInterval(fetchUnreadCounts, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    setAvatarError(false);
  }, [user?.avatar]);

  useEffect(() => {
    setLogoError(false);
  }, [organization?.company_logo]);

  const navigationItems: NavItem[] = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['admin', 'manager', 'agent'] },
    { name: 'Contacts', path: '/contacts', icon: Users, roles: ['admin', 'manager', 'agent'] },
    { name: 'Deals', path: '/deals', icon: Target, roles: ['admin', 'manager', 'agent'] },
    { name: 'Tickets', path: '/tickets', icon: Ticket, roles: ['admin', 'manager', 'agent'] },
    { name: 'Activities', path: '/activities', icon: Calendar, roles: ['admin', 'manager', 'agent'] },
    { name: 'Campaigns', path: '/campaigns', icon: Mail, roles: ['admin', 'manager', 'agent'] },
    { name: 'Documents', path: '/documents', icon: FileText, roles: ['admin', 'manager', 'agent'] },
    { name: 'Messages', path: '/messages', icon: MessageSquare, badge: messageCount, roles: ['admin', 'manager', 'agent'] },
    { name: 'Reports', path: '/reports', icon: BarChart3, roles: ['admin', 'manager'] },
    { name: 'Profile', path: '/settings/profile', icon: Settings, roles: ['admin', 'manager', 'agent'] },
    { name: 'Organization', path: '/settings/organization', icon: Building2, roles: ['admin'] },
    { name: 'User Management', path: '/settings/users', icon: UserCog, roles: ['admin'] },
    { name: 'Audit Logs', path: '/admin/audit-logs', icon: Activity, roles: ['admin'] },
    { name: 'System Health', path: '/admin/system-health', icon: Shield, roles: ['admin'] },
    { name: 'Backups', path: '/admin/backups', icon: Database, roles: ['admin'] },
  ];

  const navigation = navigationItems.filter(item => {
    if (!user) return false;
    return item.roles?.includes(user.role);
  });

  const mainNav = navigation.filter(item => 
    !item.path.startsWith('/settings') && !item.path.startsWith('/admin')
  );
  const settingsNav = navigation.filter(item => item.path.startsWith('/settings'));
  const adminNav = navigation.filter(item => item.path.startsWith('/admin'));

  const hasValidAvatar = isValidAvatar(user?.avatar) && !avatarError;
  const userInitials = user ? getUserInitials(user.first_name || '', user.last_name || '') : 'U';

  // Organization logo logic
  const serverApiUrl = import.meta.env.VITE_API_URL || '';
  const hasValidLogo = organization?.company_logo && !logoError;
  const orgInitials = organization?.company_name?.slice(0, 2).toUpperCase() || 'DC';

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 52 : 220 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col h-screen overflow-hidden flex-shrink-0 bg-sidebar border-r border-[var(--sidebar-border)]"
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-3 h-12 border-b border-[var(--sidebar-border)] flex-shrink-0">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              {/* Logo image or fallback */}
              <div className="w-6 h-6 rounded-[var(--radius-md)] flex items-center justify-center overflow-hidden bg-[var(--accent)]">
                {hasValidLogo ? (
                  <img 
                    src={serverApiUrl.replace(/\/api$/, '') + organization.company_logo}
                    alt={organization?.company_name || 'Logo'}
                    className="w-full h-full object-cover"
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <span className="text-white text-[11px] font-bold">
                    {orgInitials}
                  </span>
                )}
              </div>
              <span className="text-[13px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
                {organization?.company_name || 'DERA CRM'}
              </span>
            </motion.div>
          )}
          {collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-6 h-6 rounded-[var(--radius-md)] flex items-center justify-center overflow-hidden bg-[var(--accent)] mx-auto"
            >
              {hasValidLogo ? (
                <img 
                  src={serverApiUrl.replace(/\/api$/, '') + organization.company_logo}
                  alt={organization?.company_name || 'Logo'}
                  className="w-full h-full object-cover"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <span className="text-white text-[11px] font-bold">
                  {orgInitials}
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-[var(--radius-md)] hover:bg-[var(--sidebar-item-hover)] transition-colors"
          style={{ color: 'var(--sidebar-icon)' }}
        >
          <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronLeft style={{ width: 14, height: 14 }} />
          </motion.div>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {mainNav.map((item) => (
          <NavItem
            key={item.path}
            to={item.path}
            icon={item.icon}
            label={item.name}
            collapsed={collapsed}
            badge={item.badge}
            isActive={location.pathname === item.path}
          />
        ))}

        {settingsNav.length > 0 && (
          <>
            <div className="my-2 border-t border-[var(--sidebar-border)]" />
            {settingsNav.map((item) => (
              <NavItem
                key={item.path}
                to={item.path}
                icon={item.icon}
                label={item.name}
                collapsed={collapsed}
                isActive={location.pathname === item.path}
              />
            ))}
          </>
        )}

        {adminNav.length > 0 && (
          <>
            <div className="my-2 border-t border-[var(--sidebar-border)]" />
            {adminNav.map((item) => (
              <NavItem
                key={item.path}
                to={item.path}
                icon={item.icon}
                label={item.name}
                collapsed={collapsed}
                isActive={location.pathname === item.path}
              />
            ))}
          </>
        )}
      </nav>

      {/* User Profile */}
      <div className="border-t border-[var(--sidebar-border)] p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-[var(--accent-subtle)] flex items-center justify-center shrink-0 overflow-hidden">
              {hasValidAvatar ? (
                <img 
                  src={user!.avatar!}
                  alt={`${user?.first_name || ''} ${user?.last_name || ''}`}
                  className="w-full h-full object-cover"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <span className="text-[11px] font-semibold text-[var(--accent-text)]">
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
                  <p className="text-[12px] font-medium text-[var(--text-primary)] truncate">
                    {user?.first_name || ''} {user?.last_name || ''}
                  </p>
                  <p className="text-[11px] text-[var(--text-tertiary)] truncate capitalize">
                    {user?.role || 'User'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {!collapsed && (
            <button
              onClick={logout}
              className="p-1 rounded-[var(--radius-md)] hover:bg-[var(--sidebar-item-hover)] transition-colors text-[var(--sidebar-icon)]"
            >
              <LogOut size={14} />
            </button>
          )}
        </div>
        {collapsed && (
          <button
            onClick={logout}
            className="mt-2 w-full p-1.5 rounded-[var(--radius-md)] hover:bg-[var(--sidebar-item-hover)] transition-colors text-[var(--sidebar-icon)] flex justify-center"
          >
            <LogOut size={14} />
          </button>
        )}
      </div>
    </motion.aside>
  );
}