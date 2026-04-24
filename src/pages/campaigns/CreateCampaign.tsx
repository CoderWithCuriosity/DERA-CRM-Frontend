import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Calendar, Users, Mail, X, Search, CheckSquare, Square, ChevronLeft, ChevronRight } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Select } from '../../components/ui/Select';
import { campaignsApi } from '../../api/campaigns';
import { emailTemplatesApi } from '../../api/emailTemplates';
import { contactsApi } from '../../api/contacts';
import { useToast } from '../../hooks/useToast';
import type { EmailTemplate } from '../../types/emailTemplate';
import type { Contact } from '../../types/contact';

export default function CreateCampaign() {
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContactIds, setSelectedContactIds] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalContacts, setTotalContacts] = useState(0);
  const [selectAllAcrossPages, setSelectAllAcrossPages] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    template_id: '',
    scheduled_at: '',
    use_filters: false,
    filters: {
      tags: [] as string[],
      status: ''
    }
  });

  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    fetchTemplates();
    fetchContacts();
  }, [currentPage, searchTerm]);

  const fetchTemplates = async () => {
    try {
      const response = await emailTemplatesApi.getTemplates();
      setTemplates(response.data.data);
    } catch (error) {
      toast.error('Failed to load templates');
      setTemplates([]);
    }
  };

  const fetchContacts = async () => {
    try {
      const response = await contactsApi.getContacts({
        limit: ITEMS_PER_PAGE,
        page: currentPage,
        search: searchTerm || undefined
      });
      setContacts(response.data.data);
      setTotalContacts(response.data.pagination?.total || response.data.data.length);
    } catch (error) {
      toast.error('Failed to load contacts');
      setContacts([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast.error('Campaign name is required');
      return;
    }

    if (!formData.template_id) {
      toast.error('Please select a template');
      return;
    }

    if (!formData.use_filters && selectedContactIds.length === 0 && !selectAllAcrossPages) {
      toast.error('Please select at least one contact or use filters');
      return;
    }

    setLoading(true);

    try {
      const payload: any = {
        name: formData.name,
        template_id: parseInt(formData.template_id),
        target_list: {}
      };

      if (formData.use_filters) {
        payload.target_list.filters = {};
        if (formData.filters.tags.length > 0) {
          payload.target_list.filters.tags = formData.filters.tags;
        }
        if (formData.filters.status) {
          payload.target_list.filters.status = formData.filters.status;
        }
      } else {
        if (selectAllAcrossPages) {
          // Use filters for "Select All" to avoid sending huge ID arrays
          payload.target_list.filters = {};
          if (searchTerm) {
            payload.target_list.filters.search = searchTerm;
          }
          // Add any exclusions if needed
          // payload.target_list.exclude_ids = excludedContactIds;
        } else {
          payload.target_list.contact_ids = selectedContactIds;
        }
      }

      if (formData.scheduled_at) {
        payload.scheduled_at = formData.scheduled_at;
      }

      const response = await campaignsApi.createCampaign(payload);

      toast.success('Campaign created successfully');
      navigate(`/campaigns/${response.data.campaign.id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  const toggleContact = (contactId: number) => {
    if (selectAllAcrossPages) {
      setSelectAllAcrossPages(false);
      setSelectedContactIds([contactId]);
    } else {
      setSelectedContactIds(prev =>
        prev.includes(contactId)
          ? prev.filter(id => id !== contactId)
          : [...prev, contactId]
      );
    }
  };

  const handleSelectAllAcrossPages = () => {
    setSelectAllAcrossPages(true);
    setSelectedContactIds([]);
  };

  const handleClearAll = () => {
    setSelectAllAcrossPages(false);
    setSelectedContactIds([]);
  };

  const handleSelectPage = () => {
    if (selectAllAcrossPages) {
      // If in "Select All" mode, we need to keep it
      return;
    } else {
      const currentPageIds = contacts.map(c => c.id);
      setSelectedContactIds(prev => [...new Set([...prev, ...currentPageIds])]);
    }
  };

  const handleDeselectPage = () => {
    if (selectAllAcrossPages) {
      setSelectAllAcrossPages(false);
      const currentPageIds = contacts.map(c => c.id);
      const remainingSelected = selectedContactIds.filter(id => !currentPageIds.includes(id));
      setSelectedContactIds(remainingSelected);
    } else {
      const currentPageIds = contacts.map(c => c.id);
      setSelectedContactIds(prev => prev.filter(id => !currentPageIds.includes(id)));
    }
  };

  const isPageFullySelected = () => {
    if (selectAllAcrossPages) {
      return false;
    }
    return contacts.length > 0 && contacts.every(contact => selectedContactIds.includes(contact.id));
  };

  const getEffectiveSelectedCount = () => {
    if (selectAllAcrossPages) {
      return totalContacts;
    }
    return selectedContactIds.length;
  };

  const totalPages = Math.ceil(totalContacts / ITEMS_PER_PAGE);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'lead', label: 'Lead' }
  ];

  const tagOptions = [
    { value: 'vip', label: 'VIP' },
    { value: 'new_signup', label: 'New Signup' },
    { value: 'enterprise', label: 'Enterprise' },
    { value: 'trial', label: 'Trial' },
    { value: 'customer', label: 'Customer' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/campaigns')}>
          <ArrowLeft size={18} className="mr-2" /> Back
        </Button>
        <h1 className="text-3xl font-bold text-deep-ink">Create Campaign</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <GlassCard className="p-6">
              <h2 className="text-lg font-semibold text-deep-ink mb-4">Campaign Details</h2>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Campaign Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Welcome Campaign - November 2025"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="template">Email Template *</Label>
                  <Select
                    id="template"
                    value={formData.template_id}
                    onChange={(e) => setFormData({ ...formData, template_id: e.target.value })}
                    className="mt-1"
                  >
                    <option value="">Select a template...</option>
                    {templates?.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name} - {template.subject}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <Label htmlFor="scheduled_at">Schedule (Optional)</Label>
                  <Input
                    id="scheduled_at"
                    type="datetime-local"
                    value={formData.scheduled_at}
                    onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty to send immediately when you click "Create Campaign"
                  </p>
                </div>
              </div>
            </GlassCard>

            {/* Target Audience */}
            <GlassCard className="p-6">
              <h2 className="text-lg font-semibold text-deep-ink mb-4">Target Audience</h2>

              <div className="mb-4">
                <Label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.use_filters}
                    onChange={(e) => setFormData({ ...formData, use_filters: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span>Use filters instead of selecting individual contacts</span>
                </Label>
              </div>

              {formData.use_filters ? (
                <div className="space-y-4">
                  <div>
                    <Label>Tags</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {tagOptions.map(tag => (
                        <button
                          key={tag.value}
                          type="button"
                          onClick={() => {
                            const current = formData.filters.tags;
                            const updated = current.includes(tag.value)
                              ? current.filter(t => t !== tag.value)
                              : [...current, tag.value];
                            setFormData({
                              ...formData,
                              filters: { ...formData.filters, tags: updated }
                            });
                          }}
                          className={`px-3 py-1 rounded-full text-sm ${formData.filters.tags.includes(tag.value)
                              ? 'bg-primary text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                          {tag.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Contact Status</Label>
                    <Select
                      value={formData.filters.status}
                      onChange={(e) => setFormData({
                        ...formData,
                        filters: { ...formData.filters, status: e.target.value }
                      })}
                      className="mt-1"
                    >
                      <option value="">All statuses</option>
                      {statusOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </Select>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <Label>Select Contacts</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAllAcrossPages}
                      >
                        <CheckSquare size={14} className="mr-1" /> Select All ({totalContacts})
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleSelectPage}
                        disabled={selectAllAcrossPages || isPageFullySelected()}
                      >
                        <Square size={14} className="mr-1" /> Select Page
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleDeselectPage}
                        disabled={!selectAllAcrossPages && selectedContactIds.length === 0}
                      >
                        <X size={14} className="mr-1" /> Deselect Page
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleClearAll}
                        disabled={!selectAllAcrossPages && selectedContactIds.length === 0}
                      >
                        Clear All
                      </Button>
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className="relative mb-4">
                    <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Search contacts by name, email, or company..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                        handleClearAll();
                      }}
                      className="pl-10"
                    />
                  </div>

                  {/* Selection Info Badge */}
                  <div className="mb-4 p-3 bg-primary/10 rounded-lg">
                    <p className="text-sm text-primary font-medium">
                      {selectAllAcrossPages ? (
                        <>All {totalContacts} contacts selected</>
                      ) : (
                        <>{selectedContactIds.length} contact(s) selected</>
                      )}
                    </p>
                  </div>

                  {/* Contacts Table */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                              Select
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Name
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Email
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Company
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {contacts?.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                {searchTerm ? 'No contacts found matching your search' : 'No contacts available'}
                              </td>
                            </tr>
                          ) : (
                            contacts?.map((contact) => {
                              const isSelected = selectAllAcrossPages || selectedContactIds.includes(contact.id);

                              return (
                                <tr
                                  key={contact.id}
                                  className="hover:bg-gray-50 cursor-pointer"
                                  onClick={() => toggleContact(contact.id)}
                                >
                                  <td className="px-4 py-3">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => toggleContact(contact.id)}
                                      onClick={(e) => e.stopPropagation()}
                                      className="rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="font-medium text-gray-900">
                                      {contact.first_name} {contact.last_name}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-gray-600">
                                    {contact.email}
                                  </td>
                                  <td className="px-4 py-3 text-gray-600">
                                    {contact.company || '—'}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${contact.status === 'active' ? 'bg-green-100 text-green-800' :
                                        contact.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                                          'bg-blue-100 text-blue-800'
                                      }`}>
                                      {contact.status || 'lead'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Pagination with Page Numbers */}
                  {totalPages > 1 && (
                    <div className="flex justify-between items-center mt-4">
                      <div className="text-sm text-gray-600">
                        Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
                        {Math.min(currentPage * ITEMS_PER_PAGE, totalContacts)} of {totalContacts} contacts
                      </div>

                      <div className="flex gap-1">
                        {/* Previous button */}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft size={16} />
                        </Button>

                        {/* Page numbers */}
                        {getPageNumbers().map(pageNum => (
                          <Button
                            key={pageNum}
                            type="button"
                            variant={currentPage === pageNum ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className={currentPage === pageNum ? 'bg-primary text-white' : ''}
                          >
                            {pageNum}
                          </Button>
                        ))}

                        {/* Next button */}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                        >
                          <ChevronRight size={16} />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </GlassCard>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <GlassCard className="p-6">
              <h3 className="font-semibold text-deep-ink mb-3">Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Campaign Name:</span>
                  <span className="font-medium">{formData.name || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Template:</span>
                  <span className="font-medium">
                    {templates?.find(t => t.id === parseInt(formData.template_id))?.name || '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Recipients:</span>
                  <span className="font-medium">
                    {formData.use_filters
                      ? 'Based on filters'
                      : `${getEffectiveSelectedCount()} selected`
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Schedule:</span>
                  <span className="font-medium">
                    {formData.scheduled_at
                      ? new Date(formData.scheduled_at).toLocaleString()
                      : 'Send immediately'}
                  </span>
                </div>
              </div>

              <hr className="my-4" />

              <div className="space-y-3">
                <Button type="submit" className="w-full" disabled={loading}>
                  <Save size={18} className="mr-2" />
                  {loading ? 'Creating...' : 'Create Campaign'}
                </Button>
                <Button type="button" variant="outline" className="w-full" onClick={() => navigate('/campaigns')}>
                  Cancel
                </Button>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="font-semibold text-deep-ink mb-3">Tips</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-start gap-2">
                  <Mail size={14} className="mt-0.5 text-primary" />
                  <span>Use templates with variables like {"{{first_name}}"} for personalization</span>
                </li>
                <li className="flex items-start gap-2">
                  <Calendar size={14} className="mt-0.5 text-primary" />
                  <span>Schedule campaigns for optimal send times (Tuesday-Thursday, 10am-2pm)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Users size={14} className="mt-0.5 text-primary" />
                  <span>Segment your audience with filters for better engagement</span>
                </li>
              </ul>
            </GlassCard>
          </div>
        </div>
      </form>
    </div>
  );
}