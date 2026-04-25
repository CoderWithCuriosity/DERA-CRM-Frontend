import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import {
  Bold, Italic, Strikethrough, List, ListOrdered,
  Link2, Image as ImageIcon, Undo, Redo, AlignLeft,
  AlignCenter, AlignRight, Highlighter,
  Type, Palette
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useState, useEffect, useCallback, useRef } from 'react';

// Custom extension for font size
const FontSize = TextStyle.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      fontSize: {
        default: null,
        parseHTML: element => element.style.fontSize || null,
        renderHTML: attributes => {
          if (!attributes.fontSize) {
            return {};
          }
          return {
            style: `font-size: ${attributes.fontSize}`,
          };
        },
      },
    };
  },
});

// Complete list of variables for suggestions
// Complete list of variables for suggestions
const SUGGESTION_VARIABLES = [
  // Contact Information
  { name: 'first_name', label: 'First Name', category: 'Contact' },
  { name: 'last_name', label: 'Last Name', category: 'Contact' },
  { name: 'full_name', label: 'Full Name', category: 'Contact' },
  { name: 'email', label: 'Email Address', category: 'Contact' },
  { name: 'phone', label: 'Phone Number', category: 'Contact' },
  { name: 'contact_company', label: 'Contact\'s Company', category: 'Contact' },
  { name: 'contact_job_title', label: 'Contact\'s Job Title', category: 'Contact' },
  { name: 'contact_status', label: 'Contact Status', category: 'Contact' },
  { name: 'city', label: 'City', category: 'Contact' },
  { name: 'state', label: 'State', category: 'Contact' },
  { name: 'country', label: 'Country', category: 'Contact' },
  { name: 'postal_code', label: 'Postal Code', category: 'Contact' },
  { name: 'name', label: 'Fallback Name', category: 'Contact' },
  
  // Campaign Information
  { name: 'campaign_name', label: 'Campaign Name', category: 'Campaign' },
  { name: 'campaign_id', label: 'Campaign ID', category: 'Campaign' },
  { name: 'sent_date', label: 'Sent Date', category: 'Campaign' },
  { name: 'sent_time', label: 'Sent Time', category: 'Campaign' },
  
  // Sender Company Information (Your Company)
  { name: 'company_name', label: 'Your Company Name', category: 'Your Company' },
  { name: 'company_email', label: 'Your Company Email', category: 'Your Company' },
  { name: 'company_phone', label: 'Your Company Phone', category: 'Your Company' },
  { name: 'company_website', label: 'Your Company Website', category: 'Your Company' },
  { name: 'company_address', label: 'Your Company Address', category: 'Your Company' },
  { name: 'agency_name', label: 'Agency Name', category: 'Your Company' },
  { name: 'agency_email', label: 'Agency Email', category: 'Your Company' },
  { name: 'agency_phone', label: 'Agency Phone', category: 'Your Company' },
  
  // Agent Information
  { name: 'agent_name', label: 'Agent Name', category: 'Agent' },
  { name: 'agent_email', label: 'Agent Email', category: 'Agent' },
  
  // System Links
  { name: 'unsubscribe_link', label: 'Unsubscribe Link', category: 'Links' },
  { name: 'tracking_pixel', label: 'Tracking Pixel', category: 'Links' },
  
  // System Variables
  { name: 'current_year', label: 'Current Year', category: 'System' },
  { name: 'current_date', label: 'Current Date', category: 'System' },
  { name: 'current_time', label: 'Current Time', category: 'System' },
];

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

