/**
 * Content Creator - Redesigned for Calm, Intentional Creation
 * Multi-step flow: Media → Story → Context → Review → Publish
 */

import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Image as ImageIcon, MapPin, ChevronLeft, Loader2, GripVertical, Sparkles } from 'lucide-react';
import { ContentType, UserRole, FeedMedia, MediaType } from '../types';
import { createFeedPost, updateFeedPost, getFeedPostById } from '../services/feedService';
import { uploadFeedMedia } from '../services/fileUploadService';
import { generateCaption } from '../services/openaiService';
import './ContentCreatorNew.css';

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
  initialContentType?: ContentType;
  editPostId?: string | null;
}

type Step = 'media' | 'story' | 'context' | 'review';
type ContextType = 'discoverable' | 'collaborators' | 'community';

const contentTypeLabels: Record<ContentType, string> = {
  [ContentType.EXPERIENCE_POST]: 'Experience',
  [ContentType.MOMENT]: 'Moment',
  [ContentType.COLLABORATION_CALL]: 'Collaboration',
  [ContentType.EVENT_PREVIEW]: 'Event',
  [ContentType.CREATOR_CONTENT]: 'Creator Content',
  [ContentType.BUSINESS_ANNOUNCEMENT]: 'Announcement'
};

export const ContentCreator: React.FC<ContentCreatorProps> = ({
  isOpen,
  onClose,
  userId,
  userRole,
  userName,
  userAvatar,
  userLocation,
  onPostCreated,
  initialContentType = ContentType.EXPERIENCE_POST,
  editPostId = null
}) => {
  const [step, setStep] = useState<Step>('media');
  const [contentType] = useState<ContentType>(initialContentType);
  const [media, setMedia] = useState<FeedMedia[]>([]);
  const [caption, setCaption] = useState('');
  const [contextType, setContextType] = useState<ContextType>('discoverable');
  const [location, setLocation] = useState(userLocation?.name || '');
  const [suggestedTags] = useState<string[]>(['Coffee', 'Design', 'Weekend', 'Pop-up', 'Community', 'Art']);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingPost, setIsLoadingPost] = useState(false);
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);

  // Load existing post data when editing
  useEffect(() => {
    if (editPostId && isOpen) {
      setIsLoadingPost(true);
      getFeedPostById(editPostId)
        .then(post => {
          if (post) {
            setMedia(post.media || []);
            setCaption(post.caption || '');
            setSelectedTags(post.tags || []);
            setLocation(post.location?.name || '');
            setStep('story'); // Skip to story step since media is already uploaded
          }
        })
        .catch(error => {
          console.error('Error loading post:', error);
          alert('Failed to load post data');
        })
        .finally(() => setIsLoadingPost(false));
    }
  }, [editPostId, isOpen]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleGenerateCaption = async () => {
    setIsGeneratingCaption(true);
    try {
      const result = await generateCaption({
        contentType: contentType,
        topic: caption || undefined,
        businessName: userName,
        tone: 'casual',
        includeEmojis: true,
        includeHashtags: true
      });
      
      // Set caption (with hashtags appended)
      const fullCaption = `${result.caption}\n\n${result.hashtags.map(tag => `#${tag}`).join(' ')}`;
      setCaption(fullCaption);
      
      // Add hashtags to tags
      const newTags = [...new Set([...selectedTags, ...result.hashtags])];
      setSelectedTags(newTags);
      
      console.log('[ContentCreator] AI Caption generated:', result);
    } catch (error) {
      console.error('[ContentCreator] Failed to generate caption:', error);
      alert('Failed to generate caption. Please try again.');
    } finally {
      setIsGeneratingCaption(false);
    }
  };

  const handleCameraCapture = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  const handleFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleCameraPhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newMedia: FeedMedia[] = [];
    
    for (let i = 0; i < Math.min(files.length, 5 - media.length); i++) {
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

  const handleRemoveMedia = (id: string) => {
    setMedia(media.filter(m => m.id !== id));
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else if (selectedTags.length < 5) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const canProceedToNext = () => {
    if (step === 'media') return media.length > 0;
    if (step === 'story') return caption.trim().length > 0;
    if (step === 'context') return true;
    if (step === 'review') return true; // Always allow publishing from review
    return false;
  };

  const handleNext = () => {
    if (step === 'media') setStep('story');
    else if (step === 'story') setStep('context');
    else if (step === 'context') setStep('review');
  };

  const handleBack = () => {
    if (step === 'story') setStep('media');
    else if (step === 'context') setStep('story');
    else if (step === 'review') setStep('context');
  };

  const handlePublish = async () => {
    setIsUploading(true);

    try {
      // Upload media files
      const uploadedMedia: FeedMedia[] = [];
      for (const mediaItem of media) {
        if (mediaItem.url.startsWith('data:')) {
          // Convert data URL to blob without fetch (CSP compliant)
          const base64Response = mediaItem.url.split(',')[1];
          const mimeType = mediaItem.url.match(/data:([^;]+);/)?.[1] || 'image/jpeg';
          const byteCharacters = atob(base64Response);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: mimeType });
          const file = new File([blob], `media-${Date.now()}.${mimeType.split('/')[1]}`, { type: mimeType });
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

      // Create or update post
      if (editPostId) {
        // Update existing post
        await updateFeedPost(editPostId, {
          caption,
          media: uploadedMedia,
          tags: selectedTags,
          location: location ? {
            name: location,
            ...(userLocation?.city && { city: userLocation.city }),
            ...(userLocation?.country && { country: userLocation.country }),
            ...(userLocation?.latitude && userLocation?.longitude && {
              coordinates: {
                latitude: userLocation.latitude,
                longitude: userLocation.longitude
              }
            })
          } : undefined
        });
      } else {
        // Create new post
        await createFeedPost({
          contentType,
          caption,
          media: uploadedMedia,
          tags: selectedTags,
          location: location ? {
            name: location,
            ...(userLocation?.city && { city: userLocation.city }),
            ...(userLocation?.country && { country: userLocation.country }),
            ...(userLocation?.latitude && userLocation?.longitude && {
              coordinates: {
                latitude: userLocation.latitude,
                longitude: userLocation.longitude
              }
            })
          } : undefined,
          createdBy: userId,
          creatorName: userName,
          creatorAvatar: userAvatar,
          creatorRole: userRole,
          status: 'PUBLISHED',
          moderationStatus: 'APPROVED'
        });
      }

      onPostCreated?.();
      onClose();
      
      // Reset form
      setStep('media');
      setMedia([]);
      setCaption('');
      setSelectedTags([]);
      setLocation(userLocation?.name || '');
      
    } catch (error) {
      console.error('Failed to create post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const getContextExplanation = () => {
    if (contextType === 'discoverable') {
      return 'This will appear in the Discover feed for people nearby.';
    } else if (contextType === 'community') {
      return 'This will be visible to your followers and community.';
    } else {
      return 'This will only be visible to invited collaborators.';
    }
  };

  return (
    <div className="creator-overlay">
      <div className="creator-container">
        {/* Header */}
        <div className="creator-header">
          <button className="creator-back-btn" onClick={step === 'media' ? onClose : handleBack}>
            {step === 'media' ? <X size={24} /> : <ChevronLeft size={24} />}
          </button>
          <h2 className="creator-title">Create {contentTypeLabels[contentType]}</h2>
          <button 
            className="creator-next-btn"
            onClick={step === 'review' ? handlePublish : handleNext}
            disabled={!canProceedToNext() || isUploading}
          >
            {isUploading ? (
              <Loader2 size={20} className="spinner" />
            ) : step === 'review' ? (
              'Publish'
            ) : (
              'Next'
            )}
          </button>
        </div>

        {/* Content based on step */}
        <div className="creator-content">
          {step === 'media' && (
            <div className="creator-step">
              <div className="media-section">
                <div className="media-grid">
                  {media.map((item) => (
                    <div key={item.id} className="media-item">
                      <img src={item.url} alt="Media" />
                      <button
                        className="media-remove"
                        onClick={() => handleRemoveMedia(item.id)}
                      >
                        <X size={16} />
                      </button>
                      <div className="media-drag-handle">
                        <GripVertical size={16} />
                      </div>
                    </div>
                  ))}
                  
                  {media.length < 5 && (
                    <div className="media-add-tile">
                      <ImageIcon size={32} color="#9CA3AF" />
                      <span>Add media</span>
                    </div>
                  )}
                </div>

                <p className="media-hint">
                  Add up to 5 visuals. 1–3 works best.
                </p>

                <div className="media-actions">
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleCameraPhoto}
                    style={{ display: 'none' }}
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                  
                  <button
                    className="media-action-btn camera-btn"
                    onClick={handleCameraCapture}
                    disabled={media.length >= 5}
                  >
                    <Camera size={20} />
                    <span>Camera</span>
                  </button>

                  <button
                    className="media-action-btn upload-btn"
                    onClick={handleFileUpload}
                    disabled={media.length >= 5}
                  >
                    <ImageIcon size={20} />
                    <span>Upload</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 'story' && (
            <div className="creator-step">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <label className="step-label" style={{ margin: 0 }}>Tell the story</label>
                <button
                  type="button"
                  onClick={handleGenerateCaption}
                  disabled={isGeneratingCaption}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '2px solid #6C4BFF',
                    background: isGeneratingCaption ? '#f5f3ff' : 'white',
                    color: '#6C4BFF',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: isGeneratingCaption ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!isGeneratingCaption) {
                      e.currentTarget.style.background = '#6C4BFF';
                      e.currentTarget.style.color = 'white';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isGeneratingCaption) {
                      e.currentTarget.style.background = 'white';
                      e.currentTarget.style.color = '#6C4BFF';
                    }
                  }}
                >
                  {isGeneratingCaption ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      Generate with AI
                    </>
                  )}
                </button>
              </div>
              <textarea
                className="story-textarea"
                placeholder={
                  contentType === ContentType.EXPERIENCE_POST
                    ? "What made this experience special?"
                    : contentType === ContentType.MOMENT
                    ? "Capture this moment in words..."
                    : "What's this about?"
                }
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={5}
                maxLength={2000}
              />
              <div className="char-counter">
                {caption.length} / 2000
              </div>
            </div>
          )}

          {step === 'context' && (
            <div className="creator-step">
              <label className="step-label">Visibility</label>
              <div className="context-chips">
                <button
                  className={`context-chip ${contextType === 'discoverable' ? 'active' : ''}`}
                  onClick={() => setContextType('discoverable')}
                >
                  🌍 Discoverable
                </button>
                <button
                  className={`context-chip ${contextType === 'community' ? 'active' : ''}`}
                  onClick={() => setContextType('community')}
                >
                  🤝 For my community
                </button>
                {userRole !== UserRole.MEMBER && (
                  <button
                    className={`context-chip ${contextType === 'collaborators' ? 'active' : ''}`}
                    onClick={() => setContextType('collaborators')}
                  >
                    🎯 For collaborators
                  </button>
                )}
              </div>
              <p className="context-explanation">{getContextExplanation()}</p>

              <div className="location-section">
                <label className="step-label">
                  <MapPin size={16} />
                  Location (optional)
                </label>
                <input
                  type="text"
                  className="location-input"
                  placeholder="Add location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div className="tags-section">
                <label className="step-label">Tags (select up to 5)</label>
                <div className="suggested-tags">
                  {suggestedTags.map((tag) => (
                    <button
                      key={tag}
                      className={`tag-chip ${selectedTags.includes(tag) ? 'selected' : ''}`}
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 'review' && (
            <div className="creator-step">
              <label className="step-label">Preview</label>
              
              {/* Feed Card Preview */}
              <div className="preview-card">
                <div className="preview-header">
                  <img src={userAvatar} alt={userName} className="preview-avatar" />
                  <div className="preview-user-info">
                    <div className="preview-name">{userName}</div>
                    <div className="preview-context">
                      <span className="context-badge">{contentTypeLabels[contentType]}</span>
                      {location && (
                        <>
                          <span className="preview-dot">·</span>
                          <span className="preview-location">
                            <MapPin size={12} />
                            {location}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {media.length > 0 && (
                  <div className="preview-media">
                    <img src={media[0].url} alt="Preview" />
                    {media.length > 1 && (
                      <div className="preview-media-count">+{media.length - 1}</div>
                    )}
                  </div>
                )}

                <div className="preview-caption">{caption}</div>

                {selectedTags.length > 0 && (
                  <div className="preview-tags">
                    {selectedTags.map((tag) => (
                      <span key={tag} className="preview-tag">#{tag}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Summary */}
              <div className="publish-summary">
                <div className="summary-item">
                  <span className="summary-icon">✔</span>
                  <span>Visibility: {contextType === 'discoverable' ? 'Discover' : contextType === 'community' ? 'Community' : 'Collaborators'}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-icon">✔</span>
                  <span>Audience: {location ? 'Local' : 'Global'}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-icon">✔</span>
                  <span>Duration: Permanent</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
