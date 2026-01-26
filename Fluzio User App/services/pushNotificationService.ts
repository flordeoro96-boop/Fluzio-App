// Push Notification Service - Stubbed for Supabase migration
// TODO: Implement with Supabase or third-party push notification service
import { doc, setDoc, getDoc, updateDoc, Timestamp } from '../services/firestoreCompat';
import { db } from './apiService';

// Notification permission status
export type NotificationPermission = 'default' | 'granted' | 'denied';

/**
 * Initialize Messaging (stub)
 */
export const initializeMessaging = async (): Promise<any | null> => {
  console.log('[Push Notifications] Messaging stubbed - migrated from Firebase');
  return null;
};

/**
 * Request notification permission from user
 */
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  try {
    if (!('Notification' in window)) {
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    return permission as NotificationPermission;
  } catch (error) {
    console.error('[Push Notifications] Failed to request permission:', error);
    return 'denied';
  }
};

/**
 * Get FCM token for this device
 */
export const getFCMToken = async (vapidKey: string): Promise<string | null> => {
  try {
    if (!messaging) {
      messaging = await initializeMessaging();
    }

    if (!messaging) {
      return null;
    }

    // Request permission first
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      console.warn('[Push Notifications] Permission not granted');
      return null;
    }

    // Get FCM token
    const token = await getToken(messaging, { vapidKey });
    console.log('[Push Notifications] FCM Token obtained:', token.substring(0, 20) + '...');
    
    return token;
  } catch (error) {
    console.error('[Push Notifications] Failed to get FCM token:', error);
    return null;
  }
};

/**
 * Save FCM token to user's Firestore document
 */
export const saveFCMToken = async (userId: string, token: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      console.warn('[Push Notifications] User document not found');
      return;
    }

    const existingTokens = userDoc.data()?.fcmTokens || [];
    
    // Add token if not already exists
    if (!existingTokens.includes(token)) {
      await updateDoc(userRef, {
        fcmTokens: [...existingTokens, token],
        lastTokenUpdate: Timestamp.now()
      });
      console.log('[Push Notifications] Token saved to Firestore');
    }
  } catch (error) {
    console.error('[Push Notifications] Failed to save token:', error);
  }
};

/**
 * Remove FCM token from user's Firestore document (on logout)
 */
export const removeFCMToken = async (userId: string, token: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) return;

    const existingTokens = userDoc.data()?.fcmTokens || [];
    const updatedTokens = existingTokens.filter((t: string) => t !== token);

    await updateDoc(userRef, {
      fcmTokens: updatedTokens
    });
    console.log('[Push Notifications] Token removed from Firestore');
  } catch (error) {
    console.error('[Push Notifications] Failed to remove token:', error);
  }
};

/**
 * Listen for foreground messages
 */
export const onForegroundMessage = (
  callback: (payload: any) => void
): (() => void) | null => {
  try {
    if (!messaging) {
      console.warn('[Push Notifications] Messaging not initialized');
      return null;
    }

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('[Push Notifications] Foreground message received:', payload);
      callback(payload);
    });

    return unsubscribe;
  } catch (error) {
    console.error('[Push Notifications] Failed to listen for messages:', error);
    return null;
  }
};

/**
 * Save notification preferences for user
 */
export const saveNotificationPreferences = async (
  userId: string,
  preferences: {
    missions?: boolean;
    meetups?: boolean;
    rewards?: boolean;
    social?: boolean;
    dailyReminder?: boolean;
    reminderTime?: string; // HH:MM format (e.g., "09:00")
  }
): Promise<void> => {
  try {
    const prefsRef = doc(db, 'notificationPreferences', userId);
    await setDoc(prefsRef, {
      ...preferences,
      updatedAt: Timestamp.now()
    }, { merge: true });
    
    console.log('[Push Notifications] Preferences saved');
  } catch (error) {
    console.error('[Push Notifications] Failed to save preferences:', error);
  }
};

/**
 * Get notification preferences for user
 */
export const getNotificationPreferences = async (userId: string) => {
  try {
    const prefsRef = doc(db, 'notificationPreferences', userId);
    const prefsDoc = await getDoc(prefsRef);

    if (!prefsDoc.exists()) {
      // Return default preferences
      return {
        missions: true,
        meetups: true,
        rewards: true,
        social: true,
        dailyReminder: true,
        reminderTime: '09:00'
      };
    }

    return prefsDoc.data();
  } catch (error) {
    console.error('[Push Notifications] Failed to get preferences:', error);
    return null;
  }
};

