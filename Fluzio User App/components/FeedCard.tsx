/**
 * Universal Feed Card Component
 * Displays feed content with role-based actions
 * No likes, no follower counts, no gamification
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Bookmark, 
  MapPin, 
  Clock,
  UserPlus,
  Share2,
  MoreVertical,
  Edit2,
  Trash2,
  Loader2
} from 'lucide-react';
import { FeedItem, ContentType, UserRole } from '../types';
import { saveFeedPost, unsaveFeedPost, deleteFeedPost } from '../services/feedService';
import './FeedCard.css';

interface FeedCardProps {
  item: FeedItem;
  userId: string;
  userRole: UserRole;
  onAction?: (postId: string, action: string) => void;
  onProfileClick?: (userId: string) => void;
  onEdit?: (postId: string) => void;
  onDelete?: (postId: string) => void;
}

export const FeedCard: React.FC<FeedCardProps> = ({ 
  item, 
  userId, 
  userRole,
  onAction,
  onProfileClick,
  onEdit,
  onDelete
}) => {
  const [isSaved, setIsSaved] = useState(item.isSaved || false);
  const [isLoading, setIsLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  const handleSave = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      if (isSaved) {
        await unsaveFeedPost(userId, item.id);
        setIsSaved(false);
      } else {
        await saveFeedPost(userId, item.id);
        setIsSaved(true);
      }
    } catch (error) {
      console.error('Error toggling save:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrimaryAction = () => {
    if (onAction) {
      onAction(item.id, item.actionLabel || 'view');
    }
  };

  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onProfileClick) {
      onProfileClick(item.createdBy);
    }
  };

  const handleEdit = () => {
    setShowMenu(false);
    if (onEdit) {
      onEdit(item.id);
    }
  };

  const handleDeleteClick = () => {
    setShowMenu(false);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await deleteFeedPost(item.id);
      setShowDeleteConfirm(false);
      if (onDelete) {
        onDelete(item.id);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post. Please try again.');
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  const isOwnPost = item.createdBy === userId;

  const getContextBadgeColor = (): string => {
    switch (item.contentType) {
      case ContentType.EXPERIENCE_POST: return 'success';
      case ContentType.CREATOR_CONTENT: return 'secondary';
      case ContentType.BUSINESS_ANNOUNCEMENT: return 'warning';
      case ContentType.COLLABORATION_CALL: return 'tertiary';
      case ContentType.EVENT_PREVIEW: return 'primary';
      case ContentType.MOMENT: return 'medium';
      default: return 'medium';
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Get visual emphasis class based on role and content type
  const getEmphasisClass = (): string => {
    if (userRole === UserRole.MEMBER) {
      // Users: Large experiences, medium moments, highlighted events
      if (item.contentType === ContentType.EXPERIENCE_POST) return 'emphasis-large';
      if (item.contentType === ContentType.EVENT_PREVIEW) return 'emphasis-highlight';
      return 'emphasis-medium';
    } else if (userRole === 'BUSINESS') {
      // Businesses: Medium all, soft creator content
      if (item.contentType === ContentType.CREATOR_CONTENT) return 'emphasis-soft';
      return 'emphasis-medium';
    } else if (userRole === 'CREATOR') {
      // Creators: Highlight collaborations, medium experiences
      if (item.contentType === ContentType.COLLABORATION_CALL) return 'emphasis-highlight';
      if (item.contentType === ContentType.EVENT_PREVIEW) return 'emphasis-highlight';
      return 'emphasis-medium';
    }
    return 'emphasis-medium';
  };

  return (
    <div className={`feed-card ${getEmphasisClass()}`} id={`feed-post-${item.id}`}>
      {/* Subtle Header - Secondary emphasis */}
      <div className="feed-card-header">
        <div className="experience-label">
          <span className="label-icon">✨</span>
          <span className="label-text">Experience</span>
        </div>
        <div className="brand-info" onClick={handleProfileClick}>
          <div className="brand-name">{item.creatorName}</div>
          {item.location?.name && (
            <div className="brand-location">
              <MapPin className="location-icon" size={12} />
              {item.location.name}
            </div>
          )}
        </div>
        {isOwnPost && (
          <div className="post-menu-container" ref={menuRef}>
            <button 
              className="post-menu-trigger"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              aria-label="Post options"
            >
              <MoreVertical size={18} />
            </button>
            {showMenu && (
              <div className="post-menu-dropdown">
                <button 
                  className="post-menu-item"
                  onClick={handleEdit}
                  disabled={isDeleting}
                >
                  <Edit2 size={16} />
                  <span>Edit</span>
                </button>
                <button 
                  className="post-menu-item delete"
                  onClick={handleDeleteClick}
                  disabled={isDeleting}
                >
                  <Trash2 size={16} />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Image - Magazine-style moment */}
      {item.media && item.media.length > 0 && (
        <div className="feed-media-container">
          {item.media[0].type === 'VIDEO' ? (
            <video
              src={item.media[0].url}
              poster={item.media[0].thumbnailUrl}
              controls
              className="feed-media"
            />
          ) : (
            <img 
              src={item.media[0].url} 
              alt="A captured moment"
              className="feed-media"
            />
          )}
          {item.location?.name && (
            <div className="captured-in">
              Captured in {item.location.name}
            </div>
          )}
        </div>
      )}

      {/* Story Section - Emotional, calm storytelling */}
      <div className="feed-card-story">
        {/* Emotional Title */}
        <h3 className="story-title">
          {item.caption?.split('\n')[0] || 'A quiet moment'}
        </h3>
        
        {/* Soft Description (2-3 lines) */}
        {item.caption?.split('\n').slice(1).join('\n') && (
          <div className="story-description">
            {item.caption.split('\n').slice(1).join('\n').slice(0, 180)}
            {item.caption.split('\n').slice(1).join('\n').length > 180 && '...'}
          </div>
        )}

        {/* Hashtag Context - Soft pill-style tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="context-tags">
            {item.tags.slice(0, 5).map((tag, index) => (
              <span key={index} className="context-tag">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Gentle Actions - Role-specific language */}
        <div className="gentle-actions">
          <button 
            onClick={handleSave}
            disabled={isLoading}
            className="gentle-action-btn"
            aria-label={isSaved ? 'Saved' : 'Save'}
          >
            <Bookmark 
              size={16}
              fill={isSaved ? 'currentColor' : 'none'}
            />
            <span>
              {userRole === UserRole.MEMBER ? (isSaved ? 'Saved' : 'Save') : 
               userRole === UserRole.BUSINESS ? (isSaved ? 'Saved inspiration' : 'Save inspiration') :
               isSaved ? 'Saved' : 'Save idea'}
            </span>
          </button>

          <button 
            onClick={handlePrimaryAction}
            className="gentle-action-btn"
            aria-label="Primary action"
          >
            <span>
              {userRole === UserRole.MEMBER ? `Explore ${item.creatorName}` :
               userRole === UserRole.BUSINESS ? 'Get inspired' :
               item.contentType === 'COLLABORATION_CALL' ? 'View opportunity' : 'View details'}
            </span>
          </button>

          <button 
            onClick={() => onAction?.(item.id, 'share')}
            className="gentle-action-btn"
            aria-label="Share"
          >
            <Share2 size={16} />
            <span>Share</span>
          </button>
        </div>

        {/* Whisper Footer */}
        <div className="whisper-footer">
          Shared by {item.creatorName}
          {item.location?.name && ` · Crafted in ${item.location.name}`}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="delete-modal-overlay" onClick={handleDeleteCancel}>
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Post?</h3>
            <p>This action cannot be undone. Your post will be permanently deleted.</p>
            <div className="delete-modal-actions">
              <button 
                className="delete-modal-btn cancel"
                onClick={handleDeleteCancel}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                className="delete-modal-btn confirm"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Deleting...
                  </>
                ) : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
