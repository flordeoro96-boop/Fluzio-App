/**
 * Content Creator Component
 * Native content creation - replaces Instagram posting
 * Supports photo/video with captions, location, and business tags
 */

import React, { useState, useRef } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonItem,
  IonLabel,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonInput,
  IonIcon,
  IonThumbnail,
  IonList,
  IonChip,
  IonSpinner,
  IonText,
  IonImg
} from '@ionic/react';
import {
  close,
  camera,
  image,
  videocam,
  locationOutline,
  businessOutline,
  pricetagOutline,
  sendOutline
} from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { ContentType, UserRole, FeedMedia, MediaType } from '../types';
import { createFeedPost } from '../services/feedService';
import { uploadImage } from '../services/AuthContext';
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTakePhoto = async () => {
    try {
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera
      });

      if (photo.dataUrl) {
        setMedia([...media, {
          id: Date.now().toString(),
          type: MediaType.IMAGE,
          url: photo.dataUrl,
          order: media.length
        }]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
    }
  };

  const handlePickMedia = async (fromGallery: boolean = true) => {
    try {
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: fromGallery ? CameraSource.Photos : CameraSource.Camera
      });

      if (photo.dataUrl) {
        setMedia([...media, {
          id: Date.now().toString(),
          type: MediaType.IMAGE,
          url: photo.dataUrl,
          order: media.length
        }]);
      }
    } catch (error) {
      console.error('Error picking media:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const mediaType = file.type.startsWith('video') ? MediaType.VIDEO : MediaType.IMAGE;
        
        setMedia(prev => [...prev, {
          id: Date.now().toString() + Math.random(),
          type: mediaType,
          url: result,
          order: prev.length
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveMedia = (id: string) => {
    setMedia(media.filter(m => m.id !== id));
  };

  const handleAddTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handlePost = async () => {
    if (!caption.trim() || media.length === 0) {
      alert('Please add a caption and at least one photo/video');
      return;
    }

    setIsUploading(true);

    try {
      // Upload media files
      const uploadedMedia: FeedMedia[] = [];
      
      for (const mediaItem of media) {
        if (mediaItem.url.startsWith('data:')) {
          // Convert data URL to blob
          const response = await fetch(mediaItem.url);
          const blob = await response.blob();
          const file = new File([blob], `media-${Date.now()}.jpg`, { type: blob.type });
          
          // Upload using existing service
          const uploadedUrl = await uploadImage(file);
          
          uploadedMedia.push({
            ...mediaItem,
            url: uploadedUrl
          });
        } else {
          uploadedMedia.push(mediaItem);
        }
      }

      // Create post
      const postData = {
        contentType,
        createdBy: userId,
        creatorName: userName,
        creatorAvatar: userAvatar,
        creatorRole: userRole,
        caption: caption.trim(),
        media: uploadedMedia,
        location: locationName ? {
          name: locationName,
          city: userLocation?.city,
          country: userLocation?.country,
          geo: (userLocation?.latitude && userLocation?.longitude) ? {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude
          } : undefined
        } : undefined,
        tags: tags.length > 0 ? tags : undefined,
        businessTag: businessTag || undefined,
        status: 'PUBLISHED' as const,
        moderationStatus: 'APPROVED' as const, // Auto-approve for now
        ...(contentType === ContentType.COLLABORATION_CALL && {
          collaborationDetails: {
            budget: collaborationBudget,
            compensation: collaborationCompensation,
            spotsAvailable: collaborationSpots,
            applicants: []
          }
        })
      };

      await createFeedPost(postData);
      
      // Reset form
      setCaption('');
      setMedia([]);
      setTags([]);
      setLocationName(userLocation?.name || '');
      setBusinessTag('');
      setCollaborationBudget(undefined);
      setCollaborationSpots(undefined);

      if (onPostCreated) {
        onPostCreated();
      }

      onClose();
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const getContentTypeOptions = () => {
    const options = [
      { value: ContentType.EXPERIENCE_POST, label: 'Experience Post', role: [UserRole.MEMBER, UserRole.CREATOR, UserRole.BUSINESS] },
      { value: ContentType.CREATOR_CONTENT, label: 'Creator Content', role: [UserRole.CREATOR] },
      { value: ContentType.BUSINESS_ANNOUNCEMENT, label: 'Business Announcement', role: [UserRole.BUSINESS] },
      { value: ContentType.COLLABORATION_CALL, label: 'Collaboration Call', role: [UserRole.BUSINESS] },
      { value: ContentType.MOMENT, label: 'Quick Moment', role: [UserRole.MEMBER, UserRole.CREATOR] },
    ];

    return options.filter(opt => opt.role.includes(userRole));
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose} className="content-creator-modal">
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={onClose}>
              <IonIcon icon={close} />
            </IonButton>
          </IonButtons>
          <IonTitle>Create Post</IonTitle>
          <IonButtons slot="end">
            <IonButton 
              onClick={handlePost} 
              strong 
              disabled={isUploading || !caption.trim() || media.length === 0}
            >
              {isUploading ? <IonSpinner name="dots" /> : 'Post'}
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="content-creator-content">
        <div className="creator-container">
          {/* Content Type Selector */}
          <IonItem>
            <IonLabel position="stacked">Content Type</IonLabel>
            <IonSelect 
              value={contentType} 
              onIonChange={e => setContentType(e.detail.value)}
            >
              {getContentTypeOptions().map(opt => (
                <IonSelectOption key={opt.value} value={opt.value}>
                  {opt.label}
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>

          {/* Media Selection */}
          <div className="media-section">
            <div className="media-buttons">
              <IonButton onClick={handleTakePhoto} fill="outline" size="small">
                <IonIcon slot="start" icon={camera} />
                Camera
              </IonButton>
              <IonButton onClick={() => handlePickMedia(true)} fill="outline" size="small">
                <IonIcon slot="start" icon={image} />
                Gallery
              </IonButton>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />
              <IonButton onClick={() => fileInputRef.current?.click()} fill="outline" size="small">
                <IonIcon slot="start" icon={videocam} />
                Files
              </IonButton>
            </div>

            {/* Media Preview */}
            {media.length > 0 && (
              <div className="media-preview-grid">
                {media.map(mediaItem => (
                  <div key={mediaItem.id} className="media-preview-item">
                    {mediaItem.type === MediaType.VIDEO ? (
                      <video src={mediaItem.url} className="preview-video" />
                    ) : (
                      <IonImg src={mediaItem.url} className="preview-image" />
                    )}
                    <IonButton
                      className="remove-media-btn"
                      fill="solid"
                      size="small"
                      color="danger"
                      onClick={() => handleRemoveMedia(mediaItem.id)}
                    >
                      <IonIcon icon={close} slot="icon-only" />
                    </IonButton>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Caption */}
          <IonItem>
            <IonLabel position="stacked">Caption</IonLabel>
            <IonTextarea
              value={caption}
              onIonInput={e => setCaption(e.detail.value || '')}
              placeholder="Share your experience..."
              rows={4}
              maxlength={2000}
            />
            <IonText slot="helper" color="medium">
              {caption.length}/2000
            </IonText>
          </IonItem>

          {/* Location */}
          <IonItem>
            <IonIcon icon={locationOutline} slot="start" />
            <IonLabel position="stacked">Location</IonLabel>
            <IonInput
              value={locationName}
              onIonInput={e => setLocationName(e.detail.value || '')}
              placeholder="Add location..."
            />
          </IonItem>

          {/* Business Tag (optional) */}
          <IonItem>
            <IonIcon icon={businessOutline} slot="start" />
            <IonLabel position="stacked">Tag Business</IonLabel>
            <IonInput
              value={businessTag}
              onIonInput={e => setBusinessTag(e.detail.value || '')}
              placeholder="Tag a business..."
            />
          </IonItem>

          {/* Tags */}
          <IonItem>
            <IonIcon icon={pricetagOutline} slot="start" />
            <IonLabel position="stacked">Tags</IonLabel>
            <div className="tag-input-container">
              <IonInput
                value={currentTag}
                onIonInput={e => setCurrentTag(e.detail.value || '')}
                placeholder="Add tags..."
                onKeyPress={e => e.key === 'Enter' && handleAddTag()}
              />
              <IonButton onClick={handleAddTag} size="small">Add</IonButton>
            </div>
          </IonItem>

          {tags.length > 0 && (
            <div className="tags-list">
              {tags.map(tag => (
                <IonChip key={tag} onClick={() => handleRemoveTag(tag)}>
                  {tag}
                  <IonIcon icon={close} />
                </IonChip>
              ))}
            </div>
          )}

          {/* Collaboration Details (if collaboration call) */}
          {contentType === ContentType.COLLABORATION_CALL && (
            <div className="collaboration-section">
              <IonItem>
                <IonLabel position="stacked">Budget (€)</IonLabel>
                <IonInput
                  type="number"
                  value={collaborationBudget}
                  onIonInput={e => setCollaborationBudget(Number(e.detail.value))}
                  placeholder="0"
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Compensation Type</IonLabel>
                <IonSelect
                  value={collaborationCompensation}
                  onIonChange={e => setCollaborationCompensation(e.detail.value)}
                >
                  <IonSelectOption value="PAID">Paid</IonSelectOption>
                  <IonSelectOption value="POINTS">Points</IonSelectOption>
                  <IonSelectOption value="PRODUCT">Product</IonSelectOption>
                  <IonSelectOption value="EXPERIENCE">Experience</IonSelectOption>
                </IonSelect>
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Spots Available</IonLabel>
                <IonInput
                  type="number"
                  value={collaborationSpots}
                  onIonInput={e => setCollaborationSpots(Number(e.detail.value))}
                  placeholder="1"
                />
              </IonItem>
            </div>
          )}
        </div>
      </IonContent>
    </IonModal>
  );
};
