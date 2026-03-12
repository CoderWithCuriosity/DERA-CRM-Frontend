import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Copy } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { campaignsApi } from '../../api/campaigns';
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
      const response = await campaignsApi.getTemplates();
      setTemplates(response.data.templates);
    } catch (error) {
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async (id: number) => {
    try {
      const response = await campaignsApi.duplicateTemplate(id);
      setTemplates(prev => [...prev, response.data.template]);
      toast.success('Template duplicated');
    } catch (error) {
      toast.error('Failed to duplicate');
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
          <div className="col-span-full flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
        ) : templates.map(template => (
          <GlassCard key={template.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-deep-ink">{template.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{template.subject}</p>
                <p className="text-xs text-gray-500 mt-2">
                  Variables: {template.variables.join(', ')}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Updated {formatDate(template.updated_at)}
                </p>
              </div>
              <div className="flex space-x-1">
                <Button variant="ghost" size="sm" onClick={() => navigate(`/campaigns/templates/${template.id}`)}>
                  <Eye size={16} />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDuplicate(template.id)}>
                  <Copy size={16} />
                </Button>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}