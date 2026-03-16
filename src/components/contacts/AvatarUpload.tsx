import React, { useState, useRef, useEffect } from 'react';
import { Camera, Loader, Trash2 } from 'lucide-react';
import { contactsApi } from '../../api/contacts';

interface AvatarUploadProps {
  contactId: number;
  currentAvatar: string | null;
  contactName: string;
  onAvatarUpdate: (avatarUrl: string | null) => void;
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  contactId,
  currentAvatar,
  contactName,
  onAvatarUpdate,
}) => {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset image error when avatar changes
  useEffect(() => {
    setImageError(false);
  }, [currentAvatar]);

  const initials = contactName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG, GIF, WEBP)');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('File size must be less than 2MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
      setImageError(false); // Reset error state for new preview
    };
    reader.readAsDataURL(file);

    setError(null);
    setUploading(true);

    try {
      const response = await contactsApi.uploadAvatar(contactId, file);
      onAvatarUpdate(response.data.avatar);
      setPreviewUrl(null);
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      setError('Failed to upload avatar');
      setPreviewUrl(null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this avatar?')) return;

    setDeleting(true);
    setError(null);
    
    try {
      await contactsApi.deleteAvatar(contactId);
      onAvatarUpdate(null);
      setImageError(false); // Reset error state
    } catch (error) {
      console.error('Failed to delete avatar:', error);
      setError('Failed to delete avatar');
    } finally {
      setDeleting(false);
    }
  };

  const handleImageError = () => {
    setImageError(true);
    // Optional: You could log this to your error tracking service
    console.error(`Avatar failed to load for contact ${contactId}: ${currentAvatar}`);
  };

  // Determine if we should show the image
  const shouldShowImage = (previewUrl || currentAvatar) && !imageError;

  return (
    <div className="flex flex-col items-center space-y-3">
      <div className="relative group">
        {/* Avatar Display */}
        <div className="w-24 h-24 rounded-full overflow-hidden bg-linear-to-br from-primary to-accent flex items-center justify-center">
          {shouldShowImage ? (
            <img
              src={previewUrl || currentAvatar || ''}
              alt={contactName}
              className="w-full h-full object-cover"
              onError={handleImageError}
            />
          ) : (
            <span className="text-white text-2xl font-bold">{initials}</span>
          )}
        </div>

        {/* Upload Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFileSelect}
            className="hidden"
            id="avatar-upload"
            disabled={uploading || deleting}
          />
          <label
            htmlFor="avatar-upload"
            className="cursor-pointer p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
          >
            <Camera size={18} className="text-gray-700" />
          </label>
        </div>

        {/* Loading Spinner */}
        {(uploading || deleting) && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
            <Loader size={24} className="text-white animate-spin" />
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* Actions */}
      {currentAvatar && !uploading && !deleting && !imageError && (
        <button
          onClick={handleDelete}
          className="text-sm text-red-600 hover:text-red-700 flex items-center"
        >
          <Trash2 size={14} className="mr-1" />
          Remove
        </button>
      )}

      {/* Show retry message if image failed to load */}
      {imageError && currentAvatar && !uploading && !deleting && (
        <div className="text-sm text-amber-600 flex items-center">
          <span>Failed to load image</span>
          <button
            onClick={() => setImageError(false)}
            className="ml-2 text-primary hover:text-primary-dark underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Upload Hint */}
      <p className="text-xs text-gray-500">
        Click on the avatar to upload (max 2MB)
      </p>
    </div>
  );
};