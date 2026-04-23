import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Copy, Trash2, Edit, Mail } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { emailTemplatesApi } from '../../api/emailTemplates';
import type { EmailTemplate } from '../../types/emailTemplate';
import { formatDate } from '../../utils/formatters';
import { useToast } from '../../hooks/useToast';

export default function EmailTemplates() {
  const navigate = useNavigate();
  const toast = useToast();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await emailTemplatesApi.getTemplates();
      setTemplates(response.data.templates);
    } catch (error) {
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async (id: number) => {
    try {
      const response = await emailTemplatesApi.duplicateTemplate(id);
      setTemplates(prev => [...prev, response.data.template]);
      toast.success('Template duplicated');
    } catch (error) {
      toast.error('Failed to duplicate');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await emailTemplatesApi.deleteTemplate(id);
        setTemplates(prev => prev.filter(t => t.id !== id));
        toast.success('Template deleted');
      } catch (error) {
        toast.error('Failed to delete template');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-deep-ink">Email Templates</h1>
          <p className="text-gray-600 mt-1">Create and manage your email templates</p>
        </div>
        <Button onClick={() => navigate('/campaigns/templates/new')}>
          <Plus size={18} className="mr-2" /> New Template
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : templates?.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-12">
            <div className="bg-gray-50 rounded-full p-4 mb-4">
              <Mail size={48} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No templates yet</h3>
            <p className="text-gray-500 mb-6 text-center max-w-sm">
              Create your first email template to use in campaigns.
            </p>
            <Button onClick={() => navigate('/campaigns/templates/new')}>
              <Plus size={18} className="mr-2" /> Create Template
            </Button>
          </div>
        ) : (
          templates?.map(template => (
            <GlassCard key={template.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-medium text-deep-ink">{template.name}</h3>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{template.subject}</p>
                  {template.variables && template.variables.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500">Variables:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {template.variables.slice(0, 3).map(variable => (
                          <span key={variable} className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                            {`{{${variable}}}`}
                          </span>
                        ))}
                        {template.variables.length > 3 && (
                          <span className="text-xs text-gray-400">
                            +{template.variables.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    Updated {formatDate(template.updated_at)}
                  </p>
                </div>
                <div className="flex space-x-1 ml-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => navigate(`/campaigns/templates/${template.id}`)}
                    title="View"
                  >
                    <Eye size={16} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => navigate(`/campaigns/templates/${template.id}/edit`)}
                    title="Edit"
                  >
                    <Edit size={16} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDuplicate(template.id)}
                    title="Duplicate"
                  >
                    <Copy size={16} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDelete(template.id, template.name)}
                    title="Delete"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </div>
  );
}