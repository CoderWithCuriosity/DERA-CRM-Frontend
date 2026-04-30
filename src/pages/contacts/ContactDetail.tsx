import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Building, Calendar, Edit, Trash2, Plus, Activity, Ticket, Briefcase, X, Save, Send, DollarSign } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { contactsApi } from '../../api/contacts';
import { activitiesApi } from '../../api/activities';
import { ticketsApi } from '../../api/tickets';
import { dealsApi } from '../../api/deals';
import type { Contact } from '../../types/contact';
import type { ActivityType } from '../../types/activity';
import type { TicketPriority } from '../../types/ticket';
import { formatDate, formatPhone } from '../../utils/formatters';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';
import { AvatarUpload } from '../../components/contacts/AvatarUpload';
import ContactAttachments from '../../components/contacts/ContactAttachments';
import { attachmentsApi } from '../../api/attachments';

type QuickActionType = 'activity' | 'ticket' | 'deal' | null;

// Activity type options
const activityTypeOptions = [
  { value: 'call', label: 'Call', icon: '📞' },
  { value: 'email', label: 'Email', icon: '✉️' },
  { value: 'meeting', label: 'Meeting', icon: '👥' },
  { value: 'task', label: 'Task', icon: '✅' },
  { value: 'note', label: 'Note', icon: '📝' },
  { value: 'follow-up', label: 'Follow-up', icon: '🔔' },
];

