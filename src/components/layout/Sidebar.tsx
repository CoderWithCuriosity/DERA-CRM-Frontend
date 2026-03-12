import React, { useState } from 'react';
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
  Database
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../hooks/useAuth';

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  badge?: number;
  roles?: Array<'admin' | 'manager' | 'agent'>; // Which roles can see this item
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  // Define all navigation items with their role requirements
  const navigationItems: NavItem[] = [
    // Everyone can see these
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['admin', 'manager', 'agent'] },
    { name: 'Contacts', path: '/contacts', icon: Users, roles: ['admin', 'manager', 'agent'] },
    { name: 'Deals', path: '/deals', icon: Target, roles: ['admin', 'manager', 'agent'] },
    { name: 'Tickets', path: '/tickets', icon: Ticket, roles: ['admin', 'manager', 'agent'] },
    { name: 'Activities', path: '/activities', icon: Calendar, roles: ['admin', 'manager', 'agent'] },
    { name: 'Campaigns', path: '/campaigns', icon: Mail, roles: ['admin', 'manager', 'agent'] },
    { name: 'Reports', path: '/reports', icon: BarChart3, roles: ['admin', 'manager'] }, // Only admin and managers
    { name: 'Documents', path: '/documents', icon: FileText, roles: ['admin', 'manager', 'agent'] },
    { name: 'Messages', path: '/messages', icon: MessageSquare, roles: ['admin', 'manager', 'agent'] },
    
    // Settings - Profile for everyone
    { name: 'Profile', path: '/settings/profile', icon: Settings, roles: ['admin', 'manager', 'agent'] },
    
    // Admin only items
    { name: 'Organization', path: '/settings/organization', icon: Building2, roles: ['admin'] },
    { name: 'User Management', path: '/settings/users', icon: UserCog, roles: ['admin'] },
    { name: 'Audit Logs', path: '/admin/audit-logs', icon: Activity, roles: ['admin'] },
    { name: 'System Health', path: '/admin/system-health', icon: Shield, roles: ['admin'] },
    { name: 'Backups', path: '/admin/backups', icon: Database, roles: ['admin'] },
  ];

  // Filter navigation based on user role
  const navigation = navigationItems.filter(item => {
    // If user is not logged in, show nothing
    if (!user) return false;
    
    // Check if user's role is included in the item's allowed roles
    return item.roles?.includes(user.role);
  });

  // Helper function to check if user has specific role
  const hasRole = (role: 'admin' | 'manager' | 'agent') => user?.role === role;
  const isAdmin = hasRole('admin');
  const isManager = hasRole('manager');
  const isAgent = hasRole('agent');
  void isAgent;

  // Group navigation items for visual separation (optional)
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
              {item.badge && !collapsed && (
                <span className="px-2 py-0.5 text-xs bg-white/20 rounded-full">
                  {item.badge}
                </span>
              )}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-deep-ink text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                  {item.name}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    );
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 280 }}
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
              <div className="w-8 h-8 bg-linear-to-br from-primary to-accent rounded-lg" />
              <span className="font-bold text-xl">DERA CRM</span>
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
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-linear-to-br from-primary to-accent flex items-center justify-center">
            {user?.avatar ? (
              <img 
                src={user.avatar} 
                alt={`${user.first_name} ${user.last_name}`}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-white font-medium">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </span>
            )}
          </div>
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1"
              >
                <p className="font-medium truncate">
                  {user?.first_name} {user?.last_name}
                </p>
                <div className="flex items-center space-x-2">
                  <p className="text-xs text-blue-300 capitalize">
                    {user?.role}
                  </p>
                  {isAdmin && (
                    <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-300 rounded text-[10px] font-medium">
                      Admin
                    </span>
                  )}
                  {isManager && (
                    <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-300 rounded text-[10px] font-medium">
                      Manager
                    </span>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={logout}
            className="p-2 rounded-lg hover:bg-blue-800/50 transition-colors text-blue-300 hover:text-white"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>

        {/* Last login info - only when expanded */}
        {!collapsed && user?.last_login && (
          <p className="text-xs text-blue-400/60 mt-2 truncate">
            Last login: {new Date(user.last_login).toLocaleDateString()}
          </p>
        )}
      </div>
    </motion.aside>
  );
}