import { api } from './client';
import type {
  AuditLogFilters,
  AuditLogsResponse,
  UserActivityResponse,
  BackupResponse,
  BackupStatusResponse,
  SystemHealthResponse,
  SystemStatsResponse,
} from '../types/admin';

export const adminApi = {
  /**
   * Get system statistics
   */
  getSystemStats: () => api.get<SystemStatsResponse>('/admin/stats'),

  /**
   * Get audit logs with optional filters
   */
  getAuditLogs: (filters?: AuditLogFilters) =>
    api.get<AuditLogsResponse>('/admin/audit-logs', { params: filters }),

  /**
   * Get user activity report
   */
  getUserActivity: (startDate?: string, endDate?: string, userId?: number) =>
    api.get<UserActivityResponse>('/admin/user-activity', {
      params: { start_date: startDate, end_date: endDate, user_id: userId },
    }),

  /**
   * Create a new database backup
   */
  createBackup: () => api.post<BackupResponse>('/admin/backup'),

  /**
   * Get backup creation status
   */
  getBackupStatus: (backupId: string) =>
    api.get<BackupStatusResponse>(`/admin/backup/${backupId}/status`),

  /**
   * Get system health information
   */
  getSystemHealth: () => api.get<SystemHealthResponse>('/admin/health'),
};