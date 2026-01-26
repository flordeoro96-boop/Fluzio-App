/**
 * Creator Community Service
 * 
 * Specialized feed and networking features for creators
 * - Creator-only posts and interactions
 * - Collaboration opportunities
 * - Skill sharing and mentorship
 * - Networking and connections
 */

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove
} from '../../services/firestoreCompat';
import { db } from './AuthContext';

export type PostType = 
  | 'collaboration'    // Looking for collaborators
  | 'tip'              // Sharing tips and advice
  | 'showcase'         // Showcasing work
  | 'question'         // Asking for help
  | 'opportunity'      // Sharing opportunities
  | 'milestone'        // Celebrating achievements
  | 'resource';        // Sharing resources

export interface CreatorPost {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar?: string;
  
  type: PostType;
  title: string;
  content: string;
  tags: string[];
  
  // Collaboration specific
  lookingFor?: string[];  // Skills needed
  budget?: number;
  timeline?: string;
  
  // Engagement
  likes: string[];  // Array of user IDs
  comments: number;
  shares: number;
  views: number;
  
  // Visibility
  isPublic: boolean;  // False = creator-only
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface PostComment {
  id: string;
  postId: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar?: string;
  content: string;
  likes: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatorConnection {
  id: string;
  requesterId: string;
  requesterName: string;
  recipientId: string;
  recipientName: string;
  status: 'pending' | 'accepted' | 'rejected';
  message?: string;
  createdAt: Date;
  respondedAt?: Date;
}

/**
 * Create a new creator post
 */
export const createCreatorPost = async (post: Omit<CreatorPost, 'id' | 'likes' | 'comments' | 'shares' | 'views' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const postData = {
      ...post,
      likes: [],
      comments: 0,
      shares: 0,
      views: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const postsRef = collection(db, 'creatorPosts');
    const docRef = await addDoc(postsRef, postData);
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating creator post:', error);
    throw error;
  }
};

/**
 * Get creator community feed
 */
export const getCreatorFeed = async (
  creatorId: string,
  postType?: PostType,
  limitCount: number = 20
): Promise<CreatorPost[]> => {
  try {
    let q = query(
      collection(db, 'creatorPosts'),
      where('isPublic', '==', false),  // Creator-only posts
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    if (postType) {
      q = query(
        collection(db, 'creatorPosts'),
        where('isPublic', '==', false),
        where('type', '==', postType),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    })) as CreatorPost[];
  } catch (error) {
    console.error('Error fetching creator feed:', error);
    return [];
  }
};

/**
 * Get posts by a specific creator
 */
export const getCreatorPosts = async (creatorId: string): Promise<CreatorPost[]> => {
  try {
    const q = query(
      collection(db, 'creatorPosts'),
      where('creatorId', '==', creatorId),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    })) as CreatorPost[];
  } catch (error) {
    console.error('Error fetching creator posts:', error);
    return [];
  }
};

/**
 * Get collaboration opportunities
 */
export const getCollaborationOpportunities = async (
  skills?: string[]
): Promise<CreatorPost[]> => {
  try {
    let q = query(
      collection(db, 'creatorPosts'),
      where('type', '==', 'collaboration'),
      where('isPublic', '==', false),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    
    const snapshot = await getDocs(q);
    let posts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    })) as CreatorPost[];
    
    // Filter by skills if provided
    if (skills && skills.length > 0) {
      posts = posts.filter(post => 
        post.lookingFor?.some(skill => 
          skills.some(userSkill => 
            skill.toLowerCase().includes(userSkill.toLowerCase()) ||
            userSkill.toLowerCase().includes(skill.toLowerCase())
          )
        )
      );
    }
    
    return posts;
  } catch (error) {
    console.error('Error fetching collaboration opportunities:', error);
    return [];
  }
};

/**
 * Like a post
 */
