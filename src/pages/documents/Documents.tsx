import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Upload,
  Image,
  Video,
  Music,
  FileText,
  Archive,
  Download,
  Trash2,
  X,
  Loader,
  FolderOpen,
  Calendar,
  User,
  Filter,
} from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { attachmentsApi } from '../../api/attachments';
import { contactsApi } from '../../api/contacts';
import type { ContactAttachment } from '../../types/attachment';
import type { Contact } from '../../types/contact';
import { useToast } from '../../hooks/useToast';
import { formatDate, formatFileSize } from '../../utils/formatters';

type FileTypeFilter = 'all' | 'image' | 'video' | 'audio' | 'document' | 'other';

export function Documents() {
  const toast = useToast();
  const [attachments, setAttachments] = useState<ContactAttachment[]>([]);
  const [filteredAttachments, setFilteredAttachments] = useState<ContactAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState<FileTypeFilter>('all');
  const [selectedAttachment, setSelectedAttachment] = useState<ContactAttachment | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = useState<ContactAttachment | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadContactId, setUploadContactId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Load contacts once
  useEffect(() => {
    const loadContacts = async () => {
      try {
        const contactsRes = await contactsApi.getContacts({ limit: 100 });
        setContacts(contactsRes.data.data || []);
      } catch (error) {
        console.error('Failed to fetch contacts:', error);
      }
    };
    loadContacts();
  }, []);

  // Load attachments - ONLY when upload/delete happens or contacts change
  const loadAttachments = async () => {
    if (contacts.length === 0) return;
    
    setLoading(true);
    try {
      let allAttachments: ContactAttachment[] = [];
      
      for (const contact of contacts) {
        try {
          const attachmentsRes = await attachmentsApi.getAttachments(contact.id);
          if (attachmentsRes.success && attachmentsRes.data.attachments) {
            const attachmentsWithContact = attachmentsRes.data.attachments.map(att => ({
              ...att,
              file_size_formatted: formatFileSize(att.file_size),
              contact_name: `${contact.first_name} ${contact.last_name}`,
              contact_company: contact.company
            }));
            allAttachments = [...allAttachments, ...attachmentsWithContact];
          }
        } catch (error) {
          console.error(`Failed to fetch attachments for contact ${contact.id}:`, error);
        }
      }
      
      setAttachments(allAttachments);
      setFilteredAttachments(allAttachments);
      setHasLoaded(true);
    } catch (error) {
      console.error('Failed to fetch attachments:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  // Load attachments when contacts are loaded (only once)
  useEffect(() => {
    if (contacts.length > 0 && !hasLoaded) {
      loadAttachments();
    }
  }, [contacts, hasLoaded]);

  // Filter attachments (no API calls)
  useEffect(() => {
    let filtered = [...attachments];
    
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(att =>
        att.original_name.toLowerCase().includes(searchLower) ||
        att.description?.toLowerCase().includes(searchLower) ||
        (att as any).contact_name?.toLowerCase().includes(searchLower) ||
        (att as any).contact_company?.toLowerCase().includes(searchLower)
      );
    }
    
    if (fileTypeFilter !== 'all') {
      filtered = filtered.filter(att => att.file_type === fileTypeFilter);
    }
    
    setFilteredAttachments(filtered);
  }, [search, fileTypeFilter, attachments]);

  const handleDelete = async () => {
    if (!attachmentToDelete) return;
    
    setDeleting(true);
    try {
      await attachmentsApi.deleteAttachment(attachmentToDelete.contact_id, attachmentToDelete.id);
      toast.success('Document deleted successfully');
      setShowDeleteModal(false);
      setAttachmentToDelete(null);
      // Reload attachments after delete
      setHasLoaded(false);
      loadAttachments();
    } catch (error) {
      console.error('Failed to delete attachment:', error);
      toast.error('Failed to delete document');
    } finally {
      setDeleting(false);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      toast.error('Please select a file');
      return;
    }
    if (!uploadContactId) {
      toast.error('Please select a contact');
      return;
    }
    
    setUploading(true);
    try {
      await attachmentsApi.uploadAttachment(uploadContactId, uploadFile, uploadDescription || undefined);
      toast.success('Document uploaded successfully');
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadDescription('');
      setUploadContactId(null);
      // Reload attachments after upload
      setHasLoaded(false);
      loadAttachments();
    } catch (error) {
      console.error('Failed to upload document:', error);
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (fileType: string, mimeType: string) => {
    const iconClass = "w-10 h-10 p-2 rounded-xl";
    if (fileType === 'image') return <div className={`${iconClass} bg-blue-100 text-blue-600`}><Image size={24} /></div>;
    if (fileType === 'video') return <div className={`${iconClass} bg-purple-100 text-purple-600`}><Video size={24} /></div>;
    if (fileType === 'audio') return <div className={`${iconClass} bg-green-100 text-green-600`}><Music size={24} /></div>;
    if (mimeType?.includes('pdf')) return <div className={`${iconClass} bg-red-100 text-red-600`}><FileText size={24} /></div>;
    if (mimeType?.includes('word')) return <div className={`${iconClass} bg-blue-100 text-blue-600`}><FileText size={24} /></div>;
    if (mimeType?.includes('excel') || mimeType?.includes('sheet')) return <div className={`${iconClass} bg-green-100 text-green-600`}><FileText size={24} /></div>;
    if (mimeType?.includes('zip') || mimeType?.includes('rar')) return <div className={`${iconClass} bg-yellow-100 text-yellow-600`}><Archive size={24} /></div>;
    return <div className={`${iconClass} bg-gray-100 text-gray-600`}><FileText size={24} /></div>;
  };

  const getFileBadge = (fileType: string) => {
    const variants: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
      image: 'primary',
      video: 'info',
      audio: 'success',
      document: 'warning',
    };
    return variants[fileType] || 'default';
  };

  const fileTypeOptions: { value: FileTypeFilter; label: string; icon: React.ReactNode }[] = [
    { value: 'all', label: 'All', icon: <FolderOpen size={14} /> },
    { value: 'image', label: 'Images', icon: <Image size={14} /> },
    { value: 'video', label: 'Videos', icon: <Video size={14} /> },
    { value: 'audio', label: 'Audio', icon: <Music size={14} /> },
    { value: 'document', label: 'Documents', icon: <FileText size={14} /> },
    { value: 'other', label: 'Other', icon: <Archive size={14} /> },
  ];

  const stats = {
    total: attachments.length,
    images: attachments.filter(a => a.file_type === 'image').length,
    videos: attachments.filter(a => a.file_type === 'video').length,
    audio: attachments.filter(a => a.file_type === 'audio').length,
    documents: attachments.filter(a => a.file_type === 'document').length,
    totalSize: attachments.reduce((sum, a) => sum + (a.file_size || 0), 0),
  };

  if (loading && !hasLoaded) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-deep-ink">Documents</h1>
          <p className="text-gray-600 mt-1">Manage all your files and attachments</p>
        </div>
        <Button onClick={() => setShowUploadModal(true)}>
          <Upload size={18} className="mr-2" />
          Upload Document
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <GlassCard className="p-4 text-center">
          <p className="text-2xl font-bold text-primary">{stats.total}</p>
          <p className="text-xs text-gray-500">Total Files</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <div className="flex justify-center mb-1"><Image size={20} className="text-blue-500" /></div>
          <p className="text-xl font-bold text-deep-ink">{stats.images}</p>
          <p className="text-xs text-gray-500">Images</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <div className="flex justify-center mb-1"><Video size={20} className="text-purple-500" /></div>
          <p className="text-xl font-bold text-deep-ink">{stats.videos}</p>
          <p className="text-xs text-gray-500">Videos</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <div className="flex justify-center mb-1"><Music size={20} className="text-green-500" /></div>
          <p className="text-xl font-bold text-deep-ink">{stats.audio}</p>
          <p className="text-xs text-gray-500">Audio</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <div className="flex justify-center mb-1"><FileText size={20} className="text-orange-500" /></div>
          <p className="text-xl font-bold text-deep-ink">{stats.documents}</p>
          <p className="text-xs text-gray-500">Documents</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <p className="text-xl font-bold text-deep-ink">{formatFileSize(stats.totalSize)}</p>
          <p className="text-xs text-gray-500">Total Size</p>
        </GlassCard>
      </div>

      {/* Filters */}
      <GlassCard className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by filename, contact, company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search size={18} />}
            />
          </div>
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 md:pb-0">
            <Filter size={18} className="text-gray-400 mr-1" />
            {fileTypeOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setFileTypeFilter(option.value)}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
                  fileTypeFilter === option.value
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {option.icon}
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Documents Grid */}
      {filteredAttachments.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <FolderOpen size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">No documents found</p>
          <p className="text-sm text-gray-400 mt-1">Upload your first document to get started</p>
          <Button variant="outline" className="mt-4" onClick={() => setShowUploadModal(true)}>
            <Upload size={16} className="mr-2" />
            Upload Document
          </Button>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAttachments.map((attachment, index) => (
            <motion.div
              key={attachment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.03, 0.5) }}
              onClick={() => setSelectedAttachment(attachment)}
              className="cursor-pointer"
            >
              <GlassCard className="p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-start space-x-3">
                  {getFileIcon(attachment.file_type, attachment.mime_type)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-deep-ink truncate" title={attachment.original_name}>
                      {attachment.original_name}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <Badge variant={getFileBadge(attachment.file_type)} size="sm">
                        {attachment.file_type}
                      </Badge>
                      <span className="text-xs text-gray-500">{attachment.file_size_formatted}</span>
                    </div>
                    <div className="flex items-center space-x-2 mt-2 text-xs text-gray-400">
                      <User size={12} />
                      <span className="truncate">
                        {(attachment as any).contact_name || `Contact #${attachment.contact_id}`}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 mt-1 text-xs text-gray-400">
                      <Calendar size={12} />
                      <span>{formatDate(attachment.created_at)}</span>
                    </div>
                    {attachment.description && (
                      <p className="text-xs text-gray-500 mt-2 line-clamp-2">{attachment.description}</p>
                    )}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}

      {/* View/Download Modal - same as before */}
      <Modal isOpen={!!selectedAttachment} onClose={() => setSelectedAttachment(null)} maxWidth="md">
        {selectedAttachment && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-deep-ink truncate">{selectedAttachment.original_name}</h2>
              <button onClick={() => setSelectedAttachment(null)}>
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="mb-4">
              {selectedAttachment.file_type === 'image' ? (
                <img
                  src={selectedAttachment.file_path}
                  alt={selectedAttachment.original_name}
                  className="w-full rounded-lg object-contain max-h-96 bg-gray-100"
                />
              ) : selectedAttachment.file_type === 'video' ? (
                <video src={selectedAttachment.file_path} controls className="w-full rounded-lg max-h-96 bg-gray-100" />
              ) : selectedAttachment.file_type === 'audio' ? (
                <audio src={selectedAttachment.file_path} controls className="w-full rounded-lg" />
              ) : (
                <div className="flex flex-col items-center justify-center p-12 bg-gray-100 rounded-lg">
                  {getFileIcon(selectedAttachment.file_type, selectedAttachment.mime_type)}
                  <p className="text-sm text-gray-500 mt-3">Preview not available</p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-deep-ink">File Information</p>
                  <p className="text-xs text-gray-500">Type: {selectedAttachment.file_type}</p>
                  <p className="text-xs text-gray-500">Size: {selectedAttachment.file_size_formatted}</p>
                  <p className="text-xs text-gray-500">Uploaded: {formatDate(selectedAttachment.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-deep-ink">Contact</p>
                  <p className="text-xs text-gray-500">
                    {(selectedAttachment as any).contact_name || `Contact #${selectedAttachment.contact_id}`}
                  </p>
                </div>
              </div>

              {selectedAttachment.description && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-deep-ink">Description</p>
                  <p className="text-sm text-gray-600">{selectedAttachment.description}</p>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <a href={selectedAttachment.file_path} download target="_blank" rel="noopener noreferrer">
                  <Button variant="outline">
                    <Download size={16} className="mr-2" />
                    Download
                  </Button>
                </a>
                <Button
                  variant="danger"
                  onClick={() => {
                    setSelectedAttachment(null);
                    setAttachmentToDelete(selectedAttachment);
                    setShowDeleteModal(true);
                  }}
                >
                  <Trash2 size={16} className="mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} maxWidth="sm">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-deep-ink">Delete Document</h2>
            <button onClick={() => setShowDeleteModal(false)}>
              <X size={20} className="text-gray-500" />
            </button>
          </div>
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete "{attachmentToDelete?.original_name}"? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader size={16} className="mr-2 animate-spin" /> : <Trash2 size={16} className="mr-2" />}
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Upload Modal */}
      <Modal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} maxWidth="lg">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-deep-ink">Upload Document</h2>
            <button onClick={() => setShowUploadModal(false)}>
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Contact</label>
              <select
                value={uploadContactId || ''}
                onChange={(e) => setUploadContactId(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white/70 border border-blue-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select a contact...</option>
                {contacts.map(contact => (
                  <option key={contact.id} value={contact.id}>
                    {contact.first_name} {contact.last_name} {contact.company && `(${contact.company})`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select File</label>
              <input
                type="file"
                accept="image/*,video/*,audio/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/zip,application/x-rar-compressed"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-gray-500 file:mr-2 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-dark"
              />
              <p className="text-xs text-gray-500 mt-1">
                Max size: 25MB for videos, 5MB for other files
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description (optional)</label>
              <textarea
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-white/70 border border-blue-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                placeholder="Add a description for this document..."
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="outline" onClick={() => setShowUploadModal(false)}>Cancel</Button>
              <Button onClick={handleUpload} disabled={uploading || !uploadFile || !uploadContactId}>
                {uploading ? <Loader size={16} className="mr-2 animate-spin" /> : <Upload size={16} className="mr-2" />}
                Upload
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}