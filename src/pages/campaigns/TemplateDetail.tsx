import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Copy, Trash2, Mail, Send } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { emailTemplatesApi } from '../../api/emailTemplates';
import type { EmailTemplate } from '../../types/emailTemplate';
import { formatDate } from '../../utils/formatters';
import { useToast } from '../../hooks/useToast';

export default function TemplateDetail() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [template, setTemplate] = useState<EmailTemplate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (templateId) fetchTemplate();
  }, [templateId]);

  const fetchTemplate = async () => {
    try {
      const response = await emailTemplatesApi.getTemplateById(Number(templateId));
      setTemplate(response.data.template);
    } catch (error) {
      toast.error('Failed to load template');
      navigate('/campaigns/templates');
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async () => {
    try {
      const response = await emailTemplatesApi.duplicateTemplate(Number(templateId));
      navigate(`/campaigns/templates/${response.data.template.id}`);
      toast.success('Template duplicated');
    } catch (error) {
      toast.error('Failed to duplicate');
    }
  };

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete "${template?.name}"?`)) {
      try {
        await emailTemplatesApi.deleteTemplate(Number(templateId));
        toast.success('Template deleted');
        navigate('/campaigns/templates');
      } catch (error) {
        toast.error('Failed to delete template');
      }
    }
  };

  const handleUseInCampaign = () => {
    navigate('/campaigns/new', { state: { templateId: template?.id } });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!template) return null;

  const renderPreview = () => {
    let previewContent = template.body;
    if (template.variables) {
      template.variables.forEach(variable => {
        const demoValue = variable === 'first_name' ? 'John' :
                         variable === 'last_name' ? 'Doe' :
                         variable === 'email' ? 'john@example.com' :
                         variable === 'company' ? 'Acme Inc' :
                         `[${variable}]`;
        previewContent = previewContent.replace(
          new RegExp(`{{${variable}}}`, 'g'),
          `<span class="bg-yellow-100 px-1 rounded">${demoValue}</span>`
        );
      });
    }
    return previewContent;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/campaigns/templates')}>
            <ArrowLeft size={18} className="mr-2" /> Back to Templates
          </Button>
          <h1 className="text-3xl font-bold text-deep-ink">{template.name}</h1>
          <Badge variant="default">Template</Badge>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleUseInCampaign}>
            <Send size={16} className="mr-2" /> Use in Campaign
          </Button>
          <Button variant="outline" onClick={() => navigate(`/campaigns/templates/${templateId}/edit`)}>
            <Edit size={16} className="mr-2" /> Edit
          </Button>
          <Button variant="outline" onClick={handleDuplicate}>
            <Copy size={16} className="mr-2" /> Duplicate
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            <Trash2 size={16} className="mr-2" /> Delete
          </Button>
        </div>
      </div>

      <GlassCard className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Subject Line</h3>
            <p className="text-lg font-semibold text-deep-ink mt-1">{template.subject}</p>
          </div>

          {template.variables && template.variables.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Variables</h3>
              <div className="flex flex-wrap gap-2 mt-2">
                {template.variables.map(variable => (
                  <span key={variable} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm">
                    {"{{"}{variable}{"}}"}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3">Email Preview</h3>
            <div className="border rounded-lg p-6 bg-white">
              <div dangerouslySetInnerHTML={{ __html: renderPreview() }} />
            </div>
          </div>

          <div className="pt-4 border-t flex justify-between text-sm text-gray-500">
            <span>Created: {formatDate(template.created_at)}</span>
            <span>Last Updated: {formatDate(template.updated_at)}</span>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}