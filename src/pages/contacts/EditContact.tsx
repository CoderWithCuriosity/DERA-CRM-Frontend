import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, X } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { contactsApi } from '../../api/contacts';
import type { UpdateContactData } from '../../types/contact';
import { useToast } from '../../hooks/useToast';
import { HelpButton } from '../../components/ui/HelpButton';
import { helpContent } from '../../utils/helpContent';

export function EditContact() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [formData, setFormData] = useState<UpdateContactData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company: '',
    job_title: '',
    status: 'active',
    source: '',
    notes: '',
    tags: [],
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
      
      if (response?.success && response?.data?.contact) {
        const contact = response.data.contact;
        setFormData({
          first_name: contact.first_name || '',
          last_name: contact.last_name || '',
          email: contact.email || '',
          phone: contact.phone || '',
          company: contact.company || '',
          job_title: contact.job_title || '',
          status: contact.status || 'active',
          source: contact.source || '',
          notes: contact.notes || '',
          tags: contact.tags || [],
        });
      } else {
        toast.error('Contact not found');
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter(tag => tag !== tagToRemove),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.first_name || !formData.last_name || !formData.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      await contactsApi.updateContact(Number(id), formData);
      toast.success('Contact updated successfully');
      navigate(`/contacts/${id}`);
    } catch (error) {
      console.error('Failed to update contact:', error);
      toast.error('Failed to update contact');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/contacts/${id}`)}
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-3xl font-bold text-deep-ink">Edit Contact</h1>
              <HelpButton content={helpContent.contacts} size="md" />
            </div>
            <p className="text-gray-600 mt-1">Update contact information</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <GlassCard className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="flex row items-center space-x-2 pb-2">
                <h3 className="text-lg font-semibold text-deep-ink">Basic Information</h3>
                <HelpButton content={helpContent.contacts} size="sm" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  required
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                />
                <Input
                  label="Last Name"
                  required
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                />
              </div>

              <Input
                label="Email"
                type="email"
                required
                name="email"
                value={formData.email}
                onChange={handleChange}
              />

              <Input
                label="Phone"
                type="tel"
                name="phone"
                value={formData.phone || ''}
                onChange={handleChange}
              />
            </div>

            {/* Professional Information */}
            <div className="space-y-4 pt-1">
              <h3 className="text-lg font-semibold text-deep-ink">Professional Information</h3>

              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <label className="block text-sm font-medium text-gray-700">Source</label>
                  <HelpButton content={helpContent.source} size="sm" />
                </div>
                <select
                  name="source"
                  value={formData.source || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white/70 border border-blue-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="website">Website</option>
                  <option value="referral">Referral</option>
                  <option value="social">Social Media</option>
                  <option value="email">Email</option>
                  <option value="call">Phone Call</option>
                  <option value="event">Event / Conference</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Company"
                  name="company"
                  value={formData.company || ''}
                  onChange={handleChange}
                />

                <Input
                  label="Job Title"
                  name="job_title"
                  value={formData.job_title || ''}
                  onChange={handleChange}
                />
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <HelpButton content={helpContent.status} size="sm" />
                </div>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white/70 border border-blue-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="lead">Lead</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Tags */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex row items-center space-x-2">
                <h3 className="text-lg font-semibold text-deep-ink">Tags</h3>
                <HelpButton content={helpContent.tags} size="sm" />
              </div>

              <div className="flex space-x-2">
                <Input
                  placeholder="Add a tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                />
                <Button type="button" variant="outline" onClick={handleAddTag}>
                  Add
                </Button>
              </div>

              {formData.tags && formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary/10 text-primary"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 hover:text-primary-dark"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="md:col-span-2 space-y-4">
              <h3 className="text-lg font-semibold text-deep-ink">Notes</h3>

              <textarea
                name="notes"
                value={formData.notes || ''}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 bg-white/70 border border-blue-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                placeholder="Add any additional notes about this contact..."
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-blue-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/contacts/${id}`)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              <Save size={18} className="mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </GlassCard>
      </form>
    </div>
  );
}