const priorityOptions = [
  { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800' },
  { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-800' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' },
];

const stageOptions = [
  { value: 'lead', label: 'Lead' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'negotiation', label: 'Negotiation' },
];

export default function ContactDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const [contact, setContact] = useState<Contact | null>(null);
  const [deals, setDeals] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'deals' | 'tickets' | 'activities' | 'attachments'>('details');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [attachmentCount, setAttachmentCount] = useState(0);


  const getAttachmentCount = async () => {
    if (!id) return;
    try {
      const response = await attachmentsApi.getAttachments(Number(id));
      if (response.success) {
        setAttachmentCount(response.data.attachments.length);
      }
    } catch (error) {
      console.error('Failed to fetch attachment count:', error);
    }
  };
  
  // Quick action states
  const [quickAction, setQuickAction] = useState<QuickActionType>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Activity form state
  const [activityForm, setActivityForm] = useState({
    type: 'task' as ActivityType,
    subject: '',
    description: '',
    scheduled_date: new Date().toISOString().slice(0, 16),
    duration: '',
  });
  
  // Ticket form state
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    description: '',
    priority: 'medium' as TicketPriority,
    due_date: '',
  });
  
  // Deal form state
  const [dealForm, setDealForm] = useState({
    name: '',
    stage: 'lead' as any,
    amount: '',
    probability: '10',
    expected_close_date: '',
    notes: '',
  });

  useEffect(() => {
    if (id) {
      fetchContact();
    }
  }, [id]);

  const fetchContact = async () => {
    try {
      setLoading(true);
      const response = await contactsApi.getContactById(Number(id));
      console.log('Contact detail response:', response.data);

      if (response?.success && response?.data?.contact) {
        const contactData = response?.data.contact;
        setContact(contactData);
        setAvatar(contactData.avatar || null);
        setDeals(contactData.deals || []);
        setTickets(contactData.tickets || []);
        setActivities(contactData.activities || []);
        await getAttachmentCount();
      } else {
        console.error('Unexpected response structure:', response.data);
        toast.error('Invalid response format');
        navigate('/contacts');
      }
    } catch (error) {
      console.error('Failed to load contact:', error);
      toast.error('Failed to load contact');
      navigate('/contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this contact?')) return;
    try {
      await contactsApi.deleteContact(Number(id));
      toast.success('Contact deleted successfully');
      navigate('/contacts');
    } catch (error) {
      console.error('Failed to delete contact:', error);
      toast.error('Failed to delete contact');
    }
  };

  // Quick Action Handlers
  const handleCreateActivity = async () => {
    if (!activityForm.subject.trim()) {
      toast.error('Subject is required');
      return;
    }
    
    setSubmitting(true);
    try {
      const payload: any = {
        type: activityForm.type,
        subject: activityForm.subject,
        description: activityForm.description,
        contact_id: Number(id),
        user_id: user?.id,
      };
      
      // Add scheduled date for non-note types
      if (activityForm.type !== 'note') {
        payload.scheduled_date = activityForm.scheduled_date;
      }
      
      // Add duration for calls/meetings
      if ((activityForm.type === 'call' || activityForm.type === 'meeting') && activityForm.duration) {
        payload.duration = parseInt(activityForm.duration);
      }
      
      await activitiesApi.createActivity(payload);
      toast.success('Activity created successfully');
      setQuickAction(null);
      resetActivityForm();
      fetchContact(); // Refresh data
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create activity');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!ticketForm.subject.trim()) {
      toast.error('Subject is required');
      return;
    }
    if (!ticketForm.description.trim()) {
      toast.error('Description is required');
      return;
    }
    
    setSubmitting(true);
    try {
      await ticketsApi.createTicket({
        subject: ticketForm.subject,
        description: ticketForm.description,
        contact_id: Number(id),
        priority: ticketForm.priority,
        due_date: ticketForm.due_date || undefined,
        assigned_to: user?.id,
      });
      toast.success('Ticket created successfully');
      setQuickAction(null);
      resetTicketForm();
      fetchContact(); // Refresh data
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateDeal = async () => {
    if (!dealForm.name.trim()) {
      toast.error('Deal name is required');
      return;
    }
    
    setSubmitting(true);
    try {
      await dealsApi.createDeal({
        name: dealForm.name,
        contact_id: Number(id),
        stage: dealForm.stage,
        amount: parseFloat(dealForm.amount) || 0,
        probability: parseInt(dealForm.probability) || 0,
        expected_close_date: dealForm.expected_close_date || undefined,
        notes: dealForm.notes || undefined,
        user_id: user?.id,
      });
      toast.success('Deal created successfully');
      setQuickAction(null);
      resetDealForm();
      fetchContact(); // Refresh data
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create deal');
    } finally {
      setSubmitting(false);
    }
  };

  const resetActivityForm = () => {
    setActivityForm({
      type: 'task',
      subject: '',
      description: '',
      scheduled_date: new Date().toISOString().slice(0, 16),
      duration: '',
    });
  };

  const resetTicketForm = () => {
    setTicketForm({
      subject: '',
      description: '',
      priority: 'medium',
      due_date: '',
    });
  };

  const resetDealForm = () => {
    setDealForm({
      name: '',
      stage: 'lead',
      amount: '',
      probability: '10',
      expected_close_date: '',
      notes: '',
    });
  };

  const getActivityTypeIcon = (type: string) => {
    const option = activityTypeOptions.find(opt => opt.value === type);
    return option?.icon || '📋';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Contact not found</p>
        <Button variant="primary" onClick={() => navigate('/contacts')} className="mt-4">
          Back to Contacts
        </Button>
      </div>
    );
  }

  const contactFullName = `${contact.first_name} ${contact.last_name}`;

  return (
    <div className="space-y-6">
      {/* Header with back button and quick action buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/contacts')}>
            <ArrowLeft size={18} className="mr-2" /> Back
          </Button>
          <h1 className="text-3xl font-bold text-deep-ink">Contact Profile</h1>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setQuickAction('activity')}
          >
            <Activity size={16} className="mr-2" /> Log Activity
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setQuickAction('ticket')}
          >
            <Ticket size={16} className="mr-2" /> New Ticket
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setQuickAction('deal')}
          >
            <Briefcase size={16} className="mr-2" /> Add Deal
          </Button>
        </div>
      </div>

      {/* Main card */}
      <GlassCard className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <AvatarUpload
              contactId={contact.id}
              currentAvatar={avatar}
              contactName={contactFullName}
              onAvatarUpdate={(avatarUrl) => {
                setAvatar(avatarUrl);
                setContact(prev => prev ? { ...prev, avatar: avatarUrl } : null);
              }}
            />            
            <div>
              <h2 className="text-2xl font-bold text-deep-ink">
                {contactFullName}
              </h2>
              <p className="text-gray-600">
                {contact.job_title} {contact.company && `at ${contact.company}`}
              </p>
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant={contact.status === 'active' ? 'success' : contact.status === 'lead' ? 'info' : 'default'}>
                  {contact.status}
                </Badge>
                {contact.tags?.map(tag => (
                  <Badge key={tag} variant="primary" size="sm">{tag}</Badge>
                ))}
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => navigate(`/contacts/${id}/edit`)}>
              <Edit size={16} className="mr-2" /> Edit
            </Button>
            <Button variant="danger" size="sm" onClick={handleDelete}>
              <Trash2 size={16} className="mr-2" /> Delete
            </Button>
          </div>
        </div>

        {/* Contact details grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="space-y-3">
            <div className="flex items-center text-gray-600">
              <Mail size={18} className="mr-3 text-primary" />
              <a href={`mailto:${contact.email}`} className="hover:text-primary">{contact.email}</a>
            </div>
            {contact.phone && (
              <div className="flex items-center text-gray-600">
                <Phone size={18} className="mr-3 text-primary" />
                <a href={`tel:${contact.phone}`} className="hover:text-primary">{formatPhone(contact.phone)}</a>
              </div>
            )}
            {contact.company && (
              <div className="flex items-center text-gray-600">
                <Building size={18} className="mr-3 text-primary" />
                <span>{contact.company}</span>
              </div>
            )}
          </div>
          <div className="space-y-3">
            <div className="flex items-center text-gray-600">
              <Calendar size={18} className="mr-3 text-primary" />
              <span>Created {formatDate(contact.created_at)}</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Calendar size={18} className="mr-3 text-primary" />
              <span>Last updated {formatDate(contact.updated_at)}</span>
            </div>
            {contact.notes && (
              <div className="flex items-start text-gray-600">
                <span className="mr-3 text-primary">📝</span>
                <p className="text-sm">{contact.notes}</p>
              </div>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Tabs for related data */}
      <div className="border-b border-blue-100">
        <nav className="flex space-x-8">
          {(['details', 'deals', 'tickets', 'activities', 'attachments'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab} {tab !== 'details' && (
                <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded-full">
                  {tab === 'deals' ? deals.length : tab === 'tickets' ? tickets.length : tab === 'activities' ? activities.length : attachmentCount }
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <GlassCard className="p-6">
        {activeTab === 'details' && (
          <div className="space-y-4">
            <h3 className="font-medium text-deep-ink">Additional Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Source</p>
                <p className="text-gray-800">{contact.source || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">User ID</p>
                <p className="text-gray-800">{contact.user_id}</p>
              </div>
              {contact.created_by && (
                <div>
                  <p className="text-sm text-gray-500">Created By</p>
                  <p className="text-gray-800">
                    {contact.created_by.first_name} {contact.created_by.last_name}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'deals' && (
          <div>
            {deals.length > 0 ? (
              <div className="space-y-3">
                {deals.map(deal => (
                  <div 
                    key={deal.id} 
                    className="p-3 bg-white/50 rounded-lg flex justify-between items-center cursor-pointer hover:bg-white/80 transition-colors"
                    onClick={() => navigate(`/deals/${deal.id}`)}
                  >
                    <div>
                      <p className="font-medium">{deal.name}</p>
                      <p className="text-sm text-gray-500">Amount: ${deal.amount?.toLocaleString()}</p>
                    </div>
                    <Badge variant={deal.stage === 'won' ? 'success' : deal.stage === 'lost' ? 'danger' : 'default'}>
                      {deal.stage}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No deals associated with this contact.</p>
                <Button variant="outline" size="sm" onClick={() => setQuickAction('deal')}>
                  <Plus size={16} className="mr-2" /> Add Deal
                </Button>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'tickets' && (
          <div>
            {tickets.length > 0 ? (
              <div className="space-y-3">
                {tickets.map(ticket => (
                  <div 
                    key={ticket.id} 
                    className="p-3 bg-white/50 rounded-lg flex justify-between items-center cursor-pointer hover:bg-white/80 transition-colors"
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                  >
                    <div>
                      <p className="font-medium">{ticket.subject}</p>
                      <p className="text-sm text-gray-500">Priority: {ticket.priority}</p>
                    </div>
                    <Badge variant={ticket.status === 'open' ? 'warning' : ticket.status === 'closed' ? 'success' : 'default'}>
                      {ticket.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No tickets associated with this contact.</p>
                <Button variant="outline" size="sm" onClick={() => setQuickAction('ticket')}>
                  <Plus size={16} className="mr-2" /> Create Ticket
                </Button>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'activities' && (
          <div>
            {activities.length > 0 ? (
              <div className="space-y-3">
                {activities.map(activity => (
                  <div 
                    key={activity.id} 
                    className="p-3 bg-white/50 rounded-lg cursor-pointer hover:bg-white/80 transition-colors"
                    onClick={() => navigate(`/activities/${activity.id}`)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getActivityTypeIcon(activity.type)}</span>
                        <div>
                          <p className="font-medium">{activity.subject}</p>
                          <p className="text-xs text-gray-500">Type: {activity.type}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-gray-500">{formatDate(activity.scheduled_date)}</span>
                        <Badge variant={activity.status === 'completed' ? 'success' : 'default'} size="sm" className="ml-2">
                          {activity.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No activities logged yet.</p>
                <Button variant="outline" size="sm" onClick={() => setQuickAction('activity')}>
                  <Plus size={16} className="mr-2" /> Log Activity
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'attachments' && (
          <ContactAttachments contactId={contact.id} contactName={contactFullName} />
        )}
      </GlassCard>

      {/* Quick Action Modals */}
      
      {/* Create Activity Modal */}
      {quickAction === 'activity' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setQuickAction(null)}>
          <GlassCard className="p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-deep-ink flex items-center">
                <Activity size={20} className="mr-2 text-primary" />
                Log Activity for {contactFullName}
              </h3>
              <button onClick={() => setQuickAction(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Activity Type *</label>
                <div className="grid grid-cols-3 gap-2">
                  {activityTypeOptions.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setActivityForm(prev => ({ ...prev, type: opt.value as ActivityType }))}
                      className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                        activityForm.type === opt.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-gray-200 hover:border-primary/50 text-gray-600'
                      }`}
                    >
                      <span className="mr-1">{opt.icon}</span> {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <Input
                label="Subject *"
                placeholder={activityForm.type === 'note' ? 'Note title...' : 'Brief description...'}
                value={activityForm.subject}
                onChange={(e) => setActivityForm(prev => ({ ...prev, subject: e.target.value }))}
              />
              
              <Textarea
                label="Description"
                placeholder="Additional details..."
                rows={3}
                value={activityForm.description}
                onChange={(e) => setActivityForm(prev => ({ ...prev, description: e.target.value }))}
              />
              
              {activityForm.type !== 'note' && (
                <Input
                  label={activityForm.type === 'task' ? 'Due Date' : 'Scheduled Date & Time'}
                  type="datetime-local"
                  value={activityForm.scheduled_date}
                  onChange={(e) => setActivityForm(prev => ({ ...prev, scheduled_date: e.target.value }))}
                />
              )}
              
              {(activityForm.type === 'call' || activityForm.type === 'meeting') && (
                <Input
                  label="Duration (minutes)"
                  type="number"
                  placeholder="e.g., 30"
                  value={activityForm.duration}
                  onChange={(e) => setActivityForm(prev => ({ ...prev, duration: e.target.value }))}
                />
              )}
              
              <div className="bg-blue-50/50 p-3 rounded-lg text-sm text-gray-600">
                <p>📌 This activity will be automatically linked to {contactFullName}</p>
                <p>👤 Assigned to: {user?.first_name} {user?.last_name}</p>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="outline" onClick={() => setQuickAction(null)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateActivity} disabled={submitting}>
                  <Save size={16} className="mr-2" />
                  {submitting ? 'Creating...' : 'Create Activity'}
                </Button>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
      
      {/* Create Ticket Modal */}
      {quickAction === 'ticket' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setQuickAction(null)}>
          <GlassCard className="p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-deep-ink flex items-center">
                <Ticket size={20} className="mr-2 text-primary" />
                Create Ticket for {contactFullName}
              </h3>
              <button onClick={() => setQuickAction(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <Input
                label="Subject *"
                placeholder="Brief summary of the issue"
                value={ticketForm.subject}
                onChange={(e) => setTicketForm(prev => ({ ...prev, subject: e.target.value }))}
              />
              
              <Textarea
                label="Description *"
                placeholder="Detailed description of the issue..."
                rows={4}
                value={ticketForm.description}
                onChange={(e) => setTicketForm(prev => ({ ...prev, description: e.target.value }))}
              />
              
              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Priority"
                  value={ticketForm.priority}
                  onChange={(e) => setTicketForm(prev => ({ ...prev, priority: e.target.value as TicketPriority }))}
                >
                  {priorityOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </Select>
                
                <Input
                  label="Due Date"
                  type="date"
                  value={ticketForm.due_date}
                  onChange={(e) => setTicketForm(prev => ({ ...prev, due_date: e.target.value }))}
                />
              </div>
              
              <div className="bg-blue-50/50 p-3 rounded-lg text-sm text-gray-600">
                <p>📌 This ticket will be automatically linked to {contactFullName}</p>
                <p>👤 Assigned to: {user?.first_name} {user?.last_name}</p>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="outline" onClick={() => setQuickAction(null)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTicket} disabled={submitting}>
                  <Send size={16} className="mr-2" />
                  {submitting ? 'Creating...' : 'Create Ticket'}
                </Button>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
      
      {/* Create Deal Modal */}
      {quickAction === 'deal' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setQuickAction(null)}>
          <GlassCard className="p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-deep-ink flex items-center">
                <Briefcase size={20} className="mr-2 text-primary" />
                Create Deal for {contactFullName}
              </h3>
              <button onClick={() => setQuickAction(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <Input
                label="Deal Name *"
                placeholder="e.g., Enterprise Plan - Company Name"
                value={dealForm.name}
                onChange={(e) => setDealForm(prev => ({ ...prev, name: e.target.value }))}
              />
              
              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Stage"
                  value={dealForm.stage}
                  onChange={(e) => setDealForm(prev => ({ ...prev, stage: e.target.value }))}
                >
                  {stageOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </Select>
                
                <Input
                  label="Amount"
                  type="number"
                  placeholder="0.00"
                  leftIcon={<DollarSign size={16} />}
                  value={dealForm.amount}
                  onChange={(e) => setDealForm(prev => ({ ...prev, amount: e.target.value }))}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Probability (%)"
                  type="number"
                  min="0"
                  max="100"
                  value={dealForm.probability}
                  onChange={(e) => setDealForm(prev => ({ ...prev, probability: e.target.value }))}
                />
                
                <Input
                  label="Expected Close Date"
                  type="date"
                  value={dealForm.expected_close_date}
                  onChange={(e) => setDealForm(prev => ({ ...prev, expected_close_date: e.target.value }))}
                />
              </div>
              
              <Textarea
                label="Notes"
                placeholder="Additional notes about this deal..."
                rows={3}
                value={dealForm.notes}
                onChange={(e) => setDealForm(prev => ({ ...prev, notes: e.target.value }))}
              />
              
              <div className="bg-blue-50/50 p-3 rounded-lg text-sm text-gray-600">
                <p>📌 This deal will be automatically linked to {contactFullName}</p>
                <p>👤 Owner: {user?.first_name} {user?.last_name}</p>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="outline" onClick={() => setQuickAction(null)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateDeal} disabled={submitting}>
                  <Briefcase size={16} className="mr-2" />
                  {submitting ? 'Creating...' : 'Create Deal'}
                </Button>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}