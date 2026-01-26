/**
 * Feed Screen - ONE FEED, THREE LENSES
 * 
 * Same content universe, different perspectives:
 * 👤 USER: Discover & Feel - "What's happening around me?"
 * 🏢 BUSINESS: Inspiration + Strategy - "How can I tell my story better?"
 * 🎨 CREATOR: Opportunity & Insight - "Who can I work with?"
 * 
 * Like Spotify: Same songs, different playlists depending on who you are.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, SlidersHorizontal, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { FeedCard } from './FeedCard';
import { ContentCreator } from './ContentCreatorNew';
import { CreateBottomSheet } from './CreateBottomSheet';
import { UserProfileView } from './UserProfileView';
import { CustomerBusinessProfile } from './CustomerBusinessProfile';
import { getFeed } from '../services/feedService';
import { getUserById } from '../services/userService';
import { rankFeedPosts } from '../services/openaiService';
import { FeedItem, FeedFilter, UserRole, ContentType } from '../types';
import './FeedScreen.css';

interface FeedScreenProps {
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
  userInterests?: string[];
  followingIds?: string[];
}

export const FeedScreen: React.FC<FeedScreenProps> = ({
  userId,
  userRole,
  userName,
  userAvatar,
  userLocation,
  userInterests = [],
  followingIds = []
}) => {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [feedCategory, setFeedCategory] = useState<'experiences' | 'moments' | 'events'>('experiences');
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [selectedContentType, setSelectedContentType] = useState<ContentType | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [selectedProfileUserId, setSelectedProfileUserId] = useState<string | null>(null);
  const [selectedProfileRole, setSelectedProfileRole] = useState<UserRole | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isAiRanking, setIsAiRanking] = useState(false); // AI ranking toggle
  const [useAiRanking, setUseAiRanking] = useState(() => {
    // Load preference from localStorage
    const saved = localStorage.getItem('feedRankingMode');
    return saved === 'ai'; // Default to chronological if not set
  });
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const loadFeed = async (refresh: boolean = false) => {
    if (!refresh && isLoading) return;

    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      // Build filter based on category
      const filter: FeedFilter = {
        role: userRole,
        contentTypes: getCategoryContentTypes(feedCategory),
        following: false // We'll fetch all and sort by following status
      };

      // Add location filter if available
      if (userLocation?.latitude && userLocation?.longitude) {
        filter.location = {
          radiusKm: 50,
          coordinates: {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude
          },
          city: userLocation.city,
          country: userLocation.country
        };
      }

      console.log('[FeedScreen] 🔍 Loading feed:', {
        userId,
        userRole,
        feedCategory,
        contentTypes: filter.contentTypes,
        location: filter.location,
        followingCount: followingIds.length
      });

      const items = await getFeed(
        userId,
        filter,
        userLocation?.latitude && userLocation?.longitude ? {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude
        } : undefined,
        userInterests,
        followingIds,
        20
      );

      console.log('[FeedScreen] 📦 Received items:', {
        count: items.length,
        items: items.map(i => ({ id: i.id, type: i.contentType, creator: i.creatorName }))
      });

      let sortedItems: FeedItem[] = [];

      // AI Ranking or Chronological
      if (useAiRanking && items.length > 0) {
        try {
          setIsAiRanking(true);
          console.log('[FeedScreen] 🤖 AI ranking feed...');

          // Prepare posts for ranking
          const postsForRanking = items.map(item => ({
            id: item.id,
            contentType: item.contentType,
            createdBy: item.createdBy,
            creatorName: item.creatorName,
            caption: item.caption,
            tags: item.tags,
            location: item.location,
            likes: item.likes,
            comments: item.comments
          }));

          // Get AI rankings
          const rankings = await rankFeedPosts(postsForRanking, {
            userId,
            interests: userInterests,
            followingIds,
            location: userLocation ? {
              city: userLocation.city,
              country: userLocation.country
            } : undefined
          });

          // Sort by relevance score
          const rankingMap = new Map(rankings.map(r => [r.postId, r.relevanceScore]));
          sortedItems = items.sort((a, b) => {
            const scoreA = rankingMap.get(a.id) || 0;
            const scoreB = rankingMap.get(b.id) || 0;
            return scoreB - scoreA; // Higher score first
          });

          console.log('[FeedScreen] ✨ AI ranking complete:', {
            topPosts: sortedItems.slice(0, 3).map(p => ({
              creator: p.creatorName,
              score: rankingMap.get(p.id)
            }))
          });
        } catch (error) {
          console.error('[FeedScreen] AI ranking failed, falling back to chronological:', error);
          // Fall back to following-first sort
          sortedItems = items.sort((a, b) => {
            const aIsFollowing = followingIds.includes(a.createdBy);
            const bIsFollowing = followingIds.includes(b.createdBy);
            if (aIsFollowing && !bIsFollowing) return -1;
            if (!aIsFollowing && bIsFollowing) return 1;
            return 0;
          });
        } finally {
          setIsAiRanking(false);
        }
      } else {
        // Chronological: Following content first, then discovery
        sortedItems = items.sort((a, b) => {
          const aIsFollowing = followingIds.includes(a.createdBy);
          const bIsFollowing = followingIds.includes(b.createdBy);
          if (aIsFollowing && !bIsFollowing) return -1;
          if (!aIsFollowing && bIsFollowing) return 1;
          return 0;
        });
      }

      if (refresh) {
        setFeedItems(sortedItems);
      } else {
        setFeedItems(prev => [...prev, ...sortedItems]);
      }

      setHasMore(items.length === 20);
    } catch (error) {
      console.error('[FeedScreen] Error loading feed:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const getCategoryContentTypes = (category: 'experiences' | 'moments' | 'events'): ContentType[] => {
    switch (category) {
      case 'experiences':
        // Experiences: User-generated experiences + Business announcements about their offerings
        return [ContentType.EXPERIENCE_POST, ContentType.BUSINESS_ANNOUNCEMENT];
      case 'moments':
        // Moments: Quick photos/videos + Creator content showcasing their work
        return [ContentType.MOMENT, ContentType.CREATOR_CONTENT];
      case 'events':
        // Events: Event previews + Collaboration calls (event-like opportunities)
        return [ContentType.EVENT_PREVIEW, ContentType.COLLABORATION_CALL];
    }
  };

  const getContentTypesForRole = (role: UserRole): ContentType[] => {
    // ONE FEED — THREE LENSES: Same content universe, different filters
    switch (role) {
      case UserRole.MEMBER:
        // MEMBER LENS: Discover & Feel
        // Sees: Experiences (main), Moments (secondary), Events (optional)
        // Purpose: "What's happening around me that I'd love to experience?"
        return [ContentType.EXPERIENCE_POST, ContentType.MOMENT, ContentType.EVENT_PREVIEW];
      
      case UserRole.CREATOR:
        // CREATOR LENS: Opportunity & Insight
        // Sees: Core content + Collaboration opportunities + Creator work
        // Purpose: "Who can I work with, and how?"
        return [ContentType.EXPERIENCE_POST, ContentType.MOMENT, ContentType.EVENT_PREVIEW, ContentType.COLLABORATION_CALL, ContentType.CREATOR_CONTENT];
      
      case UserRole.BUSINESS:
        // BUSINESS LENS: Inspiration + Strategy
        // Sees: Core content + Creator activity (for inspiration)
        // Purpose: "How can I tell my story better?"
        return [ContentType.EXPERIENCE_POST, ContentType.MOMENT, ContentType.EVENT_PREVIEW, ContentType.CREATOR_CONTENT, ContentType.BUSINESS_ANNOUNCEMENT];
      
      default:
        return [ContentType.EXPERIENCE_POST, ContentType.MOMENT, ContentType.EVENT_PREVIEW];
    }
  };

  useEffect(() => {
    loadFeed(true);
  }, [feedCategory]);

  const handleScroll = () => {
    if (!scrollContainerRef.current || !hasMore || isLoading) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    if (scrollHeight - scrollTop - clientHeight < 100) {
      loadFeed();
    }
  };

  const handleRefreshClick = async () => {
    await loadFeed(true);
  };

  const handleCardAction = async (postId: string, action: string) => {
    console.log('[FeedScreen] Action:', action, 'on post:', postId);
    
    switch (action) {
      case 'view':
        // Open post detail in modal or navigate
        // For now, focus on the post in feed
        const postElement = document.getElementById(`feed-post-${postId}`);
        if (postElement) {
          postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        break;
        
      case 'apply':
        // Apply to collaboration (creators only)
        try {
          const { applyToCollaboration } = await import('../services/feedService');
          await applyToCollaboration(postId, userId);
          alert('Application submitted! The business will review your request.');
          loadFeed(true); // Refresh to update application count
        } catch (error) {
          console.error('[FeedScreen] Error applying:', error);
          alert('Failed to submit application. Please try again.');
        }
        break;
        
      case 'join':
        // Join event - redirect to events tab or open event detail
        alert('Event joining coming soon! This will integrate with the Events tab.');
        break;
        
      case 'follow':
        // Follow creator/business
        try {
          const { db } = await import('../services/apiService');
          const { doc, updateDoc, arrayUnion } = await import('../services/firestoreCompat');
          
          // Get post to find creator ID
          const post = feedItems.find(item => item.id === postId);
          if (post) {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
              following: arrayUnion(post.createdBy)
            });
            
            // Update local state
            setFeedItems(items => items.map(item => 
              item.id === postId ? { ...item, isFollowing: true } : item
            ));
            
            alert(`You're now following ${post.creatorName}!`);
          }
        } catch (error) {
          console.error('[FeedScreen] Error following:', error);
          alert('Failed to follow. Please try again.');
        }
        break;
        
      case 'share':
        // Share post
        if (navigator.share) {
          try {
            await navigator.share({
              title: 'Check out this post on Beevvy',
              text: 'Found something interesting on Beevvy!',
              url: `${window.location.origin}/feed/${postId}`
            });
          } catch (err) {
            console.log('Share cancelled or failed', err);
          }
        } else {
          // Fallback: Copy link
          const link = `${window.location.origin}/feed/${postId}`;
          navigator.clipboard.writeText(link);
          alert('Link copied to clipboard!');
        }
        break;
    }
  };

  const handleProfileClick = async (creatorId: string) => {
    console.log('[FeedScreen] Navigate to profile:', creatorId);
    
    try {
      setIsProfileLoading(true);
      
      // Fetch user to determine their role
      const user = await getUserById(creatorId);
      
      if (!user) {
        alert('User not found');
        return;
      }
      
      // Set profile data and open appropriate modal
      setSelectedProfileUserId(creatorId);
      setSelectedProfileRole((user.role as UserRole) || UserRole.MEMBER);
      
      console.log('[FeedScreen] Opening profile for:', {
        userId: creatorId,
        role: user.role,
        name: user.name
      });
    } catch (error) {
      console.error('Error loading profile:', error);
      alert('Failed to load profile');
    } finally {
      setIsProfileLoading(false);
    }
  };

  const handlePostCreated = () => {
    loadFeed(true);
    setIsCreatorOpen(false);
    setSelectedContentType(null);
    setEditingPostId(null);
  };

  const handleEditPost = (postId: string) => {
    console.log('[FeedScreen] Edit post:', postId);
    setEditingPostId(postId);
    setIsCreatorOpen(true);
    // ContentCreator component will need to handle editing mode
  };

  const handleDeletePost = (postId: string) => {
    console.log('[FeedScreen] Post deleted:', postId);
    // Remove from UI immediately
    setFeedItems(prev => prev.filter(item => item.id !== postId));
  };

  const getEmptyStateMessage = () => {
    switch (feedCategory) {
      case 'experiences':
        return 'No experiences yet. Be the first to share one!';
      case 'moments':
        return 'No moments yet. Capture a moment to get started.';
      case 'events':
        return 'No events yet. Check back soon for upcoming events!';
    }
  };

  const handleSelectContentType = (type: ContentType) => {
    setSelectedContentType(type);
    setIsCreatorOpen(true);
  };

  return (
    <div className="feed-screen-container">
      {/* Header */}
      <div className="feed-header">
        <h1 className="feed-title">Feed</h1>
        <div className="feed-actions">
          <button 
            className="icon-button" 
            aria-label="Search"
            onClick={() => setIsSearchOpen(true)}
          >
            <Search size={20} />
          </button>
          <button 
            className="icon-button" 
            aria-label="Filters"
            onClick={() => setIsFiltersOpen(true)}
          >
            <SlidersHorizontal size={20} />
          </button>
          <button 
            className="icon-button" 
            aria-label="Refresh" 
            onClick={handleRefreshClick}
            disabled={isRefreshing}
          >
            <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="feed-segment">
        <button 
          className={`segment-button ${feedCategory === 'experiences' ? 'active' : ''}`}
          onClick={() => setFeedCategory('experiences')}
        >
          Experiences
        </button>
        <button 
          className={`segment-button ${feedCategory === 'moments' ? 'active' : ''}`}
          onClick={() => setFeedCategory('moments')}
        >
          Moments
        </button>
        <button 
          className={`segment-button ${feedCategory === 'events' ? 'active' : ''}`}
          onClick={() => setFeedCategory('events')}
        >
          Events
        </button>
      </div>

      {/* AI Ranking Toggle */}
      <div style={{
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'linear-gradient(135deg, #f5f3ff 0%, #faf5ff 100%)',
        borderBottom: '1px solid #e9d5ff'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} style={{ color: '#6C4BFF' }} />
          <span style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>
            AI Personalized Feed
          </span>
          {isAiRanking && (
            <span style={{ 
              fontSize: '12px', 
              color: '#6C4BFF',
              marginLeft: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Loader2 size={12} className="animate-spin" />
              Ranking...
            </span>
          )}
        </div>
        <button
          onClick={() => {
            const newMode = !useAiRanking;
            setUseAiRanking(newMode);
            localStorage.setItem('feedRankingMode', newMode ? 'ai' : 'chronological');
            loadFeed(true); // Reload with new mode
          }}
          style={{
            padding: '6px 12px',
            borderRadius: '20px',
            border: useAiRanking ? '2px solid #6C4BFF' : '2px solid #d1d5db',
            background: useAiRanking ? '#6C4BFF' : '#fff',
            color: useAiRanking ? '#fff' : '#6b7280',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          {useAiRanking ? (
            <>
              <Sparkles size={14} />
              ON
            </>
          ) : (
            'OFF'
          )}
        </button>
      </div>

      {/* Content */}
      <div 
        className="feed-content" 
        ref={scrollContainerRef}
        onScroll={handleScroll}
      >
        {isLoading && feedItems.length === 0 && (
          <div className="loading-container">
            <Loader2 size={40} className="animate-spin text-[#6C4BFF]" />
          </div>
        )}

        {!isLoading && feedItems.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📱</div>
            <p>{getEmptyStateMessage()}</p>
          </div>
        )}

        <div className="feed-list">
          {feedItems.map((item) => (
            <FeedCard
              key={item.id}
              item={item}
              userId={userId}
              userRole={userRole}
              onAction={handleCardAction}
              onProfileClick={handleProfileClick}
              onEdit={handleEditPost}
              onDelete={handleDeletePost}
            />
          ))}
        </div>

        {hasMore && feedItems.length > 0 && (
          <div className="loading-more">
            <Loader2 size={24} className="animate-spin text-[#6C4BFF]" />
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button 
        className="feed-fab"
        onClick={() => setIsBottomSheetOpen(true)}
        aria-label="Create post"
      >
        <Plus size={28} strokeWidth={2.5} />
        <span className="feed-fab-label">Create</span>
      </button>

      {/* Bottom Sheet for Content Type Selection */}
      <CreateBottomSheet
        isOpen={isBottomSheetOpen}
        onClose={() => setIsBottomSheetOpen(false)}
        onSelectType={handleSelectContentType}
        userRole={userRole}
      />

      {/* Content Creator Modal */}
      {(selectedContentType || editingPostId) && (
        <ContentCreator
          isOpen={isCreatorOpen}
          onClose={() => {
            setIsCreatorOpen(false);
            setSelectedContentType(null);
            setEditingPostId(null);
          }}
          userId={userId}
          userRole={userRole}
          userName={userName}
          userAvatar={userAvatar}
          userLocation={userLocation}
          onPostCreated={handlePostCreated}
          initialContentType={selectedContentType || ContentType.EXPERIENCE_POST}
          editPostId={editingPostId}
        />
      )}

      {/* Search Modal Placeholder */}
      {isSearchOpen && (
        <div className="modal-overlay" onClick={() => setIsSearchOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '24px', textAlign: 'center' }}>
              <Search size={48} style={{ margin: '0 auto 16px', color: '#6C4BFF' }} />
              <h2 style={{ marginBottom: '8px' }}>Search Feed</h2>
              <p style={{ color: '#6B7280', marginBottom: '24px' }}>Search by hashtags, locations, or creators</p>
              <input 
                type="text" 
                placeholder="Search..." 
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  border: '1px solid #E5E7EB', 
                  borderRadius: '8px',
                  fontSize: '15px'
                }}
                autoFocus
              />
              <button 
                onClick={() => setIsSearchOpen(false)}
                style={{
                  marginTop: '16px',
                  padding: '12px 24px',
                  background: '#6C4BFF',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters Modal Placeholder */}
      {isFiltersOpen && (
        <div className="modal-overlay" onClick={() => setIsFiltersOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '24px' }}>
              <SlidersHorizontal size={48} style={{ margin: '0 auto 16px', color: '#6C4BFF', display: 'block' }} />
              <h2 style={{ marginBottom: '8px', textAlign: 'center' }}>Filter Content</h2>
              <p style={{ color: '#6B7280', marginBottom: '24px', textAlign: 'center' }}>Customize what you see in your feed</p>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Content Types</label>
                {getContentTypesForRole(userRole).map(type => (
                  <label key={type} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                    <input type="checkbox" defaultChecked style={{ marginRight: '8px' }} />
                    <span>{type.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Distance</label>
                <input 
                  type="range" 
                  min="5" 
                  max="100" 
                  defaultValue="50" 
                  style={{ width: '100%' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#6B7280' }}>
                  <span>5 km</span>
                  <span>100 km</span>
                </div>
              </div>

              <button 
                onClick={() => setIsFiltersOpen(false)}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#6C4BFF',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Profile View (for regular users/creators) */}
      {selectedProfileUserId && selectedProfileRole === UserRole.MEMBER && (
        <UserProfileView
          isOpen={true}
          onClose={() => {
            setSelectedProfileUserId(null);
            setSelectedProfileRole(null);
          }}
          userId={selectedProfileUserId}
          currentUserId={userId}
          onMessage={(targetUserId) => {
            console.log('[FeedScreen] Message user:', targetUserId);
            // TODO: Navigate to messages
          }}
        />
      )}

      {/* Business Profile View (for businesses) */}
      {selectedProfileUserId && selectedProfileRole === UserRole.BUSINESS && (
        <CustomerBusinessProfile
          isOpen={true}
          onClose={() => {
            setSelectedProfileUserId(null);
            setSelectedProfileRole(null);
          }}
          businessId={selectedProfileUserId}
          currentUserId={userId}
          onNavigateToMission={(missionId) => {
            console.log('[FeedScreen] Navigate to mission:', missionId);
            // TODO: Navigate to mission details
          }}
          onNavigateToReward={(rewardId) => {
            console.log('[FeedScreen] Navigate to reward:', rewardId);
            // TODO: Navigate to reward details
          }}
          onMessage={(businessId) => {
            console.log('[FeedScreen] Message business:', businessId);
            // TODO: Navigate to messages
          }}
        />
      )}
    </div>
  );
};
