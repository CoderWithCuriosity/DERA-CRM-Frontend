import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { usersApi } from '../../api/users';
import type { User } from '../../types/user';
import { useToast } from '../../hooks/useToast';
import { formatDate } from '../../utils/formatters';

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await usersApi.getUsers();
      setUsers(response?.data?.items || []);
    } catch (error) {
      toast.error('Failed to load users');
      setUsers([]); // Ensure users is always an array
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

  return (
    <div className="space-y-6">
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
                users.map((user, idx) => (
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
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}