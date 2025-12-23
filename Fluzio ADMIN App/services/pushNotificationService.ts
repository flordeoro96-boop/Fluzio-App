import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { doc, setDoc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from './AuthContext';

// Firebase Messaging instance
let messaging: Messaging | null = null;

// Notification permission status
export type NotificationPermission = 'default' | 'granted' | 'denied';

/**
 * Initialize Firebase Cloud Messaging
 */
export const initializeMessaging = async (): Promise<Messaging | null> => {
  try {
    // Check if browser supports notifications
    if (!('Notification' in window)) {
      console.warn('[Push Notifications] Browser does not support notifications');
      return null;
    }

    // Check if Firebase Messaging is supported
    if (!('serviceWorker' in navigator)) {
      console.warn('[Push Notifications] Service workers not supported');
      return null;
    }

    const { getApp } = await import('firebase/app');
    const app = getApp();
    messaging = getMessaging(app);
    
    return messaging;
  } catch (error) {
    console.error('[Push Notifications] Failed to initialize messaging:', error);
    return null;
  }
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
