import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Eye, Search, ChevronDown, ChevronRight, X, Variable } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { RichTextEditor } from '../../components/editor/RichTextEditor';
import { emailTemplatesApi } from '../../api/emailTemplates';
import { useToast } from '../../hooks/useToast';
import type { EmailTemplate, CreateTemplateData } from '../../types/emailTemplate';

interface TemplateFormProps {
  initialData?: EmailTemplate;
  isEditing?: boolean;
}

// Complete predefined variables with demo values
const VALID_VARIABLES = {
  contact: [
    { name: 'first_name', description: 'Recipient first name', demoValue: 'John' },
    { name: 'last_name', description: 'Recipient last name', demoValue: 'Doe' },
    { name: 'full_name', description: 'Recipient full name', demoValue: 'John Doe' },
    { name: 'email', description: 'Recipient email address', demoValue: 'john.doe@example.com' },
    { name: 'phone', description: 'Recipient phone number', demoValue: '+1 (555) 123-4567' },
    { name: 'company', description: 'Recipient company name', demoValue: 'Acme Corporation' },
    { name: 'job_title', description: 'Recipient job title', demoValue: 'Marketing Director' },
    { name: 'city', description: 'Recipient city', demoValue: 'New York' },
    { name: 'state', description: 'Recipient state', demoValue: 'NY' },
    { name: 'country', description: 'Recipient country', demoValue: 'USA' },
    { name: 'postal_code', description: 'Recipient postal code', demoValue: '10001' },
  ],
  campaign: [
    { name: 'campaign_name', description: 'Campaign name', demoValue: 'Summer Sale 2024' },
    { name: 'campaign_description', description: 'Campaign description', demoValue: 'Exclusive summer discounts' },
    { name: 'sent_date', description: 'Date email was sent', demoValue: new Date().toLocaleDateString() },
    { name: 'open_rate', description: 'Campaign open rate', demoValue: '45%' },
    { name: 'click_rate', description: 'Campaign click rate', demoValue: '12%' },
  ],
  company: [
    { name: 'company_name', description: 'Your company name', demoValue: 'DERA CRM' },
    { name: 'company_email', description: 'Company support email', demoValue: 'support@deracrm.com' },
    { name: 'company_phone', description: 'Company phone number', demoValue: '+1 (555) 000-0000' },
    { name: 'company_website', description: 'Company website URL', demoValue: 'https://deracrm.com' },
    { name: 'company_address', description: 'Company address', demoValue: '123 Business Ave, Suite 100' },
    { name: 'company_city', description: 'Company city', demoValue: 'San Francisco' },
    { name: 'company_state', description: 'Company state', demoValue: 'CA' },
    { name: 'company_country', description: 'Company country', demoValue: 'USA' },
  ],
  links: [
    { name: 'unsubscribe_link', description: 'Unsubscribe URL', demoValue: 'https://deracrm.com/unsubscribe' },
    { name: 'preferences_link', description: 'Email preferences URL', demoValue: 'https://deracrm.com/preferences' },
    { name: 'view_online_link', description: 'View in browser link', demoValue: 'https://deracrm.com/email/view' },
    { name: 'tracking_pixel', description: 'Open tracking pixel', demoValue: '[Tracking Pixel]' },
  ],
  system: [
    { name: 'current_year', description: 'Current year', demoValue: new Date().getFullYear().toString() },
    { name: 'current_month', description: 'Current month', demoValue: new Date().toLocaleString('default', { month: 'long' }) },
    { name: 'current_date', description: 'Current date', demoValue: new Date().toLocaleDateString() },
    { name: 'support_email', description: 'Support email', demoValue: 'help@deracrm.com' },
    { name: 'support_phone', description: 'Support phone', demoValue: '+1 (555) 999-9999' },
  ]
};

type CategoryKey = keyof typeof VALID_VARIABLES;

interface CategoryConfig {
  key: CategoryKey;
  label: string;
  description: string;
  icon: string;
}

const categories: CategoryConfig[] = [
  { key: 'contact', label: 'Contact Information', description: 'Personalize emails with recipient details', icon: 'Contact' },
  { key: 'campaign', label: 'Campaign Details', description: 'Campaign-specific information', icon: 'Campaign' },
  { key: 'company', label: 'Company Information', description: 'Your business information', icon: 'Company' },
  { key: 'links', label: 'System Links', description: 'Dynamic links and tracking', icon: 'Links' },
  { key: 'system', label: 'System Variables', description: 'System-wide information', icon: 'System' },
];

// Function to get demo value for a variable
const getDemoValue = (variableName: string): string => {
  for (const category of Object.values(VALID_VARIABLES)) {
    const variable = category.find(v => v.name === variableName);
    if (variable) {
      return variable.demoValue;
    }
  }
  return `[${variableName}]`;
};

