import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, orderBy, limit, serverTimestamp, Timestamp } from '../services/firestoreCompat';
import { db } from './apiService';

export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

export interface Friendship {
  id: string;
  userId1: string;
  userId2: string;
  createdAt: Date;
}

export interface ActivityFeedItem {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  type: 'mission_completed' | 'reward_redeemed' | 'level_up' | 'meetup_joined' | 'achievement_unlocked';
  title: string;
  description: string;
  points?: number;
  createdAt: Date;
}

/**
 * Send a friend request
 */
export const sendFriendRequest = async (
  fromUserId: string,
  toUserId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Check if already friends
    const existingFriendship = await getFriendship(fromUserId, toUserId);
    if (existingFriendship) {
      return { success: false, error: 'Already friends' };
    }

    // Check if request already exists
    const existingRequest = await getExistingRequest(fromUserId, toUserId);
    if (existingRequest) {
      return { success: false, error: 'Friend request already sent' };
    }

    const requestId = `${fromUserId}_${toUserId}`;
    const requestRef = doc(db, 'friendRequests', requestId);

    await setDoc(requestRef, {
      fromUserId,
      toUserId,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    console.log('[socialService] Friend request sent:', requestId);
    return { success: true };
  } catch (error) {
    console.error('[socialService] Error sending friend request:', error);
    return { success: false, error: 'Failed to send friend request' };
  }
};

/**
 * Accept a friend request
 */
export const acceptFriendRequest = async (
  requestId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const requestRef = doc(db, 'friendRequests', requestId);
    const requestSnap = await getDoc(requestRef);

    if (!requestSnap.exists()) {
      return { success: false, error: 'Friend request not found' };
    }

    const request = requestSnap.data() as FriendRequest;

    // Update request status
    await updateDoc(requestRef, {
      status: 'accepted',
      updatedAt: serverTimestamp()
    });

    // Create friendship
    const friendshipId = [request.fromUserId, request.toUserId].sort().join('_');
    const friendshipRef = doc(db, 'friendships', friendshipId);

    await setDoc(friendshipRef, {
      userId1: request.fromUserId,
      userId2: request.toUserId,
      createdAt: serverTimestamp()
    });

    console.log('[socialService] Friend request accepted:', requestId);
    return { success: true };
  } catch (error) {
    console.error('[socialService] Error accepting friend request:', error);
    return { success: false, error: 'Failed to accept friend request' };
  }
};

/**
 * Reject a friend request
 */
export const rejectFriendRequest = async (
  requestId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const requestRef = doc(db, 'friendRequests', requestId);

    await updateDoc(requestRef, {
      status: 'rejected',
      updatedAt: serverTimestamp()
    });

    console.log('[socialService] Friend request rejected:', requestId);
    return { success: true };
  } catch (error) {
    console.error('[socialService] Error rejecting friend request:', error);
    return { success: false, error: 'Failed to reject friend request' };
  }
};

/**
 * Remove a friend
 */
export const removeFriend = async (
  userId1: string,
  userId2: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const friendshipId = [userId1, userId2].sort().join('_');
    const friendshipRef = doc(db, 'friendships', friendshipId);

    await deleteDoc(friendshipRef);

    console.log('[socialService] Friendship removed:', friendshipId);
    return { success: true };
  } catch (error) {
    console.error('[socialService] Error removing friend:', error);
    return { success: false, error: 'Failed to remove friend' };
  }
};

/**
 * Get pending friend requests for a user
 */
export const getPendingRequests = async (
  userId: string
): Promise<FriendRequest[]> => {
  try {
    const requestsRef = collection(db, 'friendRequests');
    const q = query(
      requestsRef,
      where('toUserId', '==', userId)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      } as FriendRequest))
      .filter(req => req.status === 'pending')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error('[socialService] Error fetching pending requests:', error);
    return [];
  }
};

/**
 * Get sent friend requests
 */
export const getSentRequests = async (
  userId: string
): Promise<FriendRequest[]> => {
  try {
    const requestsRef = collection(db, 'friendRequests');
    const q = query(
      requestsRef,
      where('fromUserId', '==', userId)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      } as FriendRequest))
      .filter(req => req.status === 'pending')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error('[socialService] Error fetching sent requests:', error);
    return [];
  }
};

/**
 * Get all friends for a user
 */
export const getFriends = async (userId: string): Promise<string[]> => {
  try {
    const friendshipsRef = collection(db, 'friendships');
    const q1 = query(friendshipsRef, where('userId1', '==', userId));
    const q2 = query(friendshipsRef, where('userId2', '==', userId));

    const [snapshot1, snapshot2] = await Promise.all([
      getDocs(q1),
      getDocs(q2)
    ]);

    const friendIds: string[] = [];

    snapshot1.forEach(doc => {
      const data = doc.data();
      friendIds.push(data.userId2);
    });

    snapshot2.forEach(doc => {
      const data = doc.data();
      friendIds.push(data.userId1);
    });

    return friendIds;
  } catch (error) {
    console.error('[socialService] Error fetching friends:', error);
    return [];
  }
};

