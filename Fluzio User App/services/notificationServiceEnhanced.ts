import { collection, doc, setDoc, query, where, getDocs, updateDoc, orderBy, limit, Timestamp, addDoc } from '../services/firestoreCompat';
import { db } from './apiService';

export type NotificationType = 
  | 'MISSION_POSTED'      // New mission available nearby
  | 'MISSION_APPROVED'    // Your mission submission was approved
  | 'MISSION_REJECTED'    // Your mission submission was rejected
  | 'CHECK_IN_MILESTONE'  // Reached check-in milestone (5th, 10th, etc.)
  | 'NEW_MESSAGE'         // New chat message
  | 'NEW_FOLLOWER'        // Someone followed you
  | 'NEW_CUSTOMER'        // New qualified customer at your business
  | 'CUSTOMER_CHECK_IN'   // Customer checked in at your business
  | 'MISSION_APPLICATION' // Someone applied to your mission
  | 'POINTS_EARNED'       // Earned points
  | 'LEVEL_UP'            // Leveled up
  | 'NEW_REVIEW';         // New review received

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  icon?: string;
  link?: string; // Deep link to relevant screen
  linkParams?: any; // Parameters for navigation
  read: boolean;
  createdAt: Timestamp;
  metadata?: {
    businessId?: string;
    missionId?: string;
    senderId?: string;
    points?: number;
    checkInCount?: number;
  };
}

/**
 * Send a notification to a user
 */
export const sendNotification = async (
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  options?: {
    icon?: string;
    link?: string;
    linkParams?: any;
    metadata?: any;
  }
): Promise<string> => {
  try {
    const notificationsRef = collection(db, 'notifications');
    const notificationData = {
      userId,
      type,
      title,
      message,
      icon: options?.icon,
      link: options?.link,
      linkParams: options?.linkParams,
      metadata: options?.metadata,
      read: false,
      createdAt: Timestamp.now(),
    };

    const docRef = await addDoc(notificationsRef, notificationData);
    console.log('[notificationService] Notification sent:', docRef.id);
    
    return docRef.id;
  } catch (error) {
    console.error('[notificationService] Error sending notification:', error);
    throw error;
  }
};

/**
 * Get notifications for a user
 */
export const getUserNotifications = async (
  userId: string,
  maxResults: number = 50
): Promise<Notification[]> => {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(maxResults)
    );

    const snapshot = await getDocs(q);
    const notifications: Notification[] = [];

    snapshot.forEach(doc => {
      notifications.push({
        id: doc.id,
        ...doc.data()
      } as Notification);
    });

    return notifications;
  } catch (error) {
    console.error('[notificationService] Error fetching notifications:', error);
    return [];
  }
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async (userId: string): Promise<number> => {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      where('read', '==', false)
    );

    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('[notificationService] Error fetching unread count:', error);
    return 0;
  }
};

/**
 * Mark notification as read
 */
export const markAsRead = async (notificationId: string): Promise<void> => {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      read: true
    });
  } catch (error) {
    console.error('[notificationService] Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read for a user
 */
export const markAllAsRead = async (userId: string): Promise<void> => {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      where('read', '==', false)
    );

    const snapshot = await getDocs(q);
    const updatePromises = snapshot.docs.map(doc => 
      updateDoc(doc.ref, { read: true })
    );

    await Promise.all(updatePromises);
    console.log('[notificationService] Marked all notifications as read');
  } catch (error) {
    console.error('[notificationService] Error marking all as read:', error);
    throw error;
  }
};

// ============================================================================
// NOTIFICATION HELPERS - Specific notification types
// ============================================================================

/**
 * Notify user about new mission posted nearby
 */
export const notifyNewMissionPosted = async (
  userId: string,
  missionId: string,
  businessName: string,
  category: string
): Promise<void> => {
  await sendNotification(
    userId,
    'MISSION_POSTED',
    `New ${category} Mission! 🎯`,
    `${businessName} posted a new mission nearby. Check it out!`,
    {
      icon: '🎯',
      link: 'MissionDetail',
      linkParams: { missionId },
      metadata: { missionId }
    }
  );
};

/**
 * Notify creator about mission approval
 */
export const notifyMissionApproved = async (
  userId: string,
  missionId: string,
  missionTitle: string,
  points: number
): Promise<void> => {
  await sendNotification(
    userId,
    'MISSION_APPROVED',
    `Mission Approved! 🎉`,
    `Your submission for "${missionTitle}" was approved. +${points} points!`,
    {
      icon: '✅',
      link: 'MissionDetail',
      linkParams: { missionId },
      metadata: { missionId, points }
    }
  );
};

/**
 * Notify creator about mission rejection
 */