/**
 * Show browser notification (for foreground messages)
 */
export const showBrowserNotification = (
  title: string,
  options?: NotificationOptions
): void => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/logo.png',
      badge: '/badge.png',
      ...options
    });
  }
};

/**
 * Schedule local notification (using Service Worker)
 */
export const scheduleLocalNotification = async (
  title: string,
  body: string,
  scheduledTime: Date,
  tag?: string
): Promise<void> => {
  try {
    if (!('serviceWorker' in navigator)) {
      console.warn('[Push Notifications] Service workers not supported');
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    
    // Calculate delay
    const delay = scheduledTime.getTime() - Date.now();
    
    if (delay <= 0) {
      console.warn('[Push Notifications] Scheduled time is in the past');
      return;
    }

    // Use setTimeout with service worker message
    setTimeout(async () => {
      await registration.showNotification(title, {
        body,
        icon: '/logo.png',
        badge: '/badge.png',
        tag: tag || `notification-${Date.now()}`,
        requireInteraction: false
      });
    }, delay);

    console.log(`[Push Notifications] Notification scheduled for ${scheduledTime}`);
  } catch (error) {
    console.error('[Push Notifications] Failed to schedule notification:', error);
  }
};

/**
 * Get current notification permission status
 */
export const getNotificationPermissionStatus = (): NotificationPermission => {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission as NotificationPermission;
};

/**
 * Check if notifications are enabled
 */
export const areNotificationsEnabled = (): boolean => {
  return getNotificationPermissionStatus() === 'granted';
};

// ==============================================
// MISSION NOTIFICATION TRIGGERS
// ==============================================

/**
 * Notify user when a new mission is available
 */
export const notifyMissionAvailable = async (
  userId: string,
  mission: {
    id: string;
    title: string;
    description: string;
    points: number;
    businessName?: string;
  }
): Promise<void> => {
  try {
    const prefs = await getNotificationPreferences(userId);
    if (!prefs?.missions) return;

    const title = '🎯 New Mission Available!';
    const body = `${mission.title} - Earn ${mission.points} points${
      mission.businessName ? ` at ${mission.businessName}` : ''
    }`;

    showBrowserNotification(title, {
      body,
      tag: `mission-${mission.id}`,
      data: { type: 'mission', missionId: mission.id },
      requireInteraction: false
    });

    console.log('[Push Notifications] Mission available notification sent');
  } catch (error) {
    console.error('[Push Notifications] Failed to notify mission available:', error);
  }
};

/**
 * Notify user when mission is assigned to them
 */
export const notifyMissionAssigned = async (
  userId: string,
  mission: {
    id: string;
    title: string;
    businessName: string;
    deadline?: Date;
  }
): Promise<void> => {
  try {
    const prefs = await getNotificationPreferences(userId);
    if (!prefs?.missions) return;

    const title = '✅ Mission Assigned!';
    const deadlineText = mission.deadline
      ? ` Complete by ${mission.deadline.toLocaleDateString()}`
      : '';
    const body = `You've been assigned: ${mission.title} at ${mission.businessName}${deadlineText}`;

    showBrowserNotification(title, {
      body,
      tag: `mission-assigned-${mission.id}`,
      data: { type: 'mission-assigned', missionId: mission.id },
      requireInteraction: true
    });

    console.log('[Push Notifications] Mission assigned notification sent');
  } catch (error) {
    console.error('[Push Notifications] Failed to notify mission assigned:', error);
  }
};

/**
 * Notify user when mission is completed
 */
export const notifyMissionCompleted = async (
  userId: string,
  mission: {
    id: string;
    title: string;
    pointsEarned: number;
  }
): Promise<void> => {
  try {
    const prefs = await getNotificationPreferences(userId);
    if (!prefs?.missions) return;

    const title = '🎉 Mission Completed!';
    const body = `You earned ${mission.pointsEarned} points for completing: ${mission.title}`;

    showBrowserNotification(title, {
      body,
      tag: `mission-completed-${mission.id}`,
      data: { type: 'mission-completed', missionId: mission.id },
      requireInteraction: false,
      icon: '/celebration.png'
    });

    console.log('[Push Notifications] Mission completed notification sent');
  } catch (error) {
    console.error('[Push Notifications] Failed to notify mission completed:', error);
  }
};

/**
 * Notify user when mission is expiring soon
 */
export const notifyMissionExpiring = async (
  userId: string,
  mission: {
    id: string;
    title: string;
    businessName: string;
    hoursRemaining: number;
  }
): Promise<void> => {
  try {
    const prefs = await getNotificationPreferences(userId);
    if (!prefs?.missions) return;

    const title = '⏰ Mission Expiring Soon!';
    const body = `Only ${mission.hoursRemaining} hours left to complete: ${mission.title} at ${mission.businessName}`;

    showBrowserNotification(title, {
      body,
      tag: `mission-expiring-${mission.id}`,
      data: { type: 'mission-expiring', missionId: mission.id },
      requireInteraction: true
    });

    console.log('[Push Notifications] Mission expiring notification sent');
  } catch (error) {
    console.error('[Push Notifications] Failed to notify mission expiring:', error);
  }
};

/**
 * Notify user when mission application is approved
 */
export const notifyMissionApproved = async (
  userId: string,
  mission: {
    id: string;
    title: string;
    businessName: string;
    pointsEarned: number;
  }
): Promise<void> => {
  try {
    const prefs = await getNotificationPreferences(userId);
    if (!prefs?.missions) return;

    const title = '✨ Mission Approved!';
    const body = `Your submission for "${mission.title}" at ${mission.businessName} has been approved! You earned ${mission.pointsEarned} points.`;

    showBrowserNotification(title, {
      body,
      tag: `mission-approved-${mission.id}`,
      data: { type: 'mission-approved', missionId: mission.id },
      requireInteraction: false
    });

    console.log('[Push Notifications] Mission approved notification sent');
  } catch (error) {
    console.error('[Push Notifications] Failed to notify mission approved:', error);
  }
};

/**
 * Notify user when mission application is rejected
 */
export const notifyMissionRejected = async (
  userId: string,
  mission: {
    id: string;
    title: string;
    businessName: string;
    reason?: string;
  }
): Promise<void> => {
  try {
    const prefs = await getNotificationPreferences(userId);
    if (!prefs?.missions) return;

    const title = '❌ Mission Needs Revision';
    const body = `Your submission for "${mission.title}" at ${mission.businessName} needs revision${
      mission.reason ? `: ${mission.reason}` : ''
    }`;

    showBrowserNotification(title, {
      body,
      tag: `mission-rejected-${mission.id}`,
      data: { type: 'mission-rejected', missionId: mission.id },
      requireInteraction: true
    });

    console.log('[Push Notifications] Mission rejected notification sent');
  } catch (error) {
    console.error('[Push Notifications] Failed to notify mission rejected:', error);
  }
};

/**
 * Notify user about new reward available
 */
export const notifyRewardAvailable = async (
  userId: string,
  reward: {
    id: string;
    name: string;
    pointsCost: number;
    businessName?: string;
  }
): Promise<void> => {
  try {
    const prefs = await getNotificationPreferences(userId);
    if (!prefs?.rewards) return;

    const title = '🎁 New Reward Available!';
    const body = `${reward.name} - ${reward.pointsCost} points${
      reward.businessName ? ` at ${reward.businessName}` : ''
    }`;

    showBrowserNotification(title, {
      body,
      tag: `reward-${reward.id}`,
      data: { type: 'reward', rewardId: reward.id },
      requireInteraction: false
    });

    console.log('[Push Notifications] Reward available notification sent');
  } catch (error) {
    console.error('[Push Notifications] Failed to notify reward available:', error);
  }
};

/**
 * Notify user about AI recommendation
 */
export const notifyAIRecommendation = async (
  userId: string,
  recommendation: {
    title: string;
    description: string;
    type: 'business' | 'mission' | 'event';
  }
): Promise<void> => {
  try {
    const prefs = await getNotificationPreferences(userId);
    if (!prefs?.missions && recommendation.type === 'mission') return;

    const title = '🤖 Recommended for You';
    const body = `${recommendation.title} - ${recommendation.description}`;

    showBrowserNotification(title, {
      body,
      tag: `ai-rec-${Date.now()}`,
      data: { type: 'ai-recommendation', recommendationType: recommendation.type },
      requireInteraction: false
    });

    console.log('[Push Notifications] AI recommendation notification sent');
  } catch (error) {
    console.error('[Push Notifications] Failed to notify AI recommendation:', error);
  }
};