// Function to extract variables from HTML content while preserving formatting
const extractVariablesFromHTML = (html: string): string[] => {
  if (!html) return [];
  
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  const plainText = tempDiv.textContent || tempDiv.innerText || '';
  
  const variableRegex = /{{(.*?)}}/g;
  const matches = [...plainText.matchAll(variableRegex)];
  return [...new Set(matches.map(m => m[1].trim()))];
};

// Function to replace variables in HTML content while preserving formatting
const replaceVariablesInHTML = (html: string, replacer: (variable: string) => string): string => {
  if (!html) return '';
  
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  const processNode = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      const variableRegex = /{{(.*?)}}/g;
      let match;
      let lastIndex = 0;
      const fragments: Node[] = [];
      
      while ((match = variableRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
          fragments.push(document.createTextNode(text.substring(lastIndex, match.index)));
        }
        
        const variableName = match[1].trim();
        const replacement = replacer(variableName);
        const span = document.createElement('span');
        span.className = 'inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded font-mono text-sm border border-blue-200';
        span.setAttribute('title', `Variable: ${variableName}`);
        span.innerHTML = replacement;
        fragments.push(span);
        
        lastIndex = match.index + match[0].length;
      }
      
      if (lastIndex < text.length) {
        fragments.push(document.createTextNode(text.substring(lastIndex)));
      }
      
      if (fragments.length > 0) {
        const parent = node.parentNode;
        if (parent) {
          fragments.forEach(fragment => {
            parent.insertBefore(fragment, node);
          });
          parent.removeChild(node);
        }
      }
    } else if (node.nodeType === Node.ELEMENT_NODE && 
               !['SCRIPT', 'STYLE', 'CODE', 'PRE'].includes(node.nodeName)) {
      const children = Array.from(node.childNodes);
      children.forEach(child => processNode(child));
    }
  };
  
  processNode(tempDiv);
  return tempDiv.innerHTML;
};

