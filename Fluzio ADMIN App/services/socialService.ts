import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, orderBy, limit, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from './AuthContext';

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

/**
 * Get user followers (stub implementation)
 */
export const getFollowers = async (userId: string): Promise<any[]> => {
  // TODO: Implement proper followers functionality
  return [];
};

/**
 * Get users being followed (stub implementation)
 */
export const getFollowing = async (userId: string): Promise<any[]> => {
  // TODO: Implement proper following functionality
  return [];
};

/**
 * Follow a user (stub implementation)
 */
export const followUser = async (userId: string, targetUserId: string): Promise<void> => {
  // TODO: Implement proper follow functionality
  console.log(`User ${userId} followed ${targetUserId}`);
};

/**
 * Unfollow a user (stub implementation)
 */
export const unfollowUser = async (userId: string, targetUserId: string): Promise<void> => {
  // TODO: Implement proper unfollow functionality
  console.log(`User ${userId} unfollowed ${targetUserId}`);
};

/**
 * Check if user is following another user (stub implementation)
 */
export const isFollowing = async (userId: string, targetUserId: string): Promise<boolean> => {
  // TODO: Implement proper following check
  return false;
};

/**
 * Get suggested users (stub implementation)
 */
export const getSuggestedUsers = async (userId: string, limit?: number): Promise<any[]> => {
  // TODO: Implement proper suggested users functionality
  return [];
};
