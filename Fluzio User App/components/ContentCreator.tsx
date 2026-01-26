/**
 * Content Creator Component - Standard React Version
 * Native content creation - replaces Instagram posting
 * Uses standard file inputs for maximum compatibility
 */

import React, { useState, useRef } from 'react';
import { X, Camera, Image as ImageIcon, MapPin, Tag, Send, Loader2, DollarSign } from 'lucide-react';
import { ContentType, UserRole, FeedMedia, MediaType } from '../types';
import { createFeedPost } from '../services/feedService';
import { uploadFeedMedia } from '../services/fileUploadService';
import { Button, Select, TextArea, Input } from './Common';
import './ContentCreator.css';

interface ContentCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userRole: UserRole;
  userName: string;
  userAvatar: string;
  userLocation?: {
    name: string;
    city?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  };
  onPostCreated?: () => void;
}

export const ContentCreator: React.FC<ContentCreatorProps> = ({
  isOpen,
  onClose,
  userId,
  userRole,
  userName,
  userAvatar,
  userLocation,
  onPostCreated
}) => {
  const [contentType, setContentType] = useState<ContentType>(ContentType.EXPERIENCE_POST);
  const [caption, setCaption] = useState('');
  const [media, setMedia] = useState<FeedMedia[]>([]);
  const [locationName, setLocationName] = useState(userLocation?.name || '');
  const [businessTag, setBusinessTag] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [collaborationBudget, setCollaborationBudget] = useState<number>();
  const [collaborationCompensation, setCollaborationCompensation] = useState<'PAID' | 'POINTS' | 'PRODUCT' | 'EXPERIENCE'>('PAID');
  const [collaborationSpots, setCollaborationSpots] = useState<number>();
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const getContentTypeOptions = () => {
    const baseOptions = [
      { value: ContentType.EXPERIENCE_POST, label: 'Experience' },
      { value: ContentType.MOMENT, label: 'Moment' }
    ];

    if (userRole === 'CREATOR') {
      baseOptions.push({ value: ContentType.CREATOR_CONTENT, label: 'Creator Content' });
    }

    if (userRole === 'BUSINESS') {
      baseOptions.push(
        { value: ContentType.BUSINESS_ANNOUNCEMENT, label: 'Announcement' },
        { value: ContentType.COLLABORATION_CALL, label: 'Collaboration Call' }
      );
    }

    return baseOptions;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newMedia: FeedMedia[] = [];
    
    for (let i = 0; i < Math.min(files.length, 5); i++) {
      const file = files[i];
      const reader = new FileReader();
      
      await new Promise((resolve) => {
        reader.onload = (e) => {
          const mediaItem: FeedMedia = {
            id: Date.now().toString() + i,
            type: file.type.startsWith('video/') ? MediaType.VIDEO : MediaType.IMAGE,
            url: e.target?.result as string,
            thumbnailUrl: e.target?.result as string,
            order: media.length + i
          };
          newMedia.push(mediaItem);
          resolve(null);
        };
        reader.readAsDataURL(file);
      });
    }

    setMedia([...media, ...newMedia]);
  };

  const handleCameraCapture = () => {
    // Use native camera input for mobile compatibility
    cameraInputRef.current?.click();
  };

  const handleCameraPhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const mediaItem: FeedMedia = {
        id: Date.now().toString(),
        type: MediaType.IMAGE,
        url: e.target?.result as string,
        thumbnailUrl: e.target?.result as string,
        order: media.length
      };
      setMedia([...media, mediaItem]);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveMedia = (id: string) => {
    setMedia(media.filter(m => m.id !== id));
  };

  const handleAddTag = () => {
    if (currentTag.trim() && tags.length < 5) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handlePost = async () => {
    if (!caption.trim() || media.length === 0) {
      alert('Please add a caption and at least one photo or video');
      return;
    }

    try {
      setIsUploading(true);

      // Upload media files
      const uploadedMedia: FeedMedia[] = [];
      for (const mediaItem of media) {
        if (mediaItem.url.startsWith('data:')) {
          // Convert data URL to blob
          const response = await fetch(mediaItem.url);
          const blob = await response.blob();
          const file = new File([blob], `media-${Date.now()}.${blob.type.split('/')[1]}`, { type: blob.type });
          
          const uploadedUrl = await uploadFeedMedia(file, userId);
          uploadedMedia.push({
            ...mediaItem,
            url: uploadedUrl,
            thumbnailUrl: uploadedUrl
          });
        } else {
          uploadedMedia.push(mediaItem);
        }
      }

      // Create post
      await createFeedPost({
        contentType,
        createdBy: userId,
        creatorName: userName,
        creatorAvatar: userAvatar,
        media: uploadedMedia,
        caption: caption.trim(),
        tags,
        location: userLocation ? {
          name: locationName || userLocation.name,
          city: userLocation.city,
          country: userLocation.country,
          coordinates: userLocation.latitude && userLocation.longitude ? {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude
          } : undefined
        } : undefined,
        businessTag: businessTag.trim() || undefined,
        collaborationDetails: contentType === ContentType.COLLABORATION_CALL ? {
          budget: collaborationBudget,
          compensationType: collaborationCompensation,
          spotsAvailable: collaborationSpots || 1,
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
        } : undefined,
        status: 'PUBLISHED',
        moderationStatus: 'APPROVED', // Auto-approve for now, can add moderation later
        viewCount: 0,
        saveCount: 0,
        shareCount: 0,
        applicationCount: 0
      });

      // Reset form
      setCaption('');
      setMedia([]);
      setTags([]);
      setBusinessTag('');
      setCollaborationBudget(undefined);
      setCollaborationSpots(undefined);
      
      onPostCreated?.();
      onClose();
    } catch (error) {
      console.error('[ContentCreator] Error creating post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={24} />
          </button>
          <h2 className="modal-title">Create Post</h2>
          <Button
            onClick={handlePost}
            disabled={isUploading || !caption.trim() || media.length === 0}
            size="sm"
            variant="gradient"
            isLoading={isUploading}
          >
            <Send size={16} />
            Post
          </Button>
        </div>

        {/* Content */}
        <div className="modal-body">
          {/* Content Type */}
          <Select
            label="Content Type"
            value={contentType}
            onChange={(e) => setContentType(e.target.value as ContentType)}
          >
            {getContentTypeOptions().map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          {/* Media */}
          <div className="media-section">
            <label className="input-label">Media (Max 5)</label>
            <div className="media-buttons">
              {/* Hidden file inputs */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleCameraPhoto}
                style={{ display: 'none' }}
              />
              
              {/* Instagram-style buttons */}
              <button
                className="media-btn camera-btn"
                onClick={handleCameraCapture}
                disabled={media.length >= 5}
                type="button"
              >
                <Camera size={20} />
                Camera
              </button>
              <button
                className="media-btn upload-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={media.length >= 5}
                type="button"
              >
                <ImageIcon size={20} />
                Upload
              </button>
            </div>

            {media.length > 0 && (
              <div className="media-preview-grid">
                {media.map((item) => (
                  <div key={item.id} className="media-preview-item">
                    {item.type === MediaType.IMAGE ? (
                      <img src={item.url} alt="Preview" />
                    ) : (
                      <video src={item.url} />
                    )}
                    <button
                      className="media-remove-btn"
                      onClick={() => handleRemoveMedia(item.id)}
                      aria-label="Remove"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Caption */}
          <TextArea
            label="Caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Share your story..."
            rows={4}
            maxLength={2000}
          />
          <div className="char-count">{caption.length}/2000</div>

          {/* Location */}
          <Input
            label="Location"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            placeholder="Where is this?"
          />

          {/* Business Tag (for Creators) */}
          {userRole === 'CREATOR' && (
            <Input
              label="Tag Business (Optional)"
              value={businessTag}
              onChange={(e) => setBusinessTag(e.target.value)}
              placeholder="@businessname"
            />
          )}

          {/* Tags */}
          <div className="tags-section">
            <label className="input-label">Tags (Max 5)</label>
            <div className="tag-input-container">
              <input
                type="text"
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                placeholder="Add tag..."
                className="tag-input"
                maxLength={20}
                disabled={tags.length >= 5}
              />
              <button
                onClick={handleAddTag}
                disabled={!currentTag.trim() || tags.length >= 5}
                className="tag-add-btn"
              >
                Add
              </button>
            </div>
            {tags.length > 0 && (
              <div className="tags-list">
                {tags.map((tag, index) => (
                  <span key={index} className="tag-chip">
                    #{tag}
                    <button onClick={() => handleRemoveTag(index)} aria-label="Remove tag">
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Collaboration Details (for Businesses) */}
          {contentType === ContentType.COLLABORATION_CALL && (
            <div className="collaboration-section">
              <h3 className="section-title">Collaboration Details</h3>
              
              <Input
                label="Budget (Optional)"
                type="number"
                value={collaborationBudget || ''}
                onChange={(e) => setCollaborationBudget(Number(e.target.value))}
                placeholder="Enter amount"
              />

              <Select
                label="Compensation Type"
                value={collaborationCompensation}
                onChange={(e) => setCollaborationCompensation(e.target.value as any)}
              >
                <option value="PAID">Paid</option>
                <option value="POINTS">Points</option>
                <option value="PRODUCT">Product</option>
                <option value="EXPERIENCE">Experience</option>
              </Select>

              <Input
                label="Spots Available"
                type="number"
                value={collaborationSpots || ''}
                onChange={(e) => setCollaborationSpots(Number(e.target.value))}
                placeholder="Number of creators needed"
                min={1}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
