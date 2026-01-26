import { collection, query, where, orderBy, getDocs, doc, updateDoc, Timestamp, limit } from '../firebase/firestoreCompat';
import { db } from '@/lib/firebase/client';
import { Notification } from '@/lib/types';

/**
 * Get all notifications (unread first)
 */
export async function getNotifications(limitCount: number = 50): Promise<Notification[]> {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      orderBy('read', 'asc'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        type: data.type,
        title: data.title,
        message: data.message,
        priority: data.priority || 'medium',
        read: data.read || false,
        countryCode: data.countryCode,
        countryName: data.countryName,
        firstUserId: data.firstUserId,
        firstUserName: data.firstUserName,
        needsReview: data.needsReview,
        createdAt: data.createdAt?.toDate() || new Date(),
        readAt: data.readAt?.toDate(),
        actionUrl: data.actionUrl,
      } as Notification;
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(): Promise<number> {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('read', '==', false)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return 0;
  }
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string): Promise<void> {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      read: true,
      readAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(): Promise<void> {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('read', '==', false)
    );
    
    const snapshot = await getDocs(q);
    const updates = snapshot.docs.map(doc => 
      updateDoc(doc.ref, {
        read: true,
        readAt: Timestamp.now(),
      })
    );
    
    await Promise.all(updates);
  } catch (error) {
    console.error('Error marking all as read:', error);
    throw error;
  }
}

/**
 * Get notifications that need review
 */
export async function getReviewNotifications(): Promise<Notification[]> {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('needsReview', '==', true),
      where('read', '==', false),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        type: data.type,
        title: data.title,
        message: data.message,
        priority: data.priority || 'high',
        read: data.read || false,
        countryCode: data.countryCode,
        countryName: data.countryName,
        firstUserId: data.firstUserId,
        firstUserName: data.firstUserName,
        needsReview: data.needsReview,
        createdAt: data.createdAt?.toDate() || new Date(),
        readAt: data.readAt?.toDate(),
        actionUrl: data.actionUrl,
      } as Notification;
    });
  } catch (error) {
    console.error('Error fetching review notifications:', error);
    return [];
  }
}
