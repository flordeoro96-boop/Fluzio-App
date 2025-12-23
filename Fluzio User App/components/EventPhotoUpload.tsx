/**
 * EventPhotoUpload Component
 * 
 * Handles photo uploads for events with preview, drag-and-drop, and validation.
 */

import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { uploadMessageFile } from '../services/fileUploadService';
import { useAuth } from '../services/AuthContext';

interface EventPhotoUploadProps {
  onUpload: (urls: string[]) => void;
  onCoverPhotoChange?: (url: string) => void;
  maxPhotos?: number;
  existingPhotos?: string[];
  existingCoverPhoto?: string;
  eventId?: string;
}

export const EventPhotoUpload: React.FC<EventPhotoUploadProps> = ({
  onUpload,
  onCoverPhotoChange,
  maxPhotos = 5,
  existingPhotos = [],
  existingCoverPhoto,
  eventId = 'temp-event'
}) => {
  const { user: currentUser } = useAuth();
  const [photos, setPhotos] = useState<string[]>(existingPhotos);
  const [coverPhoto, setCoverPhoto] = useState<string | null>(existingCoverPhoto || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const remainingSlots = maxPhotos - photos.length;
    if (remainingSlots <= 0) {
      setError(`Maximum ${maxPhotos} photos allowed`);
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const filesToUpload = Array.from(files).slice(0, remainingSlots);
      const uploadPromises = filesToUpload.map(async (file) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name} is not an image file`);
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`${file.name} is too large. Max 5MB per image.`);
        }

        // Upload to Firebase Storage with proper parameters
        const userId = currentUser?.uid || 'anonymous';
        const result = await uploadMessageFile(file, eventId, userId);
        return result.url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      const newPhotos = [...photos, ...uploadedUrls];
      
      setPhotos(newPhotos);
      onUpload(newPhotos);

      // Set first photo as cover if no cover exists
      if (!coverPhoto && uploadedUrls.length > 0) {
        setCoverPhoto(uploadedUrls[0]);
        onCoverPhotoChange?.(uploadedUrls[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload photos');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    const removedPhoto = photos[index];
    
    setPhotos(newPhotos);
    onUpload(newPhotos);

    // If removed photo was cover, set new cover
    if (coverPhoto === removedPhoto) {
      const newCover = newPhotos[0] || null;
      setCoverPhoto(newCover);
      if (newCover) onCoverPhotoChange?.(newCover);
    }
  };

  const setCover = (url: string) => {
    setCoverPhoto(url);
    onCoverPhotoChange?.(url);
  };

  return (
    <div className="event-photo-upload">
      {/* Upload Area */}
      <div
        className={`upload-dropzone border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${photos.length >= maxPhotos ? 'opacity-50 pointer-events-none' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />

        {uploading ? (
          <div className="py-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
            <p className="text-gray-600">Uploading photos...</p>
          </div>
        ) : (
          <>
            <Upload className="mx-auto text-gray-400 mb-3" size={40} />
            <p className="text-gray-700 font-medium mb-1">
              Drop photos here or click to upload
            </p>
            <p className="text-sm text-gray-500 mb-3">
              Max {maxPhotos} photos, 5MB each
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Choose Files
            </button>
            <p className="text-xs text-gray-500 mt-2">
              {photos.length}/{maxPhotos} photos uploaded
            </p>
          </>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Photo Gallery */}
      {photos.length > 0 && (
        <div className="photo-gallery mt-4">
          <h4 className="font-medium text-gray-900 mb-3">
            Event Photos ({photos.length})
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {photos.map((photo, index) => (
              <div
                key={index}
                className="relative group aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-colors"
              >
                <img
                  src={photo}
                  alt={`Event photo ${index + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* Cover Photo Badge */}
                {coverPhoto === photo && (
                  <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded">
                    Cover Photo
                  </div>
                )}

                {/* Actions Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center gap-2">
                  {coverPhoto !== photo && (
                    <button
                      type="button"
                      onClick={() => setCover(photo)}
                      className="bg-white text-gray-900 px-3 py-1 rounded text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Set as Cover
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-start gap-2">
          <ImageIcon className="text-blue-600 flex-shrink-0 mt-0.5" size={18} />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Photo Tips:</p>
            <ul className="text-xs space-y-1 text-blue-800">
              <li>• First photo will be the cover (or choose one)</li>
              <li>• Use high-quality images for better engagement</li>
              <li>• Show the event location, activities, or atmosphere</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
