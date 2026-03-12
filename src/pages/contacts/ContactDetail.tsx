import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Building, Calendar, Edit, Trash2 } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { contactsApi } from '../../api/contacts';
import type { ContactDetailResponse } from '../../types/contact';
import { formatDate, formatPhone } from '../../utils/formatters';
import { useToast } from '../../hooks/useToast';

export default function ContactDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [contact, setContact] = useState<ContactDetailResponse['data']['contact'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'deals' | 'tickets' | 'activities'>('details');

  useEffect(() => {
    if (id) {
      fetchContact();
    }
  }, [id]);

  const fetchContact = async () => {
    try {
      const response = await contactsApi.getContactById(Number(id));
      setContact(response.data);
    } catch (error) {
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
      toast.success('Contact deleted');
      navigate('/contacts');
    } catch (error) {
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

  if (!contact) return null;

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
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-2xl font-bold">
              {contact.first_name[0]}{contact.last_name[0]}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-deep-ink">{contact.first_name} {contact.last_name}</h2>
              <p className="text-gray-600">{contact.job_title} {contact.company && `at ${contact.company}`}</p>
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant={contact.status === 'active' ? 'success' : contact.status === 'lead' ? 'info' : 'default'}>
                  {contact.status}
                </Badge>
                {contact.tags.map(tag => (
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
                <div className="mr-3 mt-1">📝</div>
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
              className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <GlassCard className="p-6">
        {activeTab === 'details' && (
          <div className="space-y-4">
            <h3 className="font-medium text-deep-ink">Additional Information</h3>
            <p className="text-gray-600">Source: {contact.source || 'Unknown'}</p>
            {/* More fields as needed */}
          </div>
        )}
        {activeTab === 'deals' && (
          <div>
            {contact.deals?.length ? (
              <div className="space-y-3">
                {contact.deals.map(deal => (
                  <div key={deal.id} className="p-3 bg-white/50 rounded-lg flex justify-between">
                    <span>{deal.name}</span>
                    <Badge>{deal.stage}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No deals associated.</p>
            )}
          </div>
        )}
        {activeTab === 'tickets' && (
          <div>
            {contact.tickets?.length ? (
              <div className="space-y-3">
                {contact.tickets.map(ticket => (
                  <div key={ticket.id} className="p-3 bg-white/50 rounded-lg flex justify-between">
                    <span>{ticket.subject}</span>
                    <Badge variant={ticket.status === 'open' ? 'warning' : 'default'}>{ticket.status}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No tickets.</p>
            )}
          </div>
        )}
        {activeTab === 'activities' && (
          <div>
            {contact.activities?.length ? (
              <div className="space-y-3">
                {contact.activities.map(activity => (
                  <div key={activity.id} className="p-3 bg-white/50 rounded-lg flex justify-between">
                    <span>{activity.subject}</span>
                    <span className="text-sm text-gray-500">{formatDate(activity.scheduled_date)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No recent activities.</p>
            )}
          </div>
        )}
      </GlassCard>
    </div>
  );
}