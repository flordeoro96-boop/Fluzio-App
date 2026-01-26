/**
 * Native Feed Service
 * Replaces Instagram and external integrations with native content discovery
 * One shared feed, different perspectives based on role
 */

import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  GeoPoint as FirebaseGeoPoint,
  QueryConstraint,
} from '../services/firestoreCompat';
import { db } from './apiService';
import { 
  FeedPost, 
  FeedItem, 
  FeedFilter, 
  ContentType, 
  UserRole,
  GeoPoint,
  MediaType,
  FeedMedia
} from '../types';

const FEED_COLLECTION = 'feedPosts';
const FEED_SAVES_COLLECTION = 'feedSaves';

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(coord1: GeoPoint, coord2: GeoPoint): number {
  const R = 6371; // Earth's radius in km
  const dLat = (coord2.latitude - coord1.latitude) * Math.PI / 180;
  const dLon = (coord2.longitude - coord1.longitude) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(coord1.latitude * Math.PI / 180) * Math.cos(coord2.latitude * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Calculate relevance score for a post based on viewer context
 */
function calculateRelevance(
  post: FeedPost, 
  filter: FeedFilter,
  userLocation?: GeoPoint,
  userInterests: string[] = [],
  followingIds: string[] = []
): number {
  let score = 50; // Base score

  // Proximity boost (if both have location)
  if (userLocation && post.location?.geo) {
    const distance = calculateDistance(userLocation, post.location.geo);
    if (distance < 5) score += 30;
    else if (distance < 20) score += 20;
    else if (distance < 50) score += 10;
  }

  // Interest match boost
  if (userInterests && userInterests.length > 0 && post.tags && post.tags.length > 0) {
    const matchingInterests = post.tags.filter(tag => 
      userInterests.some(interest => 
        interest.toLowerCase() === tag.toLowerCase()
      )
    );
    score += matchingInterests.length * 5;
  }

  // Following boost
  if (followingIds && followingIds.length > 0 && followingIds.includes(post.createdBy)) {
    score += 25;
  }

  // Freshness boost (posts from last 24h)
  const hoursSincePublish = (Date.now() - new Date(post.publishedAt || post.createdAt).getTime()) / (1000 * 60 * 60);
  if (hoursSincePublish < 24) {
    score += 15;
  }

  // Role-specific content type preferences
  if (filter.role === UserRole.MEMBER) {
    // Users prefer experiences and events
    if ([ContentType.EXPERIENCE_POST, ContentType.EVENT_PREVIEW].includes(post.contentType)) {
      score += 10;
    }
  } else if (filter.role === UserRole.CREATOR) {
    // Creators prefer collaboration calls, business announcements, and other creator content
    if ([ContentType.COLLABORATION_CALL, ContentType.BUSINESS_ANNOUNCEMENT].includes(post.contentType)) {
      score += 15;
    }
    if (post.contentType === ContentType.CREATOR_CONTENT) {
      score += 10;
    }
  } else if (filter.role === UserRole.BUSINESS) {
    // Businesses prefer creator content, events, and business announcements
    if ([ContentType.CREATOR_CONTENT, ContentType.EVENT_PREVIEW].includes(post.contentType)) {
      score += 10;
    }
    if (post.contentType === ContentType.BUSINESS_ANNOUNCEMENT) {
      score += 5;
    }
  }

  return Math.min(100, score); // Cap at 100
}

/**
 * Get feed posts based on role and filters
 */
export async function getFeed(
  userId: string,
  filter: FeedFilter,
  userLocation?: GeoPoint,
  userInterests: string[] = [],
  followingIds: string[] = [],
  limitCount: number = 20
): Promise<FeedItem[]> {
  try {
    console.log('[FeedService] 🔍 Query constraints:', {
      role: filter.role,
      contentTypes: filter.contentTypes,
      hasLocation: !!filter.location
    });
    
    const constraints: QueryConstraint[] = [
      where('status', '==', 'PUBLISHED'),
      where('moderationStatus', '==', 'APPROVED'),
    ];

    // Content type filter based on role
    if (filter.contentTypes && filter.contentTypes.length > 0) {
      constraints.push(where('contentType', 'in', filter.contentTypes));
    } else {
      // ONE FEED — THREE LENSES: Same content universe, different filters per role
      if (filter.role === UserRole.MEMBER) {
        // USER LENS: Discover & Feel - Core content only
        // Sees: Experiences (main), Moments (secondary), Events (optional)
        constraints.push(where('contentType', 'in', [
          ContentType.EXPERIENCE_POST,
          ContentType.MOMENT,
          ContentType.EVENT_PREVIEW
        ]));
      } else if (filter.role === UserRole.CREATOR) {
        // CREATOR LENS: Opportunity & Insight - Core + Opportunities
        // Sees: Core content + Collaboration calls + Creator work
        constraints.push(where('contentType', 'in', [
          ContentType.EXPERIENCE_POST,
          ContentType.MOMENT,
          ContentType.EVENT_PREVIEW,
          ContentType.COLLABORATION_CALL,
          ContentType.CREATOR_CONTENT
        ]));
      } else if (filter.role === UserRole.BUSINESS) {
        // BUSINESS LENS: Inspiration + Strategy - Core + Creator activity
        // Sees: Core content + Creator work for inspiration
        constraints.push(where('contentType', 'in', [
          ContentType.EXPERIENCE_POST,
          ContentType.MOMENT,
          ContentType.EVENT_PREVIEW,
          ContentType.CREATOR_CONTENT,
          ContentType.BUSINESS_ANNOUNCEMENT
        ]));
      }
    }

    // Location filter - DISABLED for now to show all content
    // Users will see content from everywhere, sorted by relevance
    // TODO: Re-enable with proximity-based filtering instead of exact city match
    // if (filter.location?.country) {
    //   constraints.push(where('location.country', '==', filter.location.country));
    // }

    // Following filter
    if (filter.following && followingIds && followingIds.length > 0) {
      constraints.push(where('createdBy', 'in', followingIds.slice(0, 10))); // Firestore limit
    }

    // Order by most recent
    constraints.push(orderBy('publishedAt', 'desc'));
    constraints.push(limit(limitCount * 2)); // Fetch more for filtering

    const feedQuery = query(collection(db, FEED_COLLECTION), ...constraints);
    const snapshot = await getDocs(feedQuery);
    
    console.log('[FeedService] 📊 Firestore returned:', {
      count: snapshot.size,
      docs: snapshot.docs.map(d => ({
        id: d.id,
        status: d.data().status,
        moderationStatus: d.data().moderationStatus,
        contentType: d.data().contentType
      }))
    });

    let posts: FeedPost[] = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      posts.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.().toISOString() || data.createdAt,
        publishedAt: data.publishedAt?.toDate?.().toISOString() || data.publishedAt,
        updatedAt: data.updatedAt?.toDate?.().toISOString() || data.updatedAt,
        location: data.location ? {
          ...data.location,
          geo: data.location.geo ? {
            latitude: data.location.geo.latitude,
            longitude: data.location.geo.longitude,
          } : undefined
        } : undefined
      } as FeedPost);
    });

    // Proximity filter (if radiusKm specified)
    // NOTE: Don't filter out posts without geo coordinates - show all content
    if (filter.location?.radiusKm && filter.location?.coordinates && userLocation) {
      posts = posts.filter(post => {
        if (!post.location?.geo) return true; // Include posts without location
        const distance = calculateDistance(userLocation, post.location.geo);
        return distance <= (filter.location?.radiusKm || 50);
      });
    }

    // Calculate relevance scores
    const feedItems: FeedItem[] = posts.map(post => ({
      ...post,
      relevanceScore: calculateRelevance(post, filter, userLocation, userInterests, followingIds),
      isFollowing: followingIds.includes(post.createdBy),
      // Add role-specific UI properties
      contextBadge: getContextBadge(post.contentType),
      actionLabel: getActionLabel(post.contentType, filter.role),
    }));

    // Sort by relevance score
    feedItems.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

    // Check saved status for user
    const savedPosts = await getUserSavedPosts(userId);
    feedItems.forEach(item => {
      item.isSaved = savedPosts.includes(item.id);
    });

    // Limit to requested count
    return feedItems.slice(0, limitCount);
  } catch (error) {
    console.error('[FeedService] Error fetching feed:', error);
    throw error;
  }
}