// Variable Modal Component
function VariableModal({ isOpen, onClose, onInsertVariable }: { 
  isOpen: boolean; 
  onClose: () => void; 
  onInsertVariable: (variableName: string) => void;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<CategoryKey[]>(['contact', 'campaign', 'company', 'links', 'system']);

  const toggleCategory = (categoryKey: CategoryKey) => {
    setExpandedCategories(prev => 
      prev.includes(categoryKey) 
        ? prev.filter(c => c !== categoryKey)
        : [...prev, categoryKey]
    );
  };

  const getFilteredVariables = () => {
    if (!searchTerm) return null;
    
    const searchLower = searchTerm.toLowerCase();
    const results: Array<{ category: string; variable: { name: string; description: string; demoValue: string } }> = [];
    
    Object.entries(VALID_VARIABLES).forEach(([category, variables]) => {
      variables.forEach(variable => {
        if (variable.name.includes(searchLower) || variable.description.toLowerCase().includes(searchLower)) {
          results.push({ category, variable });
        }
      });
    });
    
    return results;
  };

  const filteredResults = getFilteredVariables();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col z-10">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Variable size={20} className="text-blue-600" />
            <h2 className="text-xl font-semibold text-deep-ink">Insert Variable</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 border-b">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search variables..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {searchTerm && filteredResults ? (
            <div>
              <p className="text-sm text-gray-500 mb-3">Search Results ({filteredResults.length})</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {filteredResults.map(({ category, variable }) => (
                  <button
                    key={variable.name}
                    onClick={() => {
                      onInsertVariable(variable.name);
                      onClose();
                    }}
                    className="text-left p-3 border rounded-lg hover:bg-blue-50 transition-colors group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <code className="text-sm font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        {"{{"}{variable.name}{"}}"}
                      </code>
                      <span className="text-xs text-gray-400 capitalize">{category}</span>
                    </div>
                    <p className="text-xs text-gray-600">{variable.description}</p>
                    <p className="text-xs text-gray-400 mt-1">Example: {variable.demoValue}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {categories.map(category => {
                const variables = VALID_VARIABLES[category.key];
                const isExpanded = expandedCategories.includes(category.key);
                
                return (
                  <div key={category.key} className="border rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleCategory(category.key)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-600 w-16">{category.icon}</span>
                        <div className="text-left">
                          <h3 className="font-semibold text-deep-ink">{category.label}</h3>
                          <p className="text-xs text-gray-500">{category.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">({variables.length})</span>
                        {isExpanded ? (
                          <ChevronDown size={18} className="text-gray-500" />
                        ) : (
                          <ChevronRight size={18} className="text-gray-500" />
                        )}
                      </div>
                    </button>
                    
                    {isExpanded && (
                      <div className="divide-y divide-gray-100">
                        {variables.map(variable => (
                          <button
                            key={variable.name}
                            onClick={() => {
                              onInsertVariable(variable.name);
                              onClose();
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors group"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <code className="text-sm font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded group-hover:bg-blue-100">
                                  {"{{"}{variable.name}{"}}"}
                                </code>
                                <p className="text-sm text-gray-600 mt-1">{variable.description}</p>
                                <p className="text-xs text-gray-400 mt-1">Example: {variable.demoValue}</p>
                              </div>
                              <div className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                Click to insert →
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t bg-gray-50">
          <p className="text-xs text-gray-600">
            Tip: Click any variable to insert it at your cursor position. Variables will be replaced with actual values when sending emails.
          </p>
        </div>
      </div>
    </div>
  );
}

export function TemplateForm({ initialData, isEditing }: TemplateFormProps) {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showVariableModal, setShowVariableModal] = useState(false);
  
  const [formData, setFormData] = useState<CreateTemplateData>({
    name: initialData?.name || '',
    subject: initialData?.subject || '',
    body: initialData?.body || '',
    variables: initialData?.variables || [],
  });

  const handleInsertVariable = (variableName: string) => {
    // Dispatch custom event for the rich text editor to handle
    const event = new CustomEvent('insertVariable', { 
      detail: `{{${variableName}}}` 
    });
    window.dispatchEvent(event);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.subject || !formData.body) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    
    try {
      const bodyVariables = extractVariablesFromHTML(formData.body);
      const subjectVariables = extractVariablesFromHTML(formData.subject);
      const allVariables = [...new Set([...bodyVariables, ...subjectVariables])];
      
      const dataToSave = {
        ...formData,
        variables: allVariables,
      };
      
      if (isEditing && initialData) {
        await emailTemplatesApi.updateTemplate(initialData.id, dataToSave);
        toast.success('Template updated successfully');
      } else {
        await emailTemplatesApi.createTemplate(dataToSave);
        toast.success('Template created successfully');
      }
      navigate('/campaigns/templates');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  const renderPreview = () => {
    if (!formData.body) return '';
    
    const previewContent = replaceVariablesInHTML(formData.body, (variableName) => {
      return getDemoValue(variableName);
    });
    
    return previewContent;
  };

  const renderSubjectPreview = () => {
    if (!formData.subject) return '';
    
    const plainSubject = formData.subject;
    const variableRegex = /{{(.*?)}}/g;
    let previewSubject = plainSubject;
    const matches = [...plainSubject.matchAll(variableRegex)];
    const variablesFound = [...new Set(matches.map(m => m[1].trim()))];
    
    variablesFound.forEach(variable => {
      const demoValue = getDemoValue(variable);
      previewSubject = previewSubject.replace(
        new RegExp(`{{${variable}}}`, 'g'),
        `<span class="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded font-mono text-sm">${demoValue}</span>`
      );
    });
    
    return previewSubject;
  };

  return (
    <div className="space-y-6">
      <VariableModal 
        isOpen={showVariableModal}
        onClose={() => setShowVariableModal(false)}
        onInsertVariable={handleInsertVariable}
      />
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/campaigns/templates')}>
            <ArrowLeft size={18} className="mr-2" /> Back
          </Button>
          <h1 className="text-3xl font-bold text-deep-ink">
            {isEditing ? 'Edit Template' : 'Create Template'}
          </h1>
        </div>
        <div className="flex space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye size={16} className="mr-2" />
            {showPreview ? 'Edit Mode' : 'Preview'}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold text-deep-ink mb-4">Template Details</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Template Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Welcome Email, Newsletter, Promotional"
                  className="mt-1"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="subject">Email Subject *</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g., Welcome to {{company_name}}!"
                  className="mt-1 font-mono"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use {"{{variable}}"} for personalization. Variables will be replaced with actual values when sending.
                </p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-deep-ink">Email Content</h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowVariableModal(true)}
              >
                <Variable size={16} className="mr-2" />
                Insert Variable
              </Button>
            </div>
            
            {showPreview ? (
              <div className="space-y-4">
                <div className="border rounded-lg p-4 bg-gray-50">
                  <p className="text-sm font-medium text-gray-700 mb-2">Subject Preview:</p>
                  <div 
                    className="text-base font-semibold"
                    dangerouslySetInnerHTML={{ __html: renderSubjectPreview() }}
                  />
                </div>
                <div className="border rounded-lg p-6 bg-white min-h-100 prose max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: renderPreview() }} />
                </div>
                <div className="text-xs text-gray-400 text-center border-t pt-3">
                  <span className="inline-flex items-center gap-1">Variables are shown with demo values for preview only</span>
                </div>
              </div>
            ) : (
              <div>
                <RichTextEditor
                  content={formData.body}
                  onChange={(content) => setFormData({ ...formData, body: content })}
                  placeholder="Design your email content here... Use {{variable_name}} for personalization"
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-500">
                    Tip: Click the "Insert Variable" button to add variables, or type {"{{"} to see suggestions
                  </p>
                  <p className="text-xs text-gray-500">
                    You can format variables with bold, italic, colors, etc.
                  </p>
                </div>
              </div>
            )}
          </GlassCard>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/campaigns/templates')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              <Save size={18} className="mr-2" />
              {loading ? 'Saving...' : (isEditing ? 'Update Template' : 'Create Template')}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}