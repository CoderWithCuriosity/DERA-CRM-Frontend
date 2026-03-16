import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Building, Calendar, Edit, Trash2 } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { contactsApi } from '../../api/contacts';
import type { Contact } from '../../types/contact';
import { formatDate, formatPhone } from '../../utils/formatters';
import { useToast } from '../../hooks/useToast';
import { AvatarUpload } from '../../components/contacts/AvatarUpload';

export default function ContactDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [contact, setContact] = useState<Contact | null>(null);
  const [deals, setDeals] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'deals' | 'tickets' | 'activities'>('details');
  const [avatar, setAvatar] = useState<string | null>(null);

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

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/contacts')}>
          <ArrowLeft size={18} className="mr-2" /> Back
        </Button>
        <h1 className="text-3xl font-bold text-deep-ink">Contact Profile</h1>
      </div>

      {/* Main card */}
      <GlassCard className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <AvatarUpload
              contactId={contact.id}
              currentAvatar={avatar}
              contactName={`${contact.first_name} ${contact.last_name}`}
              onAvatarUpdate={(avatarUrl) => {
                setAvatar(avatarUrl);
                setContact(prev => prev ? { ...prev, avatar: avatarUrl } : null);
              }}
            />            
            <div>
              <h2 className="text-2xl font-bold text-deep-ink">
                {contact.first_name} {contact.last_name}
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
          {(['details', 'deals', 'tickets', 'activities'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              {tab} {tab !== 'details' && (
                <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded-full">
                  {tab === 'deals' ? deals.length : tab === 'tickets' ? tickets.length : activities.length}
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
                  <div key={deal.id} className="p-3 bg-white/50 rounded-lg flex justify-between items-center">
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
              <p className="text-gray-500 text-center py-8">No deals associated with this contact.</p>
            )}
          </div>
        )}
        {activeTab === 'tickets' && (
          <div>
            {tickets.length > 0 ? (
              <div className="space-y-3">
                {tickets.map(ticket => (
                  <div key={ticket.id} className="p-3 bg-white/50 rounded-lg flex justify-between items-center">
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
              <p className="text-gray-500 text-center py-8">No tickets associated with this contact.</p>
            )}
          </div>
        )}
        {activeTab === 'activities' && (
          <div>
            {activities.length > 0 ? (
              <div className="space-y-3">
                {activities.map(activity => (
                  <div key={activity.id} className="p-3 bg-white/50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <p className="font-medium">{activity.subject}</p>
                      <span className="text-sm text-gray-500">{formatDate(activity.scheduled_date)}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Type: {activity.type}</p>
                    <Badge variant={activity.status === 'completed' ? 'success' : 'default'} size="sm" className="mt-2">
                      {activity.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No recent activities.</p>
            )}
          </div>
        )}
      </GlassCard>
    </div>
  );
}