/**
 * Create a new feed post
 */
export async function createFeedPost(
  post: Omit<FeedPost, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const now = Timestamp.now();
    const docRef = await addDoc(collection(db, FEED_COLLECTION), {
      ...post,
      createdAt: now,
      updatedAt: now,
      publishedAt: post.status === 'PUBLISHED' ? now : null,
      viewCount: 0,
      saveCount: 0,
      shareCount: 0,
      // Convert GeoPoint to Firestore GeoPoint if present
      location: post.location?.geo ? {
        ...post.location,
        geo: new FirebaseGeoPoint(post.location.geo.latitude, post.location.geo.longitude)
      } : post.location
    });

    console.log('[FeedService] ✅ Created post:', docRef.id);

    // Check and complete share photo mission if conditions are met
    if (post.status === 'PUBLISHED' && post.businessTag && post.media && post.media.length > 0) {
      await checkAndCompleteSharePhotoMission(post.createdBy, post.businessTag, docRef.id);
    }

    return docRef.id;
  } catch (error) {
    console.error('[FeedService] Error creating post:', error);
    throw error;
  }
}

/**
 * Update an existing post
 */
export async function updateFeedPost(
  postId: string,
  updates: Partial<FeedPost>
): Promise<void> {
  try {
    const postRef = doc(db, FEED_COLLECTION, postId);
    await updateDoc(postRef, {
      ...updates,
      updatedAt: Timestamp.now(),
      // Update publishedAt if changing to published
      ...(updates.status === 'PUBLISHED' && { publishedAt: Timestamp.now() })
    });
    console.log('[FeedService] ✅ Updated post:', postId);
  } catch (error) {
    console.error('[FeedService] Error updating post:', error);
    throw error;
  }
}