export const notifyMissionRejected = async (
  userId: string,
  missionId: string,
  missionTitle: string,
  reason?: string
): Promise<void> => {
  await sendNotification(
    userId,
    'MISSION_REJECTED',
    `Mission Feedback ⚠️`,
    reason || `Your submission for "${missionTitle}" needs revision. Check the feedback.`,
    {
      icon: '⚠️',
      link: 'MissionDetail',
      linkParams: { missionId },
      metadata: { missionId }
    }
  );
};

/**
 * Notify user about check-in milestone
 */
export const notifyCheckInMilestone = async (
  userId: string,
  businessId: string,
  businessName: string,
  checkInCount: number,
  points: number
): Promise<void> => {
  const milestones: Record<number, string> = {
    5: '🌟',
    10: '⭐',
    25: '🏆',
    50: '💎',
    100: '👑'
  };

  const icon = milestones[checkInCount] || '🎉';

  await sendNotification(
    userId,
    'CHECK_IN_MILESTONE',
    `${checkInCount} Check-ins! ${icon}`,
    `You've checked in ${checkInCount} times at ${businessName}! Earned ${points} bonus points!`,
    {
      icon,
      link: 'BusinessProfile',
      linkParams: { businessId },
      metadata: { businessId, checkInCount, points }
    }
  );
};

/**
 * Notify user about new message
 */
export const notifyNewMessage = async (
  userId: string,
  senderId: string,
  senderName: string,
  preview: string
): Promise<void> => {
  await sendNotification(
    userId,
    'NEW_MESSAGE',
    `Message from ${senderName} 💬`,
    preview.length > 50 ? preview.substring(0, 50) + '...' : preview,
    {
      icon: '💬',
      link: 'Chat',
      linkParams: { userId: senderId },
      metadata: { senderId }
    }
  );
};

/**
 * Notify business about new follower
 */
export const notifyNewFollower = async (
  businessId: string,
  followerId: string,
  followerName: string
): Promise<void> => {
  await sendNotification(
    businessId,
    'NEW_FOLLOWER',
    `New Follower! 👥`,
    `${followerName} started following your business`,
    {
      icon: '👥',
      link: 'UserProfile',
      linkParams: { userId: followerId },
      metadata: { senderId: followerId }
    }
  );
};

/**
 * Notify business about new qualified customer
 */
export const notifyNewCustomer = async (
  businessId: string,
  customerId: string,
  customerName: string,
  reason: string
): Promise<void> => {
  await sendNotification(
    businessId,
    'NEW_CUSTOMER',
    `New Customer! 🎊`,
    `${customerName} is now a qualified customer (${reason})`,
    {
      icon: '🎊',
      link: 'Customers',
      linkParams: {},
      metadata: { senderId: customerId }
    }
  );
};

/**
 * Notify business about customer check-in
 */
export const notifyCustomerCheckIn = async (
  businessId: string,
  customerId: string,
  customerName: string,
  checkInCount: number
): Promise<void> => {
  await sendNotification(
    businessId,
    'CUSTOMER_CHECK_IN',
    `${customerName} Checked In! 📍`,
    `Check-in #${checkInCount} at your business`,
    {
      icon: '📍',
      link: 'Customers',
      linkParams: {},
      metadata: { senderId: customerId, checkInCount }
    }
  );
};

/**
 * Notify business about mission application
 */
export const notifyMissionApplication = async (
  businessId: string,
  missionId: string,
  creatorId: string,
  creatorName: string,
  missionTitle: string
): Promise<void> => {
  await sendNotification(
    businessId,
    'MISSION_APPLICATION',
    `New Application! 📝`,
    `${creatorName} applied to your mission: "${missionTitle}"`,
    {
      icon: '📝',
      link: 'MissionDetail',
      linkParams: { missionId },
      metadata: { missionId, senderId: creatorId }
    }
  );
};

/**
 * Notify user about points earned
 */
export const notifyPointsEarned = async (
  userId: string,
  points: number,
  reason: string
): Promise<void> => {
  await sendNotification(
    userId,
    'POINTS_EARNED',
    `+${points} Points! ⚡`,
    reason,
    {
      icon: '⚡',
      metadata: { points }
    }
  );
};

/**
 * Notify user about level up
 */
export const notifyLevelUp = async (
  userId: string,
  newLevel: number
): Promise<void> => {
  await sendNotification(
    userId,
    'LEVEL_UP',
    `Level Up! 🎉`,
    `Congratulations! You reached Level ${newLevel}!`,
    {
      icon: '🎉',
      link: 'Profile',
      metadata: { level: newLevel }
    }
  );
};

/**
 * Notify business about new review
 */
export const notifyNewReview = async (
  businessId: string,
  reviewerId: string,
  reviewerName: string,
  rating: number
): Promise<void> => {
  const stars = '⭐'.repeat(rating);
  
  await sendNotification(
    businessId,
    'NEW_REVIEW',
    `New Review! ${stars}`,
    `${reviewerName} left a ${rating}-star review`,
    {
      icon: '⭐',
      link: 'Reviews',
      metadata: { senderId: reviewerId, rating }
    }
  );
};
