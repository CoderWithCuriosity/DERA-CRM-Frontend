import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Calendar, Users, Mail, X, Plus } from 'lucide-react';
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

  useEffect(() => {
    fetchTemplates();
    fetchContacts();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await emailTemplatesApi.getTemplates();
      setTemplates(response.data.templates);
    } catch (error) {
      toast.error('Failed to load templates');
      setTemplates([]);
    }
  };

  const fetchContacts = async () => {
    try {
      const response = await contactsApi.getContacts({ limit: 100 });
      setContacts(response.data.data);
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
    
    if (!formData.use_filters && selectedContactIds.length === 0) {
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
        payload.target_list.contact_ids = selectedContactIds;
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

  const addContact = (contactId: number) => {
    if (!selectedContactIds.includes(contactId)) {
      setSelectedContactIds([...selectedContactIds, contactId]);
    }
    setSearchTerm('');
  };

  const removeContact = (contactId: number) => {
    setSelectedContactIds(selectedContactIds.filter(id => id !== contactId));
  };

  const filteredContacts = contacts.filter(contact => {
    const search = searchTerm.toLowerCase();
    return (
      !selectedContactIds.includes(contact.id) && (
        contact.first_name?.toLowerCase().includes(search) ||
        contact.last_name?.toLowerCase().includes(search) ||
        contact.email?.toLowerCase().includes(search) ||
        contact.company?.toLowerCase().includes(search)
      )
    );
  });

  const selectedContactsList = contacts.filter(c => selectedContactIds.includes(c.id));

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
                    Leave empty to send immediately when you click "Send"
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
                          className={`px-3 py-1 rounded-full text-sm ${
                            formData.filters.tags.includes(tag.value)
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
                  <Label>Select Contacts</Label>
                  
                  {/* Selected Contacts */}
                  {selectedContactsList?.length > 0 && (
                    <div className="mt-2 mb-4">
                      <p className="text-sm text-gray-600 mb-2">
                        Selected ({selectedContactsList.length}):
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedContactsList?.map(contact => (
                          <span
                            key={contact.id}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-sm"
                          >
                            {contact.first_name} {contact.last_name} ({contact.email})
                            <button
                              type="button"
                              onClick={() => removeContact(contact.id)}
                              className="hover:text-red-500"
                            >
                              <X size={14} />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Search & Add */}
                  <div className="mt-2">
                    <Input
                      placeholder="Search contacts by name, email, or company..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="mb-2"
                    />
                    
                    {searchTerm && filteredContacts?.length > 0 && (
                      <div className="border rounded-lg max-h-48 overflow-y-auto">
                        {filteredContacts?.map(contact => (
                          <button
                            key={contact.id}
                            type="button"
                            onClick={() => addContact(contact.id)}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b last:border-b-0 flex justify-between items-center"
                          >
                            <div>
                              <span className="font-medium">
                                {contact.first_name} {contact.last_name}
                              </span>
                              <span className="text-sm text-gray-500 ml-2">
                                {contact.email}
                              </span>
                              {contact.company && (
                                <span className="text-xs text-gray-400 ml-2">
                                  {contact.company}
                                </span>
                              )}
                            </div>
                            <Plus size={16} className="text-gray-400" />
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {searchTerm && filteredContacts?.length === 0 && (
                      <p className="text-sm text-gray-500 mt-2">No contacts found</p>
                    )}
                  </div>
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
                      : `${selectedContactIds.length} selected`
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