/**
 * Get a single feed post by ID
 */
export async function getFeedPostById(postId: string): Promise<FeedPost | null> {
  try {
    const docRef = doc(db, FEED_COLLECTION, postId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate?.().toISOString() || data.createdAt,
      publishedAt: data.publishedAt?.toDate?.().toISOString() || data.publishedAt,
      updatedAt: data.updatedAt?.toDate?.().toISOString() || data.updatedAt,
      location: data.location ? {
        ...data.location,
        geo: data.location.geo ? {
          latitude: data.location.geo.latitude,
          longitude: data.location.geo.longitude,
        } : undefined
      } : undefined
    } as FeedPost;
  } catch (error) {
    console.error('[FeedService] Error fetching post:', error);
    throw error;
  }
}

/**
 * Delete a post
 */
export async function deleteFeedPost(postId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, FEED_COLLECTION, postId));
    console.log('[FeedService] ✅ Deleted post:', postId);
  } catch (error) {
    console.error('[FeedService] Error deleting post:', error);
    throw error;
  }
}

/**
 * Save a post for later
 */
export async function saveFeedPost(userId: string, postId: string): Promise<void> {
  try {
    await addDoc(collection(db, FEED_SAVES_COLLECTION), {
      userId,
      postId,
      savedAt: Timestamp.now()
    });

    // Increment save count
    const postRef = doc(db, FEED_COLLECTION, postId);
    const postSnap = await getDoc(postRef);
    if (postSnap.exists()) {
      await updateDoc(postRef, {
        saveCount: (postSnap.data().saveCount || 0) + 1
      });
    }

    console.log('[FeedService] ✅ Saved post:', postId);
  } catch (error) {
    console.error('[FeedService] Error saving post:', error);
    throw error;
  }
}