/**
 * Get friendship between two users
 */
const getFriendship = async (
  userId1: string,
  userId2: string
): Promise<Friendship | null> => {
  try {
    const friendshipId = [userId1, userId2].sort().join('_');
    const friendshipRef = doc(db, 'friendships', friendshipId);
    const friendshipSnap = await getDoc(friendshipRef);

    if (!friendshipSnap.exists()) {
      return null;
    }

    return {
      id: friendshipSnap.id,
      ...friendshipSnap.data(),
      createdAt: friendshipSnap.data().createdAt?.toDate()
    } as Friendship;
  } catch (error) {
    console.error('[socialService] Error fetching friendship:', error);
    return null;
  }
};

/**
 * Check if a friend request already exists
 */
const getExistingRequest = async (
  fromUserId: string,
  toUserId: string
): Promise<FriendRequest | null> => {
  try {
    const requestsRef = collection(db, 'friendRequests');
    const q = query(
      requestsRef,
      where('fromUserId', '==', fromUserId),
      where('toUserId', '==', toUserId),
      where('status', '==', 'pending')
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    } as FriendRequest;
  } catch (error) {
    console.error('[socialService] Error checking existing request:', error);
    return null;
  }
};

/**
 * Get activity feed for user's friends
 */
export const getActivityFeed = async (
  userId: string,
  maxResults: number = 20
): Promise<ActivityFeedItem[]> => {
  try {
    // Get user's friends
    const friendIds = await getFriends(userId);

    if (friendIds.length === 0) {
      return [];
    }

    // Get activities for friends
    const activitiesRef = collection(db, 'activities');
    const q = query(
      activitiesRef,
      where('userId', 'in', friendIds.slice(0, 10)), // Firestore 'in' limited to 10
      orderBy('createdAt', 'desc'),
      limit(maxResults)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()
    } as ActivityFeedItem));
  } catch (error) {
    console.error('[socialService] Error fetching activity feed:', error);
    return [];
  }
};

/**
 * Add activity to user's feed
 */
export const addActivity = async (
  userId: string,
  userName: string,
  userAvatar: string,
  type: ActivityFeedItem['type'],
  title: string,
  description: string,
  points?: number
): Promise<{ success: boolean; error?: string }> => {
  try {
    const activitiesRef = collection(db, 'activities');
    const activityRef = doc(activitiesRef);

    await setDoc(activityRef, {
      userId,
      userName,
      userAvatar,
      type,
      title,
      description,
      points,
      createdAt: serverTimestamp()
    });

    console.log('[socialService] Activity added:', activityRef.id);
    return { success: true };
  } catch (error) {
    console.error('[socialService] Error adding activity:', error);
    return { success: false, error: 'Failed to add activity' };
  }
};

/**
 * Check if users are friends
 */
export const areFriends = async (
  userId1: string,
  userId2: string
): Promise<boolean> => {
  const friendship = await getFriendship(userId1, userId2);
  return friendship !== null;
};

// ============================================
// FOLLOW/FOLLOWER SYSTEM
// ============================================

/**
 * Follow a user
 */
export const followUser = async (currentUserId: string, targetUserId: string): Promise<void> => {
  if (currentUserId === targetUserId) {
    throw new Error('Cannot follow yourself');
  }

  try {
    const usersRef = collection(db, 'users');
    const currentUserRef = doc(usersRef, currentUserId);
    const targetUserRef = doc(usersRef, targetUserId);

    // Get current data
    const [currentUserSnap, targetUserSnap] = await Promise.all([
      getDoc(currentUserRef),
      getDoc(targetUserRef)
    ]);

    if (!currentUserSnap.exists() || !targetUserSnap.exists()) {
      throw new Error('User not found');
    }

    const currentUserData = currentUserSnap.data();
    const targetUserData = targetUserSnap.data();

    const following = currentUserData.following || [];
    const followers = targetUserData.followers || [];

    // Check if already following
    if (following.includes(targetUserId)) {
      throw new Error('Already following this user');
    }

    // Update both users
    await Promise.all([
      updateDoc(currentUserRef, {
        following: [...following, targetUserId],
        followingCount: (currentUserData.followingCount || 0) + 1
      }),
      updateDoc(targetUserRef, {
        followers: [...followers, currentUserId],
        followersCount: (targetUserData.followersCount || 0) + 1
      })
    ]);

    // Create notification
    try {
      const { createNotification } = await import('./notificationService');
      await createNotification(targetUserId, {
        type: 'SYSTEM',
        title: 'New Follower',
        message: `${currentUserData.name || 'Someone'} started following you`,
        actionLink: `/profile/${currentUserId}`
      });
    } catch (error) {
      console.error('[socialService] Failed to send follow notification:', error);
    }

    console.log('[socialService] ✅ User followed successfully');
  } catch (error) {
    console.error('[socialService] Error following user:', error);
    throw error;
  }
};

/**
 * Unfollow a user
 */