// Suggestion Popup Component
function SuggestionPopup({ 
  onSelect, 
  position, 
  searchTerm,
  onClose
}: { 
  onSelect: (variable: string) => void; 
  position: { top: number; left: number };
  searchTerm: string;
  onClose: () => void;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const popupRef = useRef<HTMLDivElement>(null);
  
  const filteredVariables = SUGGESTION_VARIABLES.filter(v => 
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.label.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 10);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filteredVariables.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && filteredVariables[selectedIndex]) {
        e.preventDefault();
        onSelect(filteredVariables[selectedIndex].name);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredVariables, selectedIndex, onSelect, onClose]);
  
  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);
  
  if (filteredVariables.length === 0) return null;
  
  return (
    <div 
      ref={popupRef}
      className="fixed z-50 bg-white border rounded-lg shadow-lg overflow-hidden"
      style={{ top: position.top, left: position.left, minWidth: '280px' }}
    >
      <div className="px-3 py-2 bg-gray-50 border-b text-xs font-semibold text-gray-600">
        Insert Variable
      </div>
      <div className="max-h-64 overflow-y-auto">
        {filteredVariables.map((variable, index) => (
          <button
            key={variable.name}
            onClick={() => onSelect(variable.name)}
            className={`w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors ${
              index === selectedIndex ? 'bg-blue-50' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <code className="text-sm font-mono text-blue-600">
                {"{{"}{variable.name}{"}}"}
              </code>
              <span className="text-xs text-gray-400">{variable.category}</span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{variable.label}</p>
          </button>
        ))}
      </div>
      <div className="px-3 py-2 bg-gray-50 border-t text-xs text-gray-500">
        Use ↑ ↓ to navigate, Enter to insert, Esc to close
      </div>
    </div>
  );
}

export function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFontPicker, setShowFontPicker] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionPosition, setSuggestionPosition] = useState({ top: 0, left: 0 });
  const [suggestionSearchTerm, setSuggestionSearchTerm] = useState('');
  const [currentCursorPos, setCurrentCursorPos] = useState({ from: 0, to: 0 });
  const [isDeleting, setIsDeleting] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'max-w-full h-auto',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline hover:text-blue-800',
        },
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Write your email content here...',
      }),
      Color,
      TextStyle,
      FontSize,
      FontFamily,
      Highlight.configure({
        multicolor: true,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph', 'div'],
        alignments: ['left', 'center', 'right', 'justify'],
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[400px] p-4 w-full',
        style: 'min-height: 400px;',
      },
    },
  });

  // Handle variable suggestions on keyup
useEffect(() => {
  if (!editor) return;
  
  const editorElement = document.querySelector('.ProseMirror');
  if (!editorElement) return;
  
  const handleKeyUp = (event: Event) => {
    const keyboardEvent = event as KeyboardEvent;
    
    // Don't show suggestions on backspace/delete
    if (keyboardEvent.key === 'Backspace' || keyboardEvent.key === 'Delete') {
      setIsDeleting(true);
      setTimeout(() => setIsDeleting(false), 100);
      setShowSuggestions(false);
      return;
    }
    
    if (isDeleting) return;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const node = range.startContainer;
    
    if (node.nodeType === Node.TEXT_NODE && node.textContent) {
      const cursorPos = range.startOffset;
      const textBefore = node.textContent.substring(0, cursorPos);
      
      // Check if last two characters are {{
      if (textBefore.endsWith('{{')) {
        // Get the position of the cursor
        const rect = range.getBoundingClientRect();
        
        setCurrentCursorPos({ 
          from: cursorPos - 2, 
          to: cursorPos 
        });
        
        setSuggestionPosition({
          top: rect.bottom + window.scrollY + 5,
          left: rect.left + window.scrollX
        });
        
        setSuggestionSearchTerm('');
        setShowSuggestions(true);
      } else {
        // If suggestions are open and typing continues, filter them
        if (showSuggestions) {
          // Check if there's an opening {{
          const lastOpenBraces = textBefore.lastIndexOf('{{');
          if (lastOpenBraces !== -1) {
            const searchText = textBefore.substring(lastOpenBraces + 2);
            setSuggestionSearchTerm(searchText);
            
            // Update position
            const rect = range.getBoundingClientRect();
            setSuggestionPosition({
              top: rect.bottom + window.scrollY + 5,
              left: rect.left + window.scrollX
            });
          } else {
            setShowSuggestions(false);
          }
        }
      }
    }
  };
  
  editorElement.addEventListener('keyup', handleKeyUp);
  return () => editorElement.removeEventListener('keyup', handleKeyUp);
}, [editor, showSuggestions, isDeleting]);

  const handleInsertVariable = useCallback((variableName: string) => {
    if (editor) {
      const { state } = editor;
      const { from, to } = currentCursorPos;
      
      // Delete the {{ and insert the variable
      const transaction = state.tr;
      transaction.delete(from, to);
      transaction.insertText(`{{${variableName}}}`, from);
      editor.view.dispatch(transaction);
      editor.commands.focus();
      
      // Hide suggestions
      setShowSuggestions(false);
      setSuggestionSearchTerm('');
    }
  }, [editor, currentCursorPos]);

  // Listen for insertVariable event from modal
  useEffect(() => {
    const handleInsertVariableEvent = (event: CustomEvent) => {
      if (editor && event.detail) {
        editor.commands.insertContent(event.detail);
        editor.commands.focus();
      }
    };

    window.addEventListener('insertVariable', handleInsertVariableEvent as EventListener);

    return () => {
      window.removeEventListener('insertVariable', handleInsertVariableEvent as EventListener);
    };
  }, [editor]);

  const addImage = () => {
    const url = window.prompt('Enter image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const addLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const setFontSize = (size: string) => {
    editor.chain().focus().setMark('textStyle', { fontSize: size }).run();
  };

  const colors = [
    '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
    '#FF00FF', '#00FFFF', '#808080', '#800000', '#808000',
    '#008000', '#800080', '#008080', '#000080', '#FFA500',
    '#FFC0CB', '#A52A2A', '#D2691E', '#4B0082', '#2F4F4F'
  ];

  const fontSizes = [
    '10px', '12px', '14px', '16px', '18px', '20px', '24px', 
    '28px', '32px', '36px', '42px', '48px', '54px', '60px', '72px'
  ];
  
  const fontFamilies = [
    'Arial, sans-serif', 
    'Helvetica, sans-serif', 
    'Times New Roman, serif', 
    'Georgia, serif', 
    'Courier New, monospace',
    'Verdana, sans-serif', 
    'Tahoma, sans-serif', 
    'Trebuchet MS, sans-serif', 
    'Impact, sans-serif',
    'Comic Sans MS, cursive',
    'Roboto, sans-serif',
    'Open Sans, sans-serif'
  ];

  return (
    <>
      {showSuggestions && (
        <SuggestionPopup
          onSelect={handleInsertVariable}
          position={suggestionPosition}
          searchTerm={suggestionSearchTerm}
          onClose={() => setShowSuggestions(false)}
        />
      )}
      
      <div className="border rounded-lg overflow-hidden bg-white w-full">
        {/* Toolbar */}
        <div className="border-b bg-gray-50 p-2 flex flex-wrap gap-1 sticky top-0 z-10">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'bg-gray-200' : ''}
            title="Bold (Ctrl+B)"
          >
            <Bold size={16} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'bg-gray-200' : ''}
            title="Italic (Ctrl+I)"
          >
            <Italic size={16} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={editor.isActive('strike') ? 'bg-gray-200' : ''}
            title="Strikethrough"
          >
            <Strikethrough size={16} />
          </Button>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive('bulletList') ? 'bg-gray-200' : ''}
            title="Bullet List"
          >
            <List size={16} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editor.isActive('orderedList') ? 'bg-gray-200' : ''}
            title="Numbered List"
          >
            <ListOrdered size={16} />
          </Button>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={editor.isActive({ textAlign: 'left' }) ? 'bg-gray-200' : ''}
            title="Align Left"
          >
            <AlignLeft size={16} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={editor.isActive({ textAlign: 'center' }) ? 'bg-gray-200' : ''}
            title="Align Center"
          >
            <AlignCenter size={16} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={editor.isActive({ textAlign: 'right' }) ? 'bg-gray-200' : ''}
            title="Align Right"
          >
            <AlignRight size={16} />
          </Button>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addLink}
            title="Insert Link (Ctrl+K)"
          >
            <Link2 size={16} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addImage}
            title="Insert Image"
          >
            <ImageIcon size={16} />
          </Button>

          <div className="relative">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowColorPicker(!showColorPicker)}
              title="Text Color"
            >
              <Palette size={16} />
            </Button>
            {showColorPicker && (
              <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-lg p-2 z-20 w-64">
                <div className="grid grid-cols-5 gap-1 mb-2">
                  {colors.map(color => (
                    <button
                      key={color}
                      type="button"
                      className="w-8 h-8 rounded border hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        editor.chain().focus().setColor(color).run();
                        setShowColorPicker(false);
                      }}
                      title={color}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  className="text-sm text-gray-600 hover:text-gray-900 w-full text-left px-2 py-1 rounded hover:bg-gray-100"
                  onClick={() => {
                    editor.chain().focus().unsetColor().run();
                    setShowColorPicker(false);
                  }}
                >
                  Remove color
                </button>
              </div>
            )}
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            className={editor.isActive('highlight') ? 'bg-yellow-100' : ''}
            title="Highlight"
          >
            <Highlighter size={16} />
          </Button>

          <div className="relative">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowFontPicker(!showFontPicker)}
              title="Font Settings"
            >
              <Type size={16} />
            </Button>
            {showFontPicker && (
              <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-lg p-3 z-20 w-64">
                <div className="mb-3">
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Font Family</label>
                  <select
                    className="w-full p-2 border rounded text-sm bg-white"
                    onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
                    value={editor.getAttributes('textStyle').fontFamily || ''}
                  >
                    <option value="">Default</option>
                    {fontFamilies.map(font => (
                      <option key={font} value={font} style={{ fontFamily: font }}>
                        {font.split(',')[0]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Font Size</label>
                  <select
                    className="w-full p-2 border rounded text-sm bg-white"
                    onChange={(e) => setFontSize(e.target.value)}
                    value={editor.getAttributes('textStyle').fontSize || ''}
                  >
                    <option value="">Default</option>
                    {fontSizes.map(size => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mt-2 pt-2 border-t">
                  <button
                    type="button"
                    className="text-sm text-gray-600 hover:text-gray-900 w-full text-left px-2 py-1 rounded hover:bg-gray-100"
                    onClick={() => {
                      editor.chain().focus().unsetMark('textStyle').run();
                      setShowFontPicker(false);
                    }}
                  >
                    Remove formatting
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo (Ctrl+Z)"
          >
            <Undo size={16} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo (Ctrl+Y)"
          >
            <Redo size={16} />
          </Button>
        </div>

        {/* Editor Content */}
        <div className="w-full overflow-auto">
          <EditorContent 
            editor={editor} 
            className="rich-text-editor-content w-full"
          />
        </div>

        <style>{`
          .rich-text-editor-content .ProseMirror {
            min-height: 400px;
            padding: 1rem;
            width: 100%;
            outline: none;
          }
          
          .rich-text-editor-content .ProseMirror p {
            margin: 0 0 1rem 0;
          }
          
          .rich-text-editor-content .ProseMirror h1 {
            font-size: 2em;
            font-weight: bold;
            margin: 0.67em 0;
          }
          
          .rich-text-editor-content .ProseMirror h2 {
            font-size: 1.5em;
            font-weight: bold;
            margin: 0.83em 0;
          }
          
          .rich-text-editor-content .ProseMirror h3 {
            font-size: 1.17em;
            font-weight: bold;
            margin: 1em 0;
          }
          
          .rich-text-editor-content .ProseMirror ul, 
          .rich-text-editor-content .ProseMirror ol {
            padding-left: 1.5rem;
            margin: 0 0 1rem 0;
          }
          
          .rich-text-editor-content .ProseMirror li {
            margin: 0.25rem 0;
          }
          
          .rich-text-editor-content .ProseMirror img {
            max-width: 100%;
            height: auto;
            margin: 0.5rem 0;
          }
          
          .rich-text-editor-content .ProseMirror a {
            color: #2563eb;
            text-decoration: underline;
            cursor: pointer;
          }
          
          .rich-text-editor-content .ProseMirror a:hover {
            color: #1d4ed8;
          }
          
          .rich-text-editor-content .ProseMirror blockquote {
            border-left: 3px solid #e5e7eb;
            padding-left: 1rem;
            margin: 1rem 0;
            color: #6b7280;
          }
        `}</style>
      </div>
    </>
  );
}