/**
 * Unsave a post
 */
export async function unsaveFeedPost(userId: string, postId: string): Promise<void> {
  try {
    const savesQuery = query(
      collection(db, FEED_SAVES_COLLECTION),
      where('userId', '==', userId),
      where('postId', '==', postId)
    );
    const snapshot = await getDocs(savesQuery);
    
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);

    // Decrement save count
    const postRef = doc(db, FEED_COLLECTION, postId);
    const postSnap = await getDoc(postRef);
    if (postSnap.exists()) {
      await updateDoc(postRef, {
        saveCount: Math.max(0, (postSnap.data().saveCount || 0) - 1)
      });
    }

    console.log('[FeedService] ✅ Unsaved post:', postId);
  } catch (error) {
    console.error('[FeedService] Error unsaving post:', error);
    throw error;
  }
}

/**
 * Get user's saved posts
 */
export async function getUserSavedPosts(userId: string): Promise<string[]> {
  try {
    const savesQuery = query(
      collection(db, FEED_SAVES_COLLECTION),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(savesQuery);
    return snapshot.docs.map(doc => doc.data().postId);
  } catch (error) {
    console.error('[FeedService] Error fetching saved posts:', error);
    return [];
  }
}

/**
 * Increment view count
 */
export async function incrementViewCount(postId: string): Promise<void> {
  try {
    const postRef = doc(db, FEED_COLLECTION, postId);
    const postSnap = await getDoc(postRef);
    if (postSnap.exists()) {
      await updateDoc(postRef, {
        viewCount: (postSnap.data().viewCount || 0) + 1
      });
    }
  } catch (error) {
    console.error('[FeedService] Error incrementing view count:', error);
  }
}

/**
 * Apply to a collaboration call
 */
export async function applyToCollaboration(
  postId: string,
  userId: string
): Promise<void> {
  try {
    const postRef = doc(db, FEED_COLLECTION, postId);
    const postSnap = await getDoc(postRef);
    
    if (!postSnap.exists()) {
      throw new Error('Post not found');
    }

    const data = postSnap.data();
    const applicants = data.collaborationDetails?.applicants || [];
    
    if (applicants.includes(userId)) {
      throw new Error('Already applied');
    }

    await updateDoc(postRef, {
      'collaborationDetails.applicants': [...applicants, userId]
    });

    console.log('[FeedService] ✅ Applied to collaboration:', postId);
  } catch (error) {
    console.error('[FeedService] Error applying to collaboration:', error);
    throw error;
  }
}

/**
 * Get user's own posts (for profile view)
 */
export async function getUserPosts(
  userId: string,
  limitCount: number = 20
): Promise<FeedItem[]> {
  try {
    const q = query(
      collection(db, FEED_COLLECTION),
      where('createdBy', '==', userId),
      where('status', '==', 'PUBLISHED'),
      orderBy('publishedAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    const posts: FeedItem[] = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        location: data.location ? {
          ...data.location,
          geo: data.location.geo ? {
            latitude: data.location.geo.latitude,
            longitude: data.location.geo.longitude
          } : undefined
        } : undefined
      } as FeedItem;
    });

    console.log(`[FeedService] ✅ Fetched ${posts.length} posts for user ${userId}`);
    return posts;
  } catch (error) {
    console.error('[FeedService] Error fetching user posts:', error);
    return [];
  }
}

// Helper functions

