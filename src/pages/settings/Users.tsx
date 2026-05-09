import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, AlertTriangle, LogIn, Shield, UserCog, Users as UsersIcon } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { usersApi } from '../../api/users';
import type { User } from '../../types/user';
import { useToast } from '../../hooks/useToast';
import { formatDate } from '../../utils/formatters';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../utils/cn';

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [impersonatingUserId, setImpersonatingUserId] = useState<number | null>(null);
  const toast = useToast();
  const { user: currentUser, startImpersonating, isImpersonating } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await usersApi.getUsers();
      setUsers(response?.data?.data || []);
    } catch (error) {
      toast.error('Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    if (!userId || !newRole) return;

    try {
      await usersApi.updateUserRole(userId, newRole);
      toast.success('Role updated successfully');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update role');
    }
  };

  const handleImpersonate = async (user: User) => {
    if (isImpersonating) {
      toast.error('Already impersonating a user. Please stop current impersonation first.');
      return;
    }

    if (user.role === 'admin') {
      toast.error('Cannot impersonate another administrator');
      return;
    }

    const confirmMessage = `Are you sure you want to impersonate ${user.first_name} ${user.last_name}?\n\nThis action will be logged and you will be able to perform actions as this user.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setImpersonatingUserId(user.id);

    try {
      const response = await usersApi.impersonateUser(user.id);
      const { token, user: impersonatedUser, impersonatedBy } = response.data;

      startImpersonating(impersonatedUser, token, impersonatedBy);

      toast.success(`Now impersonating ${user.first_name} ${user.last_name}`);

      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
    } catch (error: any) {
      console.error('Failed to impersonate user:', error);
      toast.error(error.response?.data?.message || 'Failed to impersonate user');
    } finally {
      setImpersonatingUserId(null);
    }
  };

  const getInitials = (user: User) => {
    if (!user) return '';
    const firstInitial = user.first_name?.[0] || '';
    const lastInitial = user.last_name?.[0] || '';
    return (firstInitial + lastInitial).toUpperCase() || '?';
  };

  const getFullName = (user: User) => {
    if (!user) return '';
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    return `${firstName} ${lastName}`.trim() || 'Unknown User';
  };

  const getRoleBadgeStyles = (role: string) => {
    const styles = {
      admin: {
        bg: 'bg-purple-100 dark:bg-purple-900/30',
        text: 'text-purple-700 dark:text-purple-300',
        border: 'border-purple-200 dark:border-purple-800',
        icon: Shield
      },
      manager: {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-700 dark:text-blue-300',
        border: 'border-blue-200 dark:border-blue-800',
        icon: UserCog
      },
      agent: {
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-700 dark:text-green-300',
        border: 'border-green-200 dark:border-green-800',
        icon: UsersIcon
      }
    };
    return styles[role as keyof typeof styles] || styles.agent;
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="space-y-6">
      {/* Impersonation Banner - Now with dark mode support */}
      {isImpersonating && currentUser?.isImpersonating && (
        <div className="bg-yellow-50 dark:bg-yellow-950/50 border-l-4 border-yellow-500 dark:border-yellow-600 p-4 rounded-lg">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Impersonation Mode Active
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  Logged in as <span className="font-semibold">{currentUser.first_name} {currentUser.last_name}</span>
                </p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-0.5">
                  Impersonated by: {currentUser.impersonatedBy?.name}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  const response = await usersApi.stopImpersonating();
                  const { token, user: adminUser } = response.data;
                  void adminUser;
                  localStorage.setItem('accessToken', token);
                  window.location.href = '/settings/users';
                } catch (error) {
                  toast.error('Failed to stop impersonating');
                }
              }}
              className="bg-white dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/50"
            >
              Stop Impersonating
            </Button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">Users</h1>
          <p className="text-[var(--text-secondary)] mt-1">Manage team members and permissions</p>
        </div>
        <Button>
          <Plus size={18} className="mr-2" /> Invite User
        </Button>
      </div>

      {/* Users Table */}
      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-default)]">
                <th className="text-left p-4 text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                  User
                </th>
                <th className="text-left p-4 text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                  Role
                </th>
                <th className="text-left p-4 text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left p-4 text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                  Last Login
                </th>
                <th className="text-left p-4 text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)]"></div>
                      <span className="ml-2 text-[var(--text-secondary)]">Loading users...</span>
                    </div>
                  </td>
                </tr>
              ) : !users || users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center">
                      <UsersIcon size={48} className="text-[var(--text-tertiary)] mb-3" />
                      <p className="text-lg text-[var(--text-primary)] mb-2">No users found</p>
                      <p className="text-sm text-[var(--text-secondary)]">Get started by inviting your first team member</p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user, idx) => {
                  const roleStyles = getRoleBadgeStyles(user?.role);
                  const RoleIcon = roleStyles.icon;

                  return (
                    <motion.tr
                      key={user?.id || idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="border-b border-[var(--border-default)] hover:bg-[var(--bg-subtle)] transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] flex items-center justify-center text-white text-sm font-medium shadow-sm">
                            {getInitials(user)}
                          </div>
                          <div>
                            <p className="font-medium text-[var(--text-primary)]">{getFullName(user)}</p>
                            <p className="text-sm text-[var(--text-secondary)]">{user?.email || 'No email provided'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border",
                          roleStyles.bg,
                          roleStyles.text,
                          roleStyles.border
                        )}>
                          <RoleIcon size={12} />
                          {user?.role || 'Unknown'}
                        </span>
                      </td>
                      <td className="p-4">
                        {user?.is_verified ? (
                          <Badge variant="success" size="sm">Verified</Badge>
                        ) : (
                          <Badge variant="warning" size="sm">Pending</Badge>
                        )}
                      </td>
                      <td className="p-4 text-sm text-[var(--text-secondary)]">
                        {user?.last_login ? formatDate(user.last_login) : 'Never'}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Role selector - Improved styling */}
                          <select
                            value={user?.role || 'agent'}
                            onChange={(e) => handleRoleChange(user?.id, e.target.value)}
                            className={cn(
                              "text-sm rounded-lg px-2.5 py-1.5 border focus:outline-none focus:ring-2 transition-all",
                              "bg-[var(--bg-base)] text-[var(--text-primary)]",
                              "border-[var(--border-default)] hover:border-[var(--border-strong)]",
                              "focus:border-[var(--border-focus)] focus:ring-[var(--border-focus)]/20"
                            )}
                            disabled={!user?.id}
                          >
                            <option value="admin">Admin</option>
                            <option value="manager">Manager</option>
                            <option value="agent">Agent</option>
                          </select>

                          {/* Impersonate button - Improved styling */}
                          {isAdmin && user.role !== 'admin' && (
                            <button
                              onClick={() => handleImpersonate(user)}
                              disabled={impersonatingUserId === user.id || isImpersonating}
                              className={cn(
                                "inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all",
                                "bg-amber-50 dark:bg-amber-950/50",
                                "text-amber-700 dark:text-amber-300",
                                "border border-amber-200 dark:border-amber-800",
                                "hover:bg-amber-100 dark:hover:bg-amber-900/70",
                                "focus:outline-none focus:ring-2 focus:ring-amber-500/50",
                                "disabled:opacity-50 disabled:cursor-not-allowed"
                              )}
                              title={`Impersonate ${user.first_name} ${user.last_name}`}
                            >
                              {impersonatingUserId === user.id ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-amber-700 dark:border-amber-300 border-t-transparent"></div>
                                  <span>Impersonating...</span>
                                </>
                              ) : (
                                <>
                                  <LogIn size={12} />
                                  <span>Login as User</span>
                                </>
                              )}
                            </button>
                          )}

                          {/* Currently impersonating indicator */}
                          {isImpersonating && currentUser?.impersonatedBy?.id === user.id && (
                            <Badge variant="warning" size="sm" className="animate-pulse">
                              Currently Impersonating
                            </Badge>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}