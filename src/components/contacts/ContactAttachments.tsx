import React, { useState, useEffect } from 'react';
import { Paperclip, X, Download, Trash2, Image, Video, Music, FileText, Archive, Upload, Loader } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { attachmentsApi } from '../../api/attachments';
import type { ContactAttachment } from '../../types/attachment';
import { useToast } from '../../hooks/useToast';
import { formatDate, formatFileSize } from '../../utils/formatters';

interface ContactAttachmentsProps {
  contactId: number;
  contactName: string;
}

export default function ContactAttachments({ contactId, contactName }: ContactAttachmentsProps) {
  const [attachments, setAttachments] = useState<ContactAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [description, setDescription] = useState('');
  const toast = useToast();

  void contactName;

  const fetchAttachments = async () => {
    try {
      setLoading(true);
      const response = await attachmentsApi.getAttachments(contactId);
      if (response.success) {
        // Add formatted file size
        const attachmentsWithSize = response.data.attachments.map(att => ({
          ...att,
          file_size_formatted: formatFileSize(att.file_size)
        }));
        setAttachments(attachmentsWithSize);
      }
    } catch (error) {
      console.error('Failed to fetch attachments:', error);
      toast.error('Failed to load attachments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttachments();
  }, [contactId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (25MB max for videos, 5MB for others)
    const isVideo = file.type.startsWith('video/');
    const maxSize = isVideo ? 25 * 1024 * 1024 : 5 * 1024 * 1024;
    
    if (file.size > maxSize) {
      toast.error(`File too large. Maximum size: ${isVideo ? '25MB' : '5MB'}`);
      return;
    }

    setUploading(true);
    try {
      await attachmentsApi.uploadAttachment(contactId, file, description || undefined);
      toast.success('Attachment uploaded successfully');
      setDescription('');
      setShowUpload(false);
      fetchAttachments();
    } catch (error) {
      console.error('Failed to upload attachment:', error);
      toast.error('Failed to upload attachment');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (attachmentId: number, filename: string) => {
    if (!confirm(`Are you sure you want to delete "${filename}"?`)) return;
    
    try {
      await attachmentsApi.deleteAttachment(contactId, attachmentId);
      toast.success('Attachment deleted successfully');
      fetchAttachments();
    } catch (error) {
      console.error('Failed to delete attachment:', error);
      toast.error('Failed to delete attachment');
    }
  };

  const getFileIcon = (fileType: string, mimeType: string) => {
    if (fileType === 'image') return <Image size={20} className="text-blue-500" />;
    if (fileType === 'video') return <Video size={20} className="text-purple-500" />;
    if (fileType === 'audio') return <Music size={20} className="text-green-500" />;
    if (mimeType?.includes('pdf')) return <FileText size={20} className="text-red-500" />;
    if (mimeType?.includes('word')) return <FileText size={20} className="text-blue-500" />;
    if (mimeType?.includes('excel') || mimeType?.includes('sheet')) return <FileText size={20} className="text-green-500" />;
    if (mimeType?.includes('zip') || mimeType?.includes('rar') || mimeType?.includes('7z')) return <Archive size={20} className="text-yellow-600" />;
    return <Paperclip size={20} className="text-gray-500" />;
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

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Paperclip size={18} className="text-primary" />
          <h3 className="font-medium text-deep-ink">Attachments</h3>
          <Badge variant="default" size="sm">{attachments.length}</Badge>
        </div>
        <Button size="sm" onClick={() => setShowUpload(!showUpload)}>
          <Upload size={14} className="mr-2" />
          Upload
        </Button>
      </div>

      {/* Upload Form */}
      {showUpload && (
        <GlassCard className="p-4" intensity="light">
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-white/70 border border-blue-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
            <div className="flex items-center space-x-3">
              <input
                type="file"
                accept="image/*,video/*,audio/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/zip,application/x-rar-compressed"
                onChange={handleFileUpload}
                className="flex-1 text-sm text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-dark"
                disabled={uploading}
              />
              <Button variant="ghost" size="sm" onClick={() => setShowUpload(false)}>
                <X size={14} />
              </Button>
            </div>
            {uploading && (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Loader size={14} className="animate-spin" />
                <span>Uploading...</span>
              </div>
            )}
          </div>
        </GlassCard>
      )}

      {/* Attachments List */}
      {attachments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Paperclip size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">No attachments yet</p>
          <p className="text-xs">Upload files, images, or documents</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {attachments.map((attachment) => (
            <GlassCard key={attachment.id} className="p-3" intensity="light">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1 min-w-0">
                  <div className="shrink-0 mt-0.5">
                    {getFileIcon(attachment.file_type, attachment.mime_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate" title={attachment.original_name}>
                      {attachment.original_name}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <Badge variant={getFileBadge(attachment.file_type)} size="sm">
                        {attachment.file_type}
                      </Badge>
                      <span className="text-xs text-gray-500">{attachment.file_size_formatted}</span>
                      <span className="text-xs text-gray-400">{formatDate(attachment.created_at)}</span>
                    </div>
                    {attachment.description && (
                      <p className="text-xs text-gray-500 mt-1 truncate">{attachment.description}</p>
                    )}
                    {attachment.uploader && (
                      <p className="text-xs text-gray-400 mt-1">
                        Uploaded by {attachment.uploader.first_name} {attachment.uploader.last_name}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-1 ml-2">
                  <a
                    href={attachment.file_path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors"
                    title="Download"
                  >
                    <Download size={14} className="text-gray-500" />
                  </a>
                  <button
                    onClick={() => handleDelete(attachment.id, attachment.original_name)}
                    className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={14} className="text-red-500" />
                  </button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}