function getContextBadge(contentType: ContentType): string {
  switch (contentType) {
    case ContentType.EXPERIENCE_POST: return 'Experience';
    case ContentType.CREATOR_CONTENT: return 'Creator';
    case ContentType.BUSINESS_ANNOUNCEMENT: return 'Announcement';
    case ContentType.COLLABORATION_CALL: return 'Collaboration';
    case ContentType.EVENT_PREVIEW: return 'Event';
    case ContentType.MOMENT: return 'Moment';
    default: return 'Post';
  }
}

function getActionLabel(contentType: ContentType, role: UserRole): string {
  if (role === UserRole.CREATOR && contentType === ContentType.COLLABORATION_CALL) {
    return 'Apply';
  }
  if (contentType === ContentType.EVENT_PREVIEW) {
    return 'Join';
  }
  if (contentType === ContentType.EXPERIENCE_POST) {
    return 'View';
  }
  return 'Save';
}

/**
 * Check and complete Share Photo mission when user posts with business tag and photo
 */
async function checkAndCompleteSharePhotoMission(
  userId: string, 
  businessId: string,
  postId: string
): Promise<void> {
  try {
    console.log('[FeedService] Checking Share Photo mission for user:', userId, 'business:', businessId);

    // Query for SHARE_PHOTO_APP missions from this business
    const missionsQuery = query(
      collection(db, 'missions'),
      where('creatorId', '==', businessId),
      where('proofMethod', '==', 'SCREENSHOT_AI'),
      where('standardMissionType', '==', 'SHARE_PHOTO_APP'),
      where('status', '==', 'ACTIVE')
    );

    const missionsSnapshot = await getDocs(missionsQuery);

    if (missionsSnapshot.empty) {
      console.log('[FeedService] No active Share Photo missions found for this business');
      return;
    }

    for (const missionDoc of missionsSnapshot.docs) {
      const mission = missionDoc.data();
      const missionId = missionDoc.id;

      // Check if user has already participated
      const participationsQuery = query(
        collection(db, 'participations'),
        where('missionId', '==', missionId),
        where('userId', '==', userId)
      );

      const participationsSnapshot = await getDocs(participationsQuery);
      
      if (!participationsSnapshot.empty) {
        console.log('[FeedService] User already participated in this mission');
        continue;
      }

      // Create participation record
      const participationData = {
        missionId,
        userId,
        businessId,
        status: 'COMPLETED',
        proofUrl: postId, // Store post ID as proof
        proofType: 'feed_post',
        submittedAt: Timestamp.now(),
        completedAt: Timestamp.now(),
        pointsAwarded: mission.reward || 100,
        metadata: {
          postId,
          autoCompleted: true,
          completedVia: 'feed_post_webhook'
        }
      };

      await addDoc(collection(db, 'participations'), participationData);

      // Award points to user
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const currentPoints = userDoc.data().points || 0;
        await updateDoc(userRef, {
          points: currentPoints + participationData.pointsAwarded
        });

        // Create points transaction
        await addDoc(collection(db, 'pointsTransactions'), {
          userId,
          businessId,
          missionId,
          amount: participationData.pointsAwarded,
          type: 'EARN',
          source: 'MISSION_COMPLETION',
          description: `Completed: ${mission.title || 'Share Your Experience'}`,
          timestamp: Timestamp.now(),
          metadata: {
            postId,
            autoCompleted: true
          }
        });

        console.log(`[FeedService] ✅ Share Photo mission completed! User earned ${participationData.pointsAwarded} points`);

        // Send notification
        await addDoc(collection(db, 'notifications'), {
          userId,
          type: 'MISSION_COMPLETED',
          title: '🎉 Mission Complete!',
          message: `You earned ${participationData.pointsAwarded} points for sharing your experience!`,
          data: {
            missionId,
            businessId,
            pointsEarned: participationData.pointsAwarded,
            postId
          },
          read: false,
          createdAt: Timestamp.now()
        });
      }
    }
  } catch (error) {
    console.error('[FeedService] Error completing Share Photo mission:', error);
    // Don't throw - mission completion failure shouldn't block post creation
  }
}
