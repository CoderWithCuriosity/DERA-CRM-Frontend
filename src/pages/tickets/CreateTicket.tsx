import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  ArrowLeft, Save, User as UserIcon, AlertCircle, Calendar, 
  UserPlus, X, Search, Plus, Trash2, Send, Users 
} from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { ticketsApi } from '../../api/tickets';
import { contactsApi } from '../../api/contacts';
import { usersApi } from '../../api/users';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';
import type { Contact } from '../../types/contact';
import type { User } from '../../types/user';
import type { TicketPriority } from '../../types/ticket';

// Schema for each contact in the list
const contactItemSchema = z.object({
  contact_id: z.number().min(1, 'Please select a contact'),
  contact_name: z.string().optional(),
  contact_email: z.string().optional(),
  contact_company: z.string().optional(),
});

// Main form schema
const createTicketSchema = z.object({
  subject: z.string().min(1, 'Subject is required').max(255, 'Subject is too long'),
  description: z.string().min(1, 'Description is required'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  due_date: z.string().optional(),
  assigned_to: z.number().optional(),
  contacts: z.array(contactItemSchema).min(1, 'Please add at least one contact'),
});

type CreateTicketFormData = z.infer<typeof createTicketSchema>;

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

export default function CreateTicket() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [contactSearch, setContactSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  const { register, handleSubmit, formState: { errors }, setValue, watch, control, reset } = useForm<CreateTicketFormData>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      priority: 'medium',
      contacts: [], // Start with empty contacts array
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'contacts',
  });

  const selectedPriority = watch('priority');
  const contacts = watch('contacts');

  // Fetch all contacts on mount for suggestions
  useEffect(() => {
    fetchAllContacts();
    if (user?.role === 'admin' || user?.role === 'manager') {
      fetchUsers();
    }
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchAllContacts = async () => {
    try {
      const response = await contactsApi.getContacts({ limit: 100 });
      const contactsData = response.data?.data || response.data?.data || [];
      setAllContacts(contactsData);
    } catch (error) {
      console.error('Failed to load contacts', error);
      setAllContacts([]);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await usersApi.getUsers();
      const usersData = response.data?.data || [];
      setUsers(usersData);
    } catch (error) {
      console.error('Failed to load users');
      setUsers([]);
    }
  };

  // Filter contacts based on search term
  const filterContacts = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      // Show all contacts when search is empty
      const existingIds = new Set(contacts.map(c => c.contact_id));
      return allContacts.filter(contact => !existingIds.has(contact.id));
    }
    
    const searchLower = searchTerm.toLowerCase();
    const existingIds = new Set(contacts.map(c => c.contact_id));
    return allContacts.filter(contact => 
      !existingIds.has(contact.id) && (
        contact.first_name?.toLowerCase().includes(searchLower) ||
        contact.last_name?.toLowerCase().includes(searchLower) ||
        contact.email?.toLowerCase().includes(searchLower) ||
        contact.company?.toLowerCase().includes(searchLower)
      )
    );
  };

  const handleSearchFocus = () => {
    // Show dropdown with filtered contacts (all contacts if search is empty)
    const filtered = filterContacts(contactSearch);
    setSearchResults(filtered);
    setShowSearchDropdown(true);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setContactSearch(value);
    const filtered = filterContacts(value);
    setSearchResults(filtered);
    setShowSearchDropdown(true);
  };

  const addContact = (contact: Contact) => {
    // Check if contact already exists
    const exists = contacts.some(c => c.contact_id === contact.id);
    if (exists) {
      toast.warning('This contact is already in the list');
      return;
    }

    append({
      contact_id: contact.id,
      contact_name: `${contact.first_name} ${contact.last_name}`,
      contact_email: contact.email,
      contact_company: contact.company || '',
    });
    
    setContactSearch('');
    // Refresh the search results to remove the added contact
    const filtered = filterContacts('');
    setSearchResults(filtered);
    toast.success(`Added ${contact.first_name} ${contact.last_name}`);
  };

  const removeAllContacts = () => {
    if (contacts.length === 0) return;
    
    if (window.confirm(`Remove all ${contacts.length} contacts from the list?`)) {
      // Clear all contacts
      while (fields.length > 0) {
        remove(0);
      }
      // Refresh search results
      const filtered = filterContacts(contactSearch);
      setSearchResults(filtered);
      toast.info('All contacts removed');
    }
  };

  const onSubmit = async (data: CreateTicketFormData) => {
    if (data.contacts.length === 0) {
      toast.error('Please add at least one contact');
      return;
    }

    setLoading(true);
    
    const ticketsToCreate = data.contacts.map(contact => ({
      subject: data.subject,
      description: data.description,
      contact_id: contact.contact_id,
      priority: data.priority as TicketPriority,
      due_date: data.due_date,
      assigned_to: data.assigned_to,
    }));

    let successCount = 0;
    let failedCount = 0;
    const failedContacts: string[] = [];

    // Create tickets one by one
    for (const ticketData of ticketsToCreate) {
      try {
        await ticketsApi.createTicket(ticketData);
        successCount++;
      } catch (error: any) {
        failedCount++;
        const contact = data.contacts.find(c => c.contact_id === ticketData.contact_id);
        failedContacts.push(contact?.contact_name || `Contact ID: ${ticketData.contact_id}`);
      }
    }

    if (successCount > 0) {
      toast.success(`Created ${successCount} ticket${successCount !== 1 ? 's' : ''} successfully`);
    }
    
    if (failedCount > 0) {
      toast.error(`Failed to create ${failedCount} ticket${failedCount !== 1 ? 's' : ''} for: ${failedContacts.join(', ')}`);
    }

    if (successCount > 0) {
      navigate('/tickets');
    }
    
    setLoading(false);
  };

  const getSLADescription = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'Response: 1 hour, Resolution: 4 hours';
      case 'high':
        return 'Response: 4 hours, Resolution: 24 hours';
      case 'medium':
        return 'Response: 8 hours, Resolution: 48 hours';
      case 'low':
        return 'Response: 24 hours, Resolution: 120 hours';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/tickets')}>
          <ArrowLeft size={18} className="mr-2" /> Back to Tickets
        </Button>
        <h1 className="text-3xl font-bold text-deep-ink">Create Multiple Tickets</h1>
      </div>

      <GlassCard className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Ticket Information (Shared across all tickets) */}
          <div>
            <h2 className="text-lg font-semibold text-deep-ink mb-4">Ticket Information (Common for all)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Subject"
                placeholder="Brief summary of the issue"
                error={errors.subject?.message}
                leftIcon={<UserIcon size={18} />}
                {...register('subject')}
              />

              <Select
                label="Priority"
                error={errors.priority?.message}
                {...register('priority')}
              >
                {priorityOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>

              <Input
                label="Due Date"
                type="date"
                error={errors.due_date?.message}
                leftIcon={<Calendar size={18} />}
                {...register('due_date')}
              />

              {(user?.role === 'admin' || user?.role === 'manager') && (
                <Select
                  label="Assign To (All Tickets)"
                  error={errors.assigned_to?.message}
                  onChange={(e) => setValue('assigned_to', e.target.value ? Number(e.target.value) : undefined)}
                >
                  <option value="">Unassigned</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.first_name} {u.last_name}
                    </option>
                  ))}
                </Select>
              )}

              <div className="md:col-span-2">
                <Textarea
                  label="Description (Common for all tickets)"
                  placeholder="Detailed description of the issue..."
                  rows={6}
                  error={errors.description?.message}
                  {...register('description')}
                />
              </div>
            </div>
          </div>

          {/* Contacts Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-deep-ink flex items-center">
                <Users size={18} className="mr-2" />
                Contacts ({contacts.length})
              </h2>
              {contacts.length > 0 && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  onClick={removeAllContacts}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 size={16} className="mr-1" /> Clear All
                </Button>
              )}
            </div>

            {/* Search Input */}
            <div className="relative mb-4" ref={searchRef}>
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search contacts by name, email, or company... (Click to see all contacts)"
                  value={contactSearch}
                  onChange={handleSearchChange}
                  onFocus={handleSearchFocus}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                {searching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  </div>
                )}
              </div>

              {/* Search Results Dropdown */}
              {showSearchDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                  {searchResults.length > 0 ? (
                    searchResults.map((contact) => (
                      <button
                        key={contact.id}
                        type="button"
                        onClick={() => addContact(contact)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 flex justify-between items-center border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-deep-ink">
                            {contact.first_name} {contact.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {contact.email && <span>{contact.email}</span>}
                            {contact.company && <span className="ml-2">• {contact.company}</span>}
                          </div>
                        </div>
                        <Plus size={16} className="text-primary flex-shrink-0 ml-2" />
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-gray-500 text-sm text-center">
                      {contactSearch ? 'No contacts found matching your search' : 'No contacts available'}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Selected Contacts List */}
            {contacts.length > 0 ? (
              <div className="space-y-2 max-h-80 overflow-y-auto border border-gray-200 rounded-lg p-3">
                {fields.map((field, index) => {
                  const contact = contacts[index];
                  return (
                    <div
                      key={field.id}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-deep-ink">
                          {contact?.contact_name || `Contact ${index + 1}`}
                        </div>
                        {contact?.contact_email && (
                          <div className="text-sm text-gray-500">{contact.contact_email}</div>
                        )}
                        {contact?.contact_company && (
                          <div className="text-sm text-gray-400">{contact.contact_company}</div>
                        )}
                      </div>
                      <input type="hidden" {...register(`contacts.${index}.contact_id`)} />
                      <input type="hidden" {...register(`contacts.${index}.contact_name`)} />
                      <input type="hidden" {...register(`contacts.${index}.contact_email`)} />
                      <input type="hidden" {...register(`contacts.${index}.contact_company`)} />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          remove(index);
                          // Refresh search results after removal
                          setTimeout(() => {
                            const filtered = filterContacts(contactSearch);
                            setSearchResults(filtered);
                          }, 100);
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <UserPlus size={48} className="mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500">No contacts added yet</p>
                <p className="text-sm text-gray-400">Click the search box above to see all contacts</p>
              </div>
            )}
            {errors.contacts && (
              <p className="text-red-500 text-sm mt-1">{errors.contacts.message}</p>
            )}
          </div>

          {/* SLA Information */}
          {selectedPriority && (
            <div className="bg-primary/5 p-4 rounded-lg">
              <h3 className="font-medium text-deep-ink mb-2 flex items-center">
                <AlertCircle size={18} className="mr-2 text-primary" />
                Service Level Agreement (SLA) - Will apply to ALL tickets
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Priority</p>
                  <p className="font-medium capitalize">{selectedPriority}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">SLA Targets</p>
                  <p className="font-medium">{getSLADescription(selectedPriority)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Summary */}
          {contacts.length > 0 && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-deep-ink mb-2">Summary</h3>
              <p className="text-sm text-gray-600">
                You are about to create <strong>{contacts.length}</strong> ticket{contacts.length !== 1 && 's'} 
                for <strong>{contacts.length}</strong> contact{contacts.length !== 1 && 's'}.
                {contacts.length > 5 && " This may take a few moments."}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/tickets')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || contacts.length === 0}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Tickets...
                </>
              ) : (
                <>
                  <Send size={18} className="mr-2" />
                  Create {contacts.length} Ticket{contacts.length !== 1 && 's'}
                </>
              )}
            </Button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}