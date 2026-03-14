import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Search, Filter, Download, Upload, MoreVertical,
  X, CheckCircle, AlertCircle, Loader, FileSpreadsheet
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { GlassCard } from '../../components/ui/GlassCard';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { contactsApi } from '../../api/contacts';
import type { Contact } from '../../types/contact';
import { useDebounce } from '../../hooks/useDebounce';
import { formatDate } from '../../utils/formatters';
import { useNavigate } from "react-router-dom";

// Import Status Types
type ImportStatus = {
  import_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  total?: number;
  processed?: number;
  successful?: number;
  failed?: number;
  errors?: Array<{ row: number; error: string }>;
  completed_at?: string;
};

export function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [tags, setTags] = useState<Array<{ name: string; count: number }>>([]);
  const navigate = useNavigate();

  // Import/Export States
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importStatus, setImportStatus] = useState<ImportStatus | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [pollingInterval, setPollingInterval] = useState<ReturnType<typeof setTimeout> | null>(null);

  const debouncedSearch = useDebounce(search, 500);

  // Fetch contacts
  const fetchContacts = async () => {
    try {
      setLoading(true);
      const response = await contactsApi.getContacts({
        page,
        limit: 20,
        search: debouncedSearch,
        status: selectedStatus || undefined,
        tag: selectedTag || undefined,
      });

      setContacts(response.data?.data || []);
      setTotalPages(response.data?.pagination?.pages || 1);
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch tags
  const fetchTags = async () => {
    try {
      const response = await contactsApi.getAllTags();
      setTags(response.data?.tags || []);
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [page, debouncedSearch, selectedStatus, selectedTag]);

  useEffect(() => {
    fetchTags();
  }, []);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  // Handle export
  const handleExport = async (format: 'csv' | 'excel' = 'csv') => {
    try {
      setLoading(true);
      const response = await contactsApi.exportContacts(format, {
        search: debouncedSearch,
        status: selectedStatus,
        tag: selectedTag,
      });

      // Open the download URL
      if (response.data?.download_url) {
        window.open(response.data.download_url, '_blank');
      }
    } catch (error) {
      console.error('Failed to export contacts:', error);
      alert('Failed to export contacts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle file selection for import
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['text/csv', 'application/vnd.ms-excel'];
      if (!validTypes.includes(file.type) && !file.name.endsWith('.csv')) {
        alert('Please select a valid CSV file');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }

      setImportFile(file);
      setImportStatus(null);
    }
  };

  // Start import
  const handleImport = async () => {
    if (!importFile) return;

    try {
      setImportLoading(true);
      setImportStatus({
        import_id: '',
        status: 'pending',
      });

      const response = await contactsApi.importContacts(importFile);

      if (response.data?.import_id) {
        const importId = response.data.import_id;

        // Set initial processing status
        setImportStatus({
          import_id: importId,
          status: 'processing',
          total: 0,
          processed: 0,
          successful: 0,
          failed: 0,
          errors: []
        });

        // Clear any existing interval first
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }

        // Start polling for status
        const interval = setInterval(async () => {
          try {
            const statusResponse = await contactsApi.getImportStatus(importId);
            const status = statusResponse.data?.data || statusResponse.data;

            // Update the status
            setImportStatus({
              import_id: importId,
              status: status.status,
              total: status.total || 0,
              processed: status.processed || 0,
              successful: status.successful || 0,
              failed: status.failed || 0,
              errors: status.errors || [],
              completed_at: status.completed_at,
            });

            // Stop polling if completed or failed
            if (status.status === 'completed' || status.status === 'failed') {
              clearInterval(interval);
              setPollingInterval(null);

              if (status.status === 'completed') {
                // Refresh contacts list
                await fetchContacts();
              }
            }
          } catch (error) {
            console.error('Failed to get import status:', error);
            // Stop polling on error
            clearInterval(interval);
            setPollingInterval(null);
          }
        }, 2000); // Poll every 2 seconds

        setPollingInterval(interval);
      }
    } catch (error) {
      console.error('Failed to import contacts:', error);
      setImportStatus({
        import_id: '',
        status: 'failed',
        total: 0,
        processed: 0,
        successful: 0,
        failed: 0,
        errors: [{ row: 0, error: 'Import failed to start' }],
      });
    } finally {
      setImportLoading(false);
    }
  };

  // Also update the cleanup in handleCloseImportModal to be more robust
  const handleCloseImportModal = () => {
    setShowImportModal(false);
    setImportFile(null);
    setImportStatus(null);

    // Clear polling interval
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  };

  // Add a ref to track if component is mounted
  useEffect(() => {
    let isMounted = true;

    // Your existing code...

    return () => {
      isMounted = false;
      // Cleanup polling on unmount
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
    };
  }, [pollingInterval]);

  // Add an effect to watch for showImportModal changes
  useEffect(() => {
    // If modal is closed, stop polling
    if (!showImportModal && pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  }, [showImportModal, pollingInterval]);


  // Download sample CSV
  const handleDownloadSample = () => {
    const headers = ['first_name', 'last_name', 'email', 'phone', 'company', 'job_title', 'status', 'tags'];
    const sampleRow = ['John', 'Doe', 'john@example.com', '+1234567890', 'Acme Inc', 'Manager', 'active', 'customer;vip'];

    const csvContent = [
      headers.join(','),
      sampleRow.join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-contacts.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-deep-ink">Contacts</h1>
          <p className="text-gray-600 mt-1">Manage your contacts and leads</p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Export Dropdown */}
          <div className="relative group">
            <Button variant="outline">
              <Download size={18} className="mr-2" />
              Export
            </Button>
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-blue-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button
                onClick={() => handleExport('csv')}
                className="w-full text-left px-4 py-2 hover:bg-blue-50 first:rounded-t-xl"
              >
                Export as CSV
              </button>
              <button
                onClick={() => handleExport('excel')}
                className="w-full text-left px-4 py-2 hover:bg-blue-50 last:rounded-b-xl"
              >
                Export as Excel
              </button>
            </div>
          </div>

          {/* Import Button */}
          <Button variant="outline" onClick={() => setShowImportModal(true)}>
            <Upload size={18} className="mr-2" />
            Import
          </Button>

          {/* Add Contact Button */}
          <Button onClick={() => navigate('/contacts/new')}>
            <Plus size={18} className="mr-2" />
            Add Contact
          </Button>
        </div>
      </div>

      {/* Filters */}
      <GlassCard className="p-4">
        <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <Input
              placeholder="Search contacts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search size={18} />}
            />
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 bg-white/70 border border-blue-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="lead">Lead</option>
            </select>
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="px-3 py-2 bg-white/70 border border-blue-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Tags</option>
              {tags.map((tag) => (
                <option key={tag.name} value={tag.name}>
                  {tag.name} ({tag.count})
                </option>
              ))}
            </select>
            <Button variant="ghost" size="sm">
              <Filter size={18} />
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* Contacts Table */}
      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-blue-100">
                <th className="text-left p-4 text-sm font-medium text-gray-600">Name</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Email</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Company</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Status</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Tags</th>
                <th className="text-left p-4 text-sm font-medium text-gray-600">Last Activity</th>
                <th className="text-right p-4 text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </td>
                </tr>
              ) : contacts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    No contacts found
                  </td>
                </tr>
              ) : (
                contacts.map((contact, index) => (
                  <motion.tr
                    key={contact.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-blue-50 hover:bg-blue-50/30 transition-colors group cursor-pointer"
                    onClick={() => navigate(`/contacts/${contact.id}`)}
                  >
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-linear-to-br from-primary to-accent flex items-center justify-center text-white font-medium text-sm">
                          {contact.first_name?.[0]}{contact.last_name?.[0]}
                        </div>
                        <div>
                          <p className="font-medium text-deep-ink">
                            {contact.first_name} {contact.last_name}
                          </p>
                          <p className="text-sm text-gray-500">{contact.job_title || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-gray-600">{contact.email}</p>
                      {contact.phone && (
                        <p className="text-xs text-gray-400">{contact.phone}</p>
                      )}
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-gray-600">{contact.company || '-'}</p>
                    </td>
                    <td className="p-4">
                      <Badge
                        variant={contact.status === 'active' ? 'success' : contact.status === 'lead' ? 'info' : 'default'}
                      >
                        {contact.status}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {contact.tags?.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="primary" size="sm">
                            {tag}
                          </Badge>
                        ))}
                        {contact.tags?.length > 2 && (
                          <Badge variant="default" size="sm">
                            +{contact.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-gray-600">
                        {contact.last_activity ? formatDate(contact.last_activity) : '-'}
                      </p>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle actions menu
                        }}
                      >
                        <MoreVertical size={18} className="text-gray-400 hover:text-gray-600" />
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-blue-100">
            <p className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Import Modal */}
      <Modal isOpen={showImportModal} onClose={handleCloseImportModal} maxWidth="md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-deep-ink">Import Contacts</h2>
            <button onClick={handleCloseImportModal}>
              <X size={20} className="text-gray-500 hover:text-gray-700" />
            </button>
          </div>

          {!importStatus || importStatus.status === 'pending' ? (
            // File Upload
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select CSV File
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-dark"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Maximum file size: 10MB. CSV format only.
                </p>
              </div>

              <div className="mb-6">
                <button
                  onClick={handleDownloadSample}
                  className="text-primary hover:text-primary-dark text-sm flex items-center"
                >
                  <FileSpreadsheet size={16} className="mr-1" />
                  Download sample CSV
                </button>
              </div>

              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={handleCloseImportModal}>
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={!importFile || importLoading}
                >
                  {importLoading ? (
                    <>
                      <Loader size={18} className="mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    'Import'
                  )}
                </Button>
              </div>
            </div>
          ) : (
            // Import Status
            <div>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Status</span>
                  <Badge
                    variant={
                      importStatus.status === 'completed' ? 'success' :
                        importStatus.status === 'failed' ? 'danger' :
                          importStatus.status === 'processing' ? 'info' : 'default'
                    }
                  >
                    {importStatus.status.charAt(0).toUpperCase() + importStatus.status.slice(1)}
                  </Badge>
                </div>

                {(importStatus.status === 'processing' || importStatus.status === 'completed') && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium">
                        {importStatus.processed || 0} / {importStatus.total || 0}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2 transition-all duration-300"
                        style={{
                          width: `${((importStatus.processed || 0) / (importStatus.total || 1)) * 100}%`
                        }}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="text-center">
                        <CheckCircle size={24} className="mx-auto text-green-500 mb-1" />
                        <span className="text-sm text-gray-600">Successful</span>
                        <p className="text-lg font-bold text-green-600">{importStatus.successful || 0}</p>
                      </div>
                      <div className="text-center">
                        <AlertCircle size={24} className="mx-auto text-red-500 mb-1" />
                        <span className="text-sm text-gray-600">Failed</span>
                        <p className="text-lg font-bold text-red-600">{importStatus.failed || 0}</p>
                      </div>
                    </div>
                  </div>
                )}

                {importStatus.errors && importStatus.errors.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Errors</h3>
                    <div className="max-h-40 overflow-y-auto bg-red-50 rounded-lg p-3">
                      {importStatus.errors.map((error, index) => (
                        <p key={index} className="text-xs text-red-600 mb-1">
                          Row {error.row}: {error.error}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleCloseImportModal}
                  disabled={importStatus.status === 'processing'}
                >
                  {importStatus.status === 'completed' ? 'Done' : 'Close'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}