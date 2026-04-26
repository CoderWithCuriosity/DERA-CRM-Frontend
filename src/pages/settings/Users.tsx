import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, UserCog, AlertTriangle, LogIn } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { usersApi } from '../../api/users';
import type { User } from '../../types/user';
import { useToast } from '../../hooks/useToast';
import { formatDate } from '../../utils/formatters';
import { useAuth } from '../../hooks/useAuth';

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
      toast.success('Role updated');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update role');
    }
  };

  const handleImpersonate = async (user: User) => {
    // Don't allow impersonating if already impersonating
    if (isImpersonating) {
      toast.error('Already impersonating a user. Please stop current impersonation first.');
      return;
    }

    // Don't allow impersonating other admins
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
      
      // Use the store method to start impersonation
      startImpersonating(impersonatedUser, token, impersonatedBy);
      
      toast.success(`Now impersonating ${user.first_name} ${user.last_name}`);
      
      // Reload the page to refresh all components with new user context
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

  const roleColors: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-800',
    manager: 'bg-blue-100 text-blue-800',
    agent: 'bg-green-100 text-green-800',
  };

  const getRoleBadgeColor = (role: string) => {
    return roleColors[role?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  // Check if current user is admin
  const isAdmin = currentUser?.role === 'admin';
  
  // Debug logging to see what's happening
  console.log('Current user:', currentUser);
  console.log('Is Admin:', isAdmin);
  console.log('Is Impersonating:', isImpersonating);
  console.log('Users list:', users);

  return (
    <div className="space-y-6">
      {/* Show impersonation warning banner if currently impersonating */}
      {isImpersonating && currentUser?.isImpersonating && (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Impersonation Mode Active
                </p>
                <p className="text-xs text-yellow-700">
                  You are currently logged in as {currentUser.first_name} {currentUser.last_name}
                </p>
                <p className="text-xs text-yellow-600 mt-1">
                  Impersonated by: {currentUser.impersonatedBy?.name} ({currentUser.impersonatedBy?.email})
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
                  localStorage.setItem('accessToken', token);
                  window.location.href = '/settings/users';
                } catch (error) {
                  toast.error('Failed to stop impersonating');
                }
              }}
              className="bg-white"
            >
              Stop Impersonating
            </Button>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-deep-ink">Users</h1>
          <p className="text-gray-600 mt-1">Manage team members and permissions</p>
        </div>
        <Button>
          <Plus size={18} className="mr-2" /> Invite User
        </Button>
      </div>

      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-blue-100">
                <th className="text-left p-4 text-sm font-medium text-gray-600">User</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Role</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Status</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Last Login</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <span className="ml-2 text-gray-600">Loading users...</span>
                    </div>
                   </td>
                 </tr>
              ) : !users || users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <p className="text-lg mb-2">No users found</p>
                      <p className="text-sm">Get started by inviting your first team member</p>
                    </div>
                   </td>
                 </tr>
              ) : (
                users.map((user, idx) => {
                  // Check if this user can be impersonated
                  const canImpersonate = isAdmin && user.role !== 'admin' && !isImpersonating;
                  
                  return (
                    <motion.tr
                      key={user?.id || idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="border-b border-blue-50 hover:bg-blue-50/30"
                    >
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-linear-to-br from-primary to-accent flex items-center justify-center text-white text-sm font-medium">
                            {getInitials(user)}
                          </div>
                          <div>
                            <p className="font-medium text-deep-ink">{getFullName(user)}</p>
                            <p className="text-sm text-gray-600">{user?.email || 'No email provided'}</p>
                          </div>
                        </div>
                       </td>
                      <td className="p-4">
                        <Badge className={getRoleBadgeColor(user?.role)}>
                          {user?.role || 'Unknown'}
                        </Badge>
                      </td>
                      <td className="p-4">
                        {user?.is_verified ? (
                          <Badge variant="success">Verified</Badge>
                        ) : (
                          <Badge variant="warning">Pending</Badge>
                        )}
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {user?.last_login ? formatDate(user.last_login) : 'Never'}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Role selector */}
                          <select
                            value={user?.role || 'agent'}
                            onChange={(e) => handleRoleChange(user?.id, e.target.value)}
                            className="text-sm border border-blue-100 rounded-lg px-2 py-1 bg-white focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                            disabled={!user?.id}
                          >
                            <option value="admin">Admin</option>
                            <option value="manager">Manager</option>
                            <option value="agent">Agent</option>
                          </select>

                          {/* Impersonate button - SIMPLIFIED CONDITION */}
                          {isAdmin && user.role !== 'admin' && (
                            <button
                              onClick={() => handleImpersonate(user)}
                              disabled={impersonatingUserId === user.id || isImpersonating}
                              className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title={`Impersonate ${user.first_name} ${user.last_name}`}
                            >
                              {impersonatingUserId === user.id ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-700 mr-1"></div>
                                  <span>Logging in as User...</span>
                                </>
                              ) : (
                                <>
                                  <LogIn size={14} className="mr-1" />
                                  <span>Login as User</span>
                                </>
                              )}
                            </button>
                          )}

                          {/* Show indicator if this user is currently being impersonated */}
                          {isImpersonating && currentUser?.impersonatedBy?.id === user.id && (
                            <Badge variant="warning" className="text-xs">
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