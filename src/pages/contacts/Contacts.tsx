import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, Download, Upload, MoreVertical } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { GlassCard } from '../../components/ui/GlassCard';
import { Badge } from '../../components/ui/Badge';
import { contactsApi } from '../../api/contacts';
import type { Contact } from '../../types/contact';
import { useDebounce } from '../../hooks/useDebounce';
import { formatDate } from '../../utils/formatters';
import { useNavigate } from "react-router-dom";

export function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [availableFilters, setAvailableFilters] = useState<{
    statuses?: string[];
    tags?: string[];
  }>({});
  const [tags, setTags] = useState<Array<{ name: string; count: number }>>([]);
  const navigate = useNavigate(); 

  const debouncedSearch = useDebounce(search, 500);

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
      
      // Access the nested data structure correctly
      // response.data.data contains the contacts array
      // response.data.pagination contains pagination info
      // response.data.filters contains available filters
      console.log('API Response:', response.data);
      
      setContacts(response.data.data || []);
      setTotalPages(response.data.pagination?.pages || 1);
      setAvailableFilters(response.data.filters || {});
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await contactsApi.getAllTags();
      setTags(response.data.tags);
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

  const handleExport = async () => {
    try {
      const response = await contactsApi.exportContacts('csv', {
        search: debouncedSearch,
        status: selectedStatus,
        tag: selectedTag,
      });
      window.open(response.data.download_url, '_blank');
    } catch (error) {
      console.error('Failed to export contacts:', error);
    }
  };

  // Optional: Use the filters from the API response to populate dropdowns
  useEffect(() => {
    if (availableFilters.statuses) {
      // You could use this to dynamically populate status options
      console.log('Available statuses:', availableFilters.statuses);
    }
  }, [availableFilters]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-deep-ink">Contacts</h1>
          <p className="text-gray-600 mt-1">Manage your contacts and leads</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={handleExport}>
            <Download size={18} className="mr-2" />
            Export
          </Button>
          <Button>
            <Upload size={18} className="mr-2" />
            Import
          </Button>
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
              {/* You could also use availableFilters.statuses here if you want dynamic options */}
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
                          e.stopPropagation(); // Prevent row click when clicking actions
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
    </div>
  );
}