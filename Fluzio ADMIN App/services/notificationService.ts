import { db } from './AuthContext';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc, Timestamp, getDocs } from 'firebase/firestore';
import { Notification } from '../types';

/**
 * Notification Service - Real-time Firestore integration
 * Replaces MockStore notifications with live data
 */

// Subscribe to real-time notifications for a user
export const subscribeToNotifications = (
  userId: string,
  onUpdate: (notifications: Notification[]) => void,
  onError?: (error: Error) => void
) => {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notifications: Notification[] = snapshot.docs
          .map(doc => {
            const data = doc.data();
            // Filter out deleted notifications in client-side
            if (data.deleted === true) return null;
            
            return {
              id: doc.id,
              type: data.type || 'info',
              title: data.title,
              message: data.message,
              isRead: data.isRead || false,
              timestamp: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
              actionLink: data.actionLink || data.link || ''
            };
          })
          .filter(n => n !== null) as Notification[];
        onUpdate(notifications);
      },
      (error) => {
        console.error('[NotificationService] Error subscribing to notifications:', error);
        if (onError) onError(error);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('[NotificationService] Error setting up notification subscription:', error);
    if (onError) onError(error as Error);
    return () => {};
  }
};

// Get notifications once (non-realtime)
export const getNotifications = async (userId: string): Promise<Notification[]> => {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(doc => {
        const data = doc.data();
        // Filter out deleted notifications
        if (data.deleted === true) return null;
        
        return {
          id: doc.id,
          type: data.type || 'info',
          title: data.title,
          message: data.message,
          isRead: data.isRead || false,
          timestamp: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          actionLink: data.actionLink || data.link || ''
        };
      })
      .filter(n => n !== null) as Notification[];
  } catch (error) {
    console.error('[NotificationService] Error fetching notifications:', error);
    return [];
  }
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      isRead: true,
      readAt: Timestamp.now()
    });
  } catch (error) {
    console.error('[NotificationService] Error marking notification as read:', error);
    throw error;
  }
};

// Mark all notifications as read for a user
export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      where('isRead', '==', false)
    );

    const snapshot = await getDocs(q);
    const updatePromises = snapshot.docs.map(doc => 
      updateDoc(doc.ref, {
        isRead: true,
        readAt: Timestamp.now()
      })
    );

    await Promise.all(updatePromises);
  } catch (error) {
    console.error('[NotificationService] Error marking all notifications as read:', error);
    throw error;
  }
};

// Create a new notification
export const createNotification = async (
  userId: string,
  notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>
): Promise<string> => {
  try {
    const notificationsRef = collection(db, 'notifications');
    const docRef = await addDoc(notificationsRef, {
      userId,
      type: notification.type || 'SYSTEM',
      title: notification.title,
      message: notification.message,
      isRead: false,
      createdAt: Timestamp.now(),
      actionLink: notification.actionLink
    });

    return docRef.id;
  } catch (error) {
    console.error('[NotificationService] Error creating notification:', error);
    throw error;
  }
};

// Get unread count (for badges)
export const getUnreadCount = async (userId: string): Promise<number> => {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      where('isRead', '==', false)
    );

    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('[NotificationService] Error getting unread count:', error);
    return 0;
  }
};

// Delete a single notification
export const deleteNotification = async (notificationId: string): Promise<void> => {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      deleted: true,
      deletedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('[NotificationService] Error deleting notification:', error);
    throw error;
  }
};

// Delete all notifications for a user
export const deleteAllNotifications = async (userId: string): Promise<void> => {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId)
    );

    const snapshot = await getDocs(q);
    const deletePromises = snapshot.docs.map(doc => 
      updateDoc(doc.ref, {
        deleted: true,
        deletedAt: Timestamp.now()
      })
    );

    await Promise.all(deletePromises);
  } catch (error) {
    console.error('[NotificationService] Error deleting all notifications:', error);
    throw error;
  }
};
