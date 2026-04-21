import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, X, Camera } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { GlassCard } from '../../components/ui/GlassCard';
import { contactsApi } from '../../api/contacts';
import type { CreateContactData } from '../../types/contact';
import { HelpButton } from '../../components/ui/HelpButton';
import { helpContent } from '../../utils/helpContent';
import { useToast } from '../../hooks/useToast';

export function CreateContact() {
    const navigate = useNavigate();
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<CreateContactData>({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        company: '',
        job_title: '',
        status: 'lead',
        source: 'website',
        notes: '',
        tags: [],
    });
    const [tagInput, setTagInput] = useState('');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // First create the contact
            const response = await contactsApi.createContact(formData);
            const contactId = response.data.contact.id;

            // Then upload avatar if selected
            if (avatarFile) {
                await contactsApi.uploadAvatar(contactId, avatarFile);
            }

            navigate(`/contacts/${contactId}`);
        } catch (error) {
            console.error('Failed to create contact:', error);
            toast.error('Failed to create contact');
        } finally {
            setLoading(false);
        }
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/contacts')}
                    >
                        <ArrowLeft size={20} />
                    </Button>
                    <div>
                        <div className="flex items-center space-x-2">
                            <h1 className="text-3xl font-bold text-deep-ink">Create Contact</h1>
                            <HelpButton content={helpContent.contacts} size="md" />
                        </div>
                        <p className="text-gray-600 mt-1">Add a new contact to your CRM</p>
                    </div>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
                <GlassCard className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Avatar Upload */}
                        <div className="md:col-span-2 flex flex-col items-center py-4">
                            <div className="relative group">
                                <div className="w-24 h-24 rounded-full overflow-hidden bg-linear-to-br from-primary to-accent flex items-center justify-center">
                                    {avatarPreview ? (
                                        <img
                                            src={avatarPreview}
                                            alt="Avatar preview"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-white text-2xl font-bold">
                                            {formData.first_name?.[0] || ''}{formData.last_name?.[0] || ''}
                                        </span>
                                    )}
                                </div>
                                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/gif,image/webp"
                                        onChange={handleAvatarSelect}
                                        className="hidden"
                                        id="avatar-upload"
                                    />
                                    <label
                                        htmlFor="avatar-upload"
                                        className="cursor-pointer p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                                    >
                                        <Camera size={18} className="text-gray-700" />
                                    </label>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Upload avatar (optional, max 2MB)
                            </p>
                        </div>
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
                                    value={formData.first_name}
                                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                />
                                <Input
                                    label="Last Name"
                                    required
                                    value={formData.last_name}
                                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                />
                            </div>

                            <Input
                                label="Email"
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />

                            <Input
                                label="Phone"
                                type="tel"
                                value={formData.phone || ''}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                                    value={formData.source || ''}
                                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
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
                                    value={formData.company || ''}
                                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                />

                                <Input
                                    label="Job Title"
                                    value={formData.job_title || ''}
                                    onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                                />
                            </div>

                            <div>
                                <div className="flex items-center space-x-2 mb-2">
                                    <label className="block text-sm font-medium text-gray-700">Status</label>
                                    <HelpButton content={helpContent.status} size="sm" />
                                </div>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
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
                                value={formData.notes || ''}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                rows={4}
                                className="w-full px-3 py-2 bg-white/70 border border-blue-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="Add any additional notes about this contact..."
                            />
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-blue-100">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate('/contacts')}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            <Save size={18} className="mr-2" />
                            {loading ? 'Creating...' : 'Create Contact'}
                        </Button>
                    </div>
                </GlassCard>
            </form>
        </div>
    );
}