import type { AuditDetails, AuditChange } from '../types/admin';
import { 
  Plus, 
  PenSquare, 
  Trash2, 
  Eye, 
  LogIn, 
  LogOut,
  Download,
  Upload,
  Users,
  User,
  Database,
  Mail,
  Ticket,
  Calendar,
  Megaphone,
  Settings,
  FileText,
  Send
} from 'lucide-react';

/**
 * Parse audit log details from JSON string
 */
export function parseAuditDetails(details: string): AuditDetails | null {
  if (!details) return null;
  
  try {
    const parsed = JSON.parse(details);
    return parsed;
  } catch {
    // Legacy text format
    return {
      action: 'UNKNOWN',
      entity_id: 0,
      entity_name: 'Unknown',
      summary: details,
      changes: [],
      timestamp: new Date().toISOString(),
      user_id: 0,
      is_legacy_format: true,
    };
  }
}

/**
 * Format a value for display
 */
export function formatValue(value: any): string {
  if (value === null || value === undefined) return '—';
  if (value === '') return '(empty)';
  if (typeof value === 'object') return JSON.stringify(value);
  if (value instanceof Date) return value.toLocaleString();
  return String(value);
}

/**
 * Get icon component for action type
 */
export function getActionIconComponent(action: string) {
  const icons: Record<string, any> = {
    CREATE: Plus,
    UPDATE: PenSquare,
    DELETE: Trash2,
    VIEW: Eye,
    LOGIN: LogIn,
    LOGOUT: LogOut,
    EXPORT: Download,
    IMPORT: Upload,
    IMPERSONATE: Users,
    STOP_IMPERSONATING: User,
  };
  return icons[action] || FileText;
}

/**
 * Get color for action type
 */
export function getActionColorClass(action: string): string {
  const colors: Record<string, string> = {
    CREATE: 'bg-emerald-100 text-emerald-800',
    UPDATE: 'bg-blue-100 text-blue-800',
    DELETE: 'bg-red-100 text-red-800',
    VIEW: 'bg-gray-100 text-gray-800',
    LOGIN: 'bg-purple-100 text-purple-800',
    LOGOUT: 'bg-orange-100 text-orange-800',
    EXPORT: 'bg-teal-100 text-teal-800',
    IMPORT: 'bg-cyan-100 text-cyan-800',
    IMPERSONATE: 'bg-pink-100 text-pink-800',
    STOP_IMPERSONATING: 'bg-indigo-100 text-indigo-800',
  };
  return colors[action] || 'bg-gray-100 text-gray-800';
}

/**
 * Get icon component for entity type
 */
export function getEntityIconComponent(entityType: string) {
  const icons: Record<string, any> = {
    contact: Users,
    deal: Database,
    ticket: Ticket,
    activity: Calendar,
    campaign: Megaphone,
    user: User,
    organization: Settings,
    email_template: Mail,
    campaign_recipient: Send,
    backup: Database,
  };
  return icons[entityType] || FileText;
}

/**
 * Get color for entity type
 */
export function getEntityColorClass(entityType: string): string {
  const colors: Record<string, string> = {
    contact: 'text-emerald-600',
    deal: 'text-blue-600',
    ticket: 'text-red-600',
    activity: 'text-orange-600',
    campaign: 'text-purple-600',
    user: 'text-indigo-600',
    organization: 'text-gray-600',
    email_template: 'text-cyan-600',
    campaign_recipient: 'text-pink-600',
    backup: 'text-yellow-600',
  };
  return colors[entityType] || 'text-gray-600';
}

/**
 * Get background color for entity type
 */
export function getEntityBgColorClass(entityType: string): string {
  const colors: Record<string, string> = {
    contact: 'bg-emerald-50',
    deal: 'bg-blue-50',
    ticket: 'bg-red-50',
    activity: 'bg-orange-50',
    campaign: 'bg-purple-50',
    user: 'bg-indigo-50',
    organization: 'bg-gray-50',
    email_template: 'bg-cyan-50',
    campaign_recipient: 'bg-pink-50',
    backup: 'bg-yellow-50',
  };
  return colors[entityType] || 'bg-gray-50';
}

/**
 * Get display name for entity type
 */
export function getEntityDisplayName(entityType: string): string {
  const names: Record<string, string> = {
    contact: 'Contact',
    deal: 'Deal',
    ticket: 'Ticket',
    activity: 'Activity',
    campaign: 'Campaign',
    user: 'User',
    organization: 'Organization',
    email_template: 'Email Template',
    campaign_recipient: 'Campaign Recipient',
    backup: 'Backup',
  };
  return names[entityType] || entityType;
}

/**
 * Format changes as human-readable text
 */
export function formatChangesSummary(changes: AuditChange[]): string {
  if (!changes || changes.length === 0) return '';
  
  if (changes.length === 1) {
    const c = changes[0];
    return `${c.display_name}: "${formatValue(c.old_value)}" → "${formatValue(c.new_value)}"`;
  }
  
  if (changes.length <= 3) {
    return changes.map(c => c.display_name).join(', ');
  }
  
  return `${changes.length} fields changed`;
}

/**
 * Generate a user-friendly summary from audit details
 */
export function getDisplaySummary(details: AuditDetails | null, rawDetails: string): string {
  if (details && details.summary) {
    return details.summary;
  }
  // Fallback for legacy logs
  if (rawDetails) {
    return rawDetails.length > 100 ? rawDetails.substring(0, 100) + '...' : rawDetails;
  }
  return 'No details available';
}