import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TemplateForm } from './TemplateForm';
import { emailTemplatesApi } from '../../api/emailTemplates';
import { useToast } from '../../hooks/useToast';
import type { EmailTemplate } from '../../types/emailTemplate';

export default function EditTemplate() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [template, setTemplate] = useState<EmailTemplate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTemplate = async () => {
      if (!templateId) {
        toast.error('Template ID is required');
        navigate('/campaigns/templates');
        return;
      }

      try {
        const response = await emailTemplatesApi.getTemplateById(parseInt(templateId));
        setTemplate(response.data.template);
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to load template');
        navigate('/campaigns/templates');
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [templateId, navigate, toast]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!template) {
    return null;
  }

  return <TemplateForm initialData={template} isEditing={true} />;
}