export const unfollowUser = async (currentUserId: string, targetUserId: string): Promise<void> => {
  try {
    const usersRef = collection(db, 'users');
    const currentUserRef = doc(usersRef, currentUserId);
    const targetUserRef = doc(usersRef, targetUserId);

    const [currentUserSnap, targetUserSnap] = await Promise.all([
      getDoc(currentUserRef),
      getDoc(targetUserRef)
    ]);

    if (!currentUserSnap.exists() || !targetUserSnap.exists()) {
      throw new Error('User not found');
    }

    const currentUserData = currentUserSnap.data();
    const targetUserData = targetUserSnap.data();

    const following = (currentUserData.following || []).filter((id: string) => id !== targetUserId);
    const followers = (targetUserData.followers || []).filter((id: string) => id !== currentUserId);

    await Promise.all([
      updateDoc(currentUserRef, {
        following: following,
        followingCount: Math.max(0, (currentUserData.followingCount || 1) - 1)
      }),
      updateDoc(targetUserRef, {
        followers: followers,
        followersCount: Math.max(0, (targetUserData.followersCount || 1) - 1)
      })
    ]);

    console.log('[socialService] ✅ User unfollowed successfully');
  } catch (error) {
    console.error('[socialService] Error unfollowing user:', error);
    throw error;
  }
};

/**
 * Check if current user is following target user
 */
export const isFollowing = async (currentUserId: string, targetUserId: string): Promise<boolean> => {
  try {
    const userRef = doc(db, 'users', currentUserId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) return false;
    
    const userData = userSnap.data();
    const following = userData.following || [];
    
    return following.includes(targetUserId);
  } catch (error) {
    console.error('[socialService] Error checking follow status:', error);
    return false;
  }
};

/**
 * Get user's followers
 */
export const getFollowers = async (userId: string, limitCount: number = 50): Promise<any[]> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) return [];
    
    const userData = userSnap.data();
    const followerIds = userData.followers || [];
    
    if (followerIds.length === 0) return [];

    const followersData = [];
    const idsToFetch = followerIds.slice(0, limitCount);
    
    for (const followerId of idsToFetch) {
      const followerRef = doc(db, 'users', followerId);
      const followerSnap = await getDoc(followerRef);
      
      if (followerSnap.exists()) {
        const data = followerSnap.data();
        followersData.push({
          id: followerSnap.id,
          name: data.name,
          avatarUrl: data.avatarUrl,
          bio: data.bio,
          level: data.level,
          points: data.points,
          followersCount: data.followersCount || 0
        });
      }
    }
    
    return followersData;
  } catch (error) {
    console.error('[socialService] Error fetching followers:', error);
    return [];
  }
};

/**
 * Get user's following
 */
export const getFollowing = async (userId: string, limitCount: number = 50): Promise<any[]> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) return [];
    
    const userData = userSnap.data();
    const followingIds = userData.following || [];
    
    if (followingIds.length === 0) return [];

    const followingData = [];
    const idsToFetch = followingIds.slice(0, limitCount);
    
    for (const followingId of idsToFetch) {
      const followingRef = doc(db, 'users', followingId);
      const followingSnap = await getDoc(followingRef);
      
      if (followingSnap.exists()) {
        const data = followingSnap.data();
        followingData.push({
          id: followingSnap.id,
          name: data.name,
          avatarUrl: data.avatarUrl,
          bio: data.bio,
          level: data.level,
          points: data.points,
          followersCount: data.followersCount || 0
        });
      }
    }
    
    return followingData;
  } catch (error) {
    console.error('[socialService] Error fetching following:', error);
    return [];
  }
};

/**
 * Get suggested users to follow
 */
export const getSuggestedUsers = async (currentUserId: string, limitCount: number = 10): Promise<any[]> => {
  try {
    const currentUserRef = doc(db, 'users', currentUserId);
    const currentUserSnap = await getDoc(currentUserRef);
    
    if (!currentUserSnap.exists()) return [];
    
    const currentUserData = currentUserSnap.data();
    const following = currentUserData.following || [];
    const location = currentUserData.location || '';
    
    // Query users in same location
    const usersQuery = query(
      collection(db, 'users'),
      where('location', '==', location),
      where('role', '==', 'MEMBER'),
      orderBy('followersCount', 'desc'),
      limit(50)
    );
    
    const usersSnap = await getDocs(usersQuery);
    const suggestions: any[] = [];
    
    usersSnap.forEach((docSnap) => {
      const data = docSnap.data();
      const userId = docSnap.id;
      
      // Exclude current user and already following
      if (userId !== currentUserId && !following.includes(userId)) {
        suggestions.push({
          id: userId,
          name: data.name,
          avatarUrl: data.avatarUrl,
          bio: data.bio,
          level: data.level,
          points: data.points,
          location: data.location,
          followersCount: data.followersCount || 0,
          followingCount: data.followingCount || 0
        });
      }
    });
    
    return suggestions
      .sort((a, b) => (b.followersCount || 0) - (a.followersCount || 0))
      .slice(0, limitCount);
  } catch (error) {
    console.error('[socialService] Error fetching suggested users:', error);
    return [];
  }
};
