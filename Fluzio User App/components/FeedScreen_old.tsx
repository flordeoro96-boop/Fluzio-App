/**
 * Feed Screen - Unified Content Discovery
 * One shared feed, different perspectives based on role
 * Replaces Instagram/external integrations with native content
 */

import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonSpinner,
  IonFab,
  IonFabButton,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  RefresherEventDetail
} from '@ionic/react';
import {
  add,
  filterOutline,
  searchOutline,
  heartOutline
} from 'ionicons/icons';
import { FeedCard } from '../components/FeedCard';
import { ContentCreator } from '../components/ContentCreator';
import { getFeed } from '../services/feedService';
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
  userInterests,
  followingIds = []
}) => {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [feedType, setFeedType] = useState<'discover' | 'following'>('discover');

  const loadFeed = async (refresh: boolean = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const filter: FeedFilter = {
        role: userRole,
        following: feedType === 'following',
        location: userLocation ? {
          city: userLocation.city,
          country: userLocation.country,
          radiusKm: 50,
          coordinates: (userLocation.latitude && userLocation.longitude) ? {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude
          } : undefined
        } : undefined,
        interests: userInterests
      };

      const items = await getFeed(
        userId,
        filter,
        userLocation ? {
          latitude: userLocation.latitude!,
          longitude: userLocation.longitude!
        } : undefined,
        userInterests,
        followingIds,
        20
      );

      if (refresh) {
        setFeedItems(items);
      } else {
        setFeedItems(prev => [...prev, ...items]);
      }

      setHasMore(items.length === 20);
    } catch (error) {
      console.error('[FeedScreen] Error loading feed:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, [feedType]);

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await loadFeed(true);
    event.detail.complete();
  };

  const handleLoadMore = async (event: any) => {
    if (!hasMore) {
      event.target.complete();
      return;
    }

    await loadFeed();
    event.target.complete();
  };

  const handleCardAction = async (postId: string, action: string) => {
    console.log('[FeedScreen] Action:', action, 'on post:', postId);
    
    switch (action) {
      case 'view':
        // Navigate to post detail
        break;
      case 'apply':
        // Apply to collaboration
        break;
      case 'join':
        // Join event
        break;
      case 'follow':
        // Follow user
        break;
      case 'share':
        // Share post
        break;
    }
  };

  const handleProfileClick = (profileUserId: string) => {
    console.log('[FeedScreen] Navigate to profile:', profileUserId);
    // Navigate to user profile
  };

  const getEmptyStateMessage = () => {
    if (feedType === 'following') {
      return {
        title: 'No posts from people you follow',
        message: 'Follow more users to see their experiences here.'
      };
    }

    switch (userRole) {
      case UserRole.MEMBER:
        return {
          title: 'Nothing here yet',
          message: 'Explore nearby experiences and start discovering.'
        };
      case UserRole.CREATOR:
        return {
          title: 'No collaborations yet',
          message: 'Creators and businesses will post opportunities here soon.'
        };
      case UserRole.BUSINESS:
        return {
          title: 'No creator content yet',
          message: 'Your feed will grow as creators share their work.'
        };
      default:
        return {
          title: 'Nothing to show',
          message: 'Check back later for new content.'
        };
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Feed</IonTitle>
          <IonButtons slot="end">
            <IonButton>
              <IonIcon icon={searchOutline} />
            </IonButton>
            <IonButton>
              <IonIcon icon={filterOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>

        {/* Feed Type Segment */}
        <IonToolbar>
          <IonSegment 
            value={feedType} 
            onIonChange={e => setFeedType(e.detail.value as 'discover' | 'following')}
          >
            <IonSegmentButton value="discover">
              <IonLabel>Discover</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="following">
              <IonLabel>Following</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {isLoading && feedItems.length === 0 ? (
          <div className="feed-loading">
            <IonSpinner />
          </div>
        ) : feedItems.length === 0 ? (
          <div className="feed-empty-state">
            <IonIcon icon={heartOutline} className="feed-empty-icon" />
            <h2 className="feed-empty-title">{getEmptyStateMessage().title}</h2>
            <p className="feed-empty-message">{getEmptyStateMessage().message}</p>
          </div>
        ) : (
          <>
            {feedItems.map(item => (
              <FeedCard
                key={item.id}
                item={item}
                userId={userId}
                userRole={userRole}
                onAction={handleCardAction}
                onProfileClick={handleProfileClick}
              />
            ))}

            <IonInfiniteScroll
              onIonInfinite={handleLoadMore}
              threshold="100px"
              disabled={!hasMore}
            >
              <IonInfiniteScrollContent />
            </IonInfiniteScroll>
          </>
        )}
      </IonContent>

      {/* Create Content FAB */}
      <IonFab vertical="bottom" horizontal="end" slot="fixed">
        <IonFabButton onClick={() => setIsCreatorOpen(true)}>
          <IonIcon icon={add} />
        </IonFabButton>
      </IonFab>

      {/* Content Creator Modal */}
      <ContentCreator
        isOpen={isCreatorOpen}
        onClose={() => setIsCreatorOpen(false)}
        userId={userId}
        userRole={userRole}
        userName={userName}
        userAvatar={userAvatar}
        userLocation={userLocation}
        onPostCreated={() => loadFeed(true)}
      />
    </IonPage>
  );
};