export const likePost = async (postId: string, userId: string): Promise<void> => {
  try {
    const postRef = doc(db, 'creatorPosts', postId);
    await updateDoc(postRef, {
      likes: arrayUnion(userId),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error liking post:', error);
    throw error;
  }
};

/**
 * Unlike a post
 */
export const unlikePost = async (postId: string, userId: string): Promise<void> => {
  try {
    const postRef = doc(db, 'creatorPosts', postId);
    await updateDoc(postRef, {
      likes: arrayRemove(userId),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error unliking post:', error);
    throw error;
  }
};

/**
 * Add comment to post
 */
export const addComment = async (
  postId: string,
  creatorId: string,
  creatorName: string,
  content: string,
  creatorAvatar?: string
): Promise<string> => {
  try {
    const commentData = {
      postId,
      creatorId,
      creatorName,
      creatorAvatar,
      content,
      likes: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const commentsRef = collection(db, 'creatorPostComments');
    const docRef = await addDoc(commentsRef, commentData);
    
    // Increment comment count on post
    const postRef = doc(db, 'creatorPosts', postId);
    await updateDoc(postRef, {
      comments: increment(1),
      updatedAt: serverTimestamp()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

/**
 * Get comments for a post
 */
export const getPostComments = async (postId: string): Promise<PostComment[]> => {
  try {
    const q = query(
      collection(db, 'creatorPostComments'),
      where('postId', '==', postId),
      orderBy('createdAt', 'asc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    })) as PostComment[];
  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
};

/**
 * Increment post views
 */
export const incrementPostViews = async (postId: string): Promise<void> => {
  try {
    const postRef = doc(db, 'creatorPosts', postId);
    await updateDoc(postRef, {
      views: increment(1)
    });
  } catch (error) {
    console.error('Error incrementing views:', error);
  }
};

/**
 * Share a post
 */
export const sharePost = async (postId: string): Promise<void> => {
  try {
    const postRef = doc(db, 'creatorPosts', postId);
    await updateDoc(postRef, {
      shares: increment(1),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error sharing post:', error);
    throw error;
  }
};

/**
 * Send connection request
 */
export const sendConnectionRequest = async (
  requesterId: string,
  requesterName: string,
  recipientId: string,
  recipientName: string,
  message?: string
): Promise<string> => {
  try {
    const connectionData = {
      requesterId,
      requesterName,
      recipientId,
      recipientName,
      status: 'pending' as const,
      message,
      createdAt: serverTimestamp()
    };
    
    const connectionsRef = collection(db, 'creatorConnections');
    const docRef = await addDoc(connectionsRef, connectionData);
    
    // TODO: Send notification to recipient
    
    return docRef.id;
  } catch (error) {
    console.error('Error sending connection request:', error);
    throw error;
  }
};

/**
 * Accept connection request
 */
export const acceptConnectionRequest = async (connectionId: string): Promise<void> => {
  try {
    const connectionRef = doc(db, 'creatorConnections', connectionId);
    await updateDoc(connectionRef, {
      status: 'accepted',
      respondedAt: serverTimestamp()
    });
    
    // TODO: Send notification to requester
  } catch (error) {
    console.error('Error accepting connection:', error);
    throw error;
  }
};

/**
 * Reject connection request
 */
export const rejectConnectionRequest = async (connectionId: string): Promise<void> => {
  try {
    const connectionRef = doc(db, 'creatorConnections', connectionId);
    await updateDoc(connectionRef, {
      status: 'rejected',
      respondedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error rejecting connection:', error);
    throw error;
  }
};

/**
 * Get pending connection requests for a creator
 */
export const getPendingConnectionRequests = async (creatorId: string): Promise<CreatorConnection[]> => {
  try {
    const q = query(
      collection(db, 'creatorConnections'),
      where('recipientId', '==', creatorId),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      respondedAt: doc.data().respondedAt?.toDate()
    })) as CreatorConnection[];
  } catch (error) {
    console.error('Error fetching connection requests:', error);
    return [];
  }
};

/**
 * Get accepted connections for a creator
 */
export const getCreatorConnections = async (creatorId: string): Promise<CreatorConnection[]> => {
  try {
    const q1 = query(
      collection(db, 'creatorConnections'),
      where('requesterId', '==', creatorId),
      where('status', '==', 'accepted')
    );
    
    const q2 = query(
      collection(db, 'creatorConnections'),
      where('recipientId', '==', creatorId),
      where('status', '==', 'accepted')
    );
    
    const [snapshot1, snapshot2] = await Promise.all([
      getDocs(q1),
      getDocs(q2)
    ]);
    
    const connections = [
      ...snapshot1.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        respondedAt: doc.data().respondedAt?.toDate()
      })),
      ...snapshot2.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        respondedAt: doc.data().respondedAt?.toDate()
      }))
    ] as CreatorConnection[];
    
    return connections;
  } catch (error) {
    console.error('Error fetching connections:', error);
    return [];
  }
};

/**
 * Check if two creators are connected
 */
export const areCreatorsConnected = async (
  creatorId1: string,
  creatorId2: string
): Promise<boolean> => {
  try {
    const q1 = query(
      collection(db, 'creatorConnections'),
      where('requesterId', '==', creatorId1),
      where('recipientId', '==', creatorId2),
      where('status', '==', 'accepted')
    );
    
    const q2 = query(
      collection(db, 'creatorConnections'),
      where('requesterId', '==', creatorId2),
      where('recipientId', '==', creatorId1),
      where('status', '==', 'accepted')
    );
    
    const [snapshot1, snapshot2] = await Promise.all([
      getDocs(q1),
      getDocs(q2)
    ]);
    
    return !snapshot1.empty || !snapshot2.empty;
  } catch (error) {
    console.error('Error checking connection:', error);
    return false;
  }
};

/**
 * Get trending tags
 */
export const getTrendingTags = async (): Promise<Array<{ tag: string; count: number }>> => {
  try {
    // Get recent posts
    const q = query(
      collection(db, 'creatorPosts'),
      where('isPublic', '==', false),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
    
    const snapshot = await getDocs(q);
    const posts = snapshot.docs.map(doc => doc.data() as CreatorPost);
    
    // Count tag occurrences
    const tagCounts: Record<string, number> = {};
    posts.forEach(post => {
      post.tags?.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    
    // Convert to array and sort
    const trending = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    return trending;
  } catch (error) {
    console.error('Error fetching trending tags:', error);
    return [];
  }
};

/**
 * Search creator posts
 */
export const searchCreatorPosts = async (
  searchQuery: string,
  tags?: string[]
): Promise<CreatorPost[]> => {
  try {
    // Get all creator posts (we'll filter client-side for text search)
    let q = query(
      collection(db, 'creatorPosts'),
      where('isPublic', '==', false),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
    
    const snapshot = await getDocs(q);
    let posts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    })) as CreatorPost[];
    
    // Filter by search query
    const query = searchQuery.toLowerCase();
    posts = posts.filter(post => 
      post.title.toLowerCase().includes(query) ||
      post.content.toLowerCase().includes(query) ||
      post.tags.some(tag => tag.toLowerCase().includes(query))
    );
    
    // Filter by tags if provided
    if (tags && tags.length > 0) {
      posts = posts.filter(post =>
        tags.some(tag => post.tags.includes(tag))
      );
    }
    
    return posts;
  } catch (error) {
    console.error('Error searching posts:', error);
    return [];
  }
};

/**
 * Delete post
 */
export const deletePost = async (postId: string): Promise<void> => {
  try {
    const postRef = doc(db, 'creatorPosts', postId);
    await deleteDoc(postRef);
    
    // Delete associated comments
    const commentsQuery = query(
      collection(db, 'creatorPostComments'),
      where('postId', '==', postId)
    );
    const commentsSnapshot = await getDocs(commentsQuery);
    await Promise.all(
      commentsSnapshot.docs.map(doc => deleteDoc(doc.ref))
    );
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
};

/**
 * Update post
 */
export const updatePost = async (
  postId: string,
  updates: Partial<CreatorPost>
): Promise<void> => {
  try {
    const postRef = doc(db, 'creatorPosts', postId);
    await updateDoc(postRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating post:', error);
    throw error;
  }
};
