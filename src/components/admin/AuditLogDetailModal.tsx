import React from 'react';
import {
  X,
  User,
  Clock,
  Globe,
  FileText,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import type { AuditLogDetail, AuditChange } from '../../types/admin';

interface Props {
  log: AuditLogDetail;
  onClose: () => void;
}

const AuditLogDetailModal: React.FC<Props> = ({ log, onClose }) => {
  const details = log.details;

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'create':
        return { text: 'Created', color: 'text-green-700 bg-green-50 border-green-200' };
      case 'update':
        return { text: 'Updated', color: 'text-blue-700 bg-blue-50 border-blue-200' };
      case 'delete':
        return { text: 'Deleted', color: 'text-red-700 bg-red-50 border-red-200' };
      default:
        return { text: action, color: 'text-gray-700 bg-gray-50 border-gray-200' };
    }
  };

  const timestamp = formatTimestamp(log.created_at);
  const actionBadge = getActionBadge(log.action);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-gray-200">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${actionBadge.color}`}>
                {actionBadge.text}
              </span>
              <span className="text-sm text-gray-500">
                {log.entity_type.replace(/_/g, ' ')}
              </span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {details?.entity_name || `${log.entity_type} #${log.entity_id}`}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Who and When */}
          <div className="mb-6 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-gray-700">
                {log.user ? `${log.user.first_name} ${log.user.last_name}` : `User #${log.user_id}`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-gray-700">
                {timestamp.date} at {timestamp.time}
              </span>
            </div>
            {log.ip_address && (
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500 text-xs">{log.ip_address}</span>
              </div>
            )}
          </div>

          {/* Summary */}
          {details?.summary && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-700">{details.summary}</p>
            </div>
          )}

          {/* Changes - Clear Before/After */}
          {details?.changes && details.changes.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Changes</h3>
              <div className="space-y-3">
                {details.changes.map((change: AuditChange, index: number) => (
                  <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                      <span className="text-sm font-medium text-gray-900">
                        {change.display_name || change.field.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="text-xs text-gray-500 mb-1">Before</div>
                          <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                            {change.old_value !== null && change.old_value !== undefined 
                              ? String(change.old_value) 
                              : '—'}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="text-xs text-gray-500 mb-1">After</div>
                          <div className="text-sm font-medium text-gray-900 bg-green-50 p-2 rounded">
                            {change.new_value !== null && change.new_value !== undefined 
                              ? String(change.new_value) 
                              : '—'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Changes Message */}
          {(!details?.changes || details.changes.length === 0) && log.action === 'update' && (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No field changes recorded</p>
              <p className="text-sm">The update may have affected system fields only</p>
            </div>
          )}

          {/* Deleted Data */}
          {details?.deleted_data && Object.keys(details.deleted_data).length > 0 && (
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <h3 className="text-sm font-medium text-gray-700">Deleted Record Data</h3>
              </div>
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  {Object.entries(details.deleted_data).map(([key, value]) => (
                    <div key={key}>
                      <dt className="text-xs text-gray-600 capitalize">{key.replace(/_/g, ' ')}</dt>
                      <dd className="text-gray-900">{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          )}

          {/* Additional Info */}
          {details?.additional_info && Object.keys(details.additional_info).length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Additional Information</h3>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <dl className="space-y-2 text-sm">
                  {Object.entries(details.additional_info).map(([key, value]) => (
                    <div key={key} className="flex gap-2">
                      <dt className="font-medium text-gray-700 w-32 capitalize">
                        {key.replace(/_/g, ' ')}:
                      </dt>
                      <dd className="text-gray-900">{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-100 transition-colors border border-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuditLogDetailModal;