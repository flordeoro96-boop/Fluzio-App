/**
 * Cloud Functions for Firebase - Push Notification Triggers
 * 
 * Deploy with: firebase deploy --only functions
 * 
 * These functions automatically send push notifications when certain
 * Firestore documents are created or updated.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

/**
 * Send push notification when a new notification document is created
 */
export const sendPushOnNotification = functions.firestore
  .document('notifications/{notificationId}')
  .onCreate(async (snapshot, context) => {
    const notification = snapshot.data();
    const userId = notification.userId;

    if (!userId) {
      console.log('No userId found in notification');
      return null;
    }

    try {
      // Get user's FCM tokens
      const userDoc = await admin.firestore().collection('users').doc(userId).get();
      const userData = userDoc.data();
      const fcmTokens = userData?.fcmTokens || [];

      if (fcmTokens.length === 0) {
        console.log('User has no FCM tokens');
        return null;
      }

      // Check notification preferences
      const prefsDoc = await admin.firestore()
        .collection('notificationPreferences')
        .doc(userId)
        .get();
      
      const prefs = prefsDoc.data();
      
      // Check if push notifications are enabled
      if (prefs) {
        const category = notification.category || 'system';
        if (prefs.categories?.[category]?.push === false) {
          console.log(`Push notifications disabled for ${category}`);
          return null;
        }

        // Check quiet hours
        if (prefs.quietHours?.enabled) {
          const now = new Date();
          const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
          const { startTime, endTime } = prefs.quietHours;

          let isQuietHour = false;
          if (startTime > endTime) {
            // Spans midnight
            isQuietHour = currentTime >= startTime || currentTime <= endTime;
          } else {
            isQuietHour = currentTime >= startTime && currentTime <= endTime;
          }

          if (isQuietHour) {
            console.log('Currently in quiet hours');
            return null;
          }
        }
      }

      // Prepare notification payload
      const payload = {
        notification: {
          title: notification.title || 'Fluzio',
          body: notification.message || 'You have a new notification',
          icon: '/logo.png',
          badge: '/badge.png',
        },
        data: {
          notificationId: context.params.notificationId,
          type: notification.type || 'SYSTEM',
          actionLink: notification.actionLink || '/',
          userId: userId,
          timestamp: new Date().toISOString()
        },
        android: {
          priority: 'high' as const,
          notification: {
            sound: 'default',
            channelId: 'fluzio_notifications'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1
            }
          }
        },
        webpush: {
          headers: {
            TTL: '86400' // 24 hours
          },
          notification: {
            icon: '/logo.png',
            badge: '/badge.png',
            requireInteraction: false,
            tag: notification.type || 'general'
          }
        }
      };

      // Send to all user's devices
      const messaging = admin.messaging();
      const responses = await Promise.allSettled(
        fcmTokens.map((token: string) => 
          messaging.send({
            token,
            ...payload
          })
        )
      );

      // Remove invalid tokens
      const invalidTokens: string[] = [];
      responses.forEach((response, index) => {
        if (response.status === 'rejected') {
          const error = response.reason;
          if (
            error.code === 'messaging/invalid-registration-token' ||
            error.code === 'messaging/registration-token-not-registered'
          ) {
            invalidTokens.push(fcmTokens[index]);
          }
        }
      });

      // Update user document to remove invalid tokens
      if (invalidTokens.length > 0) {
        await admin.firestore().collection('users').doc(userId).update({
          fcmTokens: admin.firestore.FieldValue.arrayRemove(...invalidTokens)
        });
        console.log(`Removed ${invalidTokens.length} invalid tokens`);
      }

      const successCount = responses.filter(r => r.status === 'fulfilled').length;
      console.log(`Sent notification to ${successCount}/${fcmTokens.length} devices`);

      return null;
    } catch (error) {
      console.error('Error sending push notification:', error);
      return null;
    }
  });

/**
 * Send notification when mission status changes
 */
export const sendMissionStatusNotification = functions.firestore
  .document('participations/{participationId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Check if status changed
    if (before.status === after.status) {
      return null;
    }

    const userId = after.userId;
    const missionId = after.missionId;

    if (!userId || !missionId) {
      return null;
    }

    try {
      // Get mission details
      const missionDoc = await admin.firestore().collection('missions').doc(missionId).get();
      const mission = missionDoc.data();

      if (!mission) {
        return null;
      }

      // Create notification based on status
      let title = '';
      let message = '';
      let type = 'MISSION_UPDATE';

      switch (after.status) {
        case 'approved':
          title = 'Mission Approved! 🎉';
          message = `Your submission for "${mission.title}" has been approved! Points have been added to your wallet.`;
          type = 'MISSION_APPROVED';
          break;
        case 'rejected':
          title = 'Mission Update';
          message = `Your submission for "${mission.title}" needs revision. Check the feedback for details.`;
          type = 'MISSION_REJECTED';
          break;
        case 'completed':
          title = 'Mission Completed!';
          message = `You completed "${mission.title}"! Waiting for business approval.`;
          type = 'MISSION_COMPLETED';
          break;
        default:
          return null;
      }

      // Create notification document (which will trigger sendPushOnNotification)
      await admin.firestore().collection('notifications').add({
        userId,
        type,
        title,
        message,
        category: 'missions',
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        actionLink: `/missions/${missionId}`,
        relatedId: missionId,
        relatedType: 'mission'
      });

      return null;
    } catch (error) {
      console.error('Error creating mission notification:', error);
      return null;
    }
  });

/**
 * Send notification for new messages
 */
export const sendMessageNotification = functions.firestore
  .document('conversations/{conversationId}/messages/{messageId}')
  .onCreate(async (snapshot, context) => {
    const message = snapshot.data();
    const conversationId = context.params.conversationId;

    try {
      // Get conversation to find recipient
      const convDoc = await admin.firestore()
        .collection('conversations')
        .doc(conversationId)
        .get();
      
      const conversation = convDoc.data();
      if (!conversation) {
        return null;
      }

      // Get sender info
      const senderDoc = await admin.firestore()
        .collection('users')
        .doc(message.senderId)
        .get();
      
      const sender = senderDoc.data();

      // Send notification to each participant except sender
      const recipientIds = conversation.participants.filter(
        (id: string) => id !== message.senderId
      );

      const notificationPromises = recipientIds.map((recipientId: string) =>
        admin.firestore().collection('notifications').add({
          userId: recipientId,
          type: 'MESSAGE',
          title: sender?.name || 'New Message',
          message: message.content.substring(0, 100),
          category: 'social',
          isRead: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          actionLink: `/messages/${conversationId}`,
          relatedId: conversationId,
          relatedType: 'conversation'
        })
      );

      await Promise.all(notificationPromises);
      return null;
    } catch (error) {
      console.error('Error creating message notification:', error);
      return null;
    }
  });

/**
 * Send notification for new rewards
 */
export const sendRewardNotification = functions.firestore
  .document('rewards/{rewardId}')
  .onCreate(async (snapshot, context) => {
    const reward = snapshot.data();

    // Only send if it's a new reward available to all (not user-specific)
    if (reward.userId) {
      return null; // Don't spam for individual redemptions
    }

    try {
      // Get business info
      const businessDoc = await admin.firestore()
        .collection('users')
        .doc(reward.businessId)
        .get();
      
      const business = businessDoc.data();

      // Get all users who follow this business or are nearby
      const usersSnapshot = await admin.firestore()
        .collection('users')
        .where('favorites', 'array-contains', reward.businessId)
        .limit(100) // Limit to avoid quota issues
        .get();

      const notificationPromises = usersSnapshot.docs.map(userDoc =>
        admin.firestore().collection('notifications').add({
          userId: userDoc.id,
          type: 'REWARD_AVAILABLE',
          title: `New Reward at ${business?.name || 'a business'}! 🎁`,
          message: `${reward.title} - ${reward.pointsCost} points`,
          category: 'rewards',
          isRead: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          actionLink: `/rewards/${context.params.rewardId}`,
          relatedId: context.params.rewardId,
          relatedType: 'reward'
        })
      );

      await Promise.all(notificationPromises);
      console.log(`Sent reward notification to ${notificationPromises.length} users`);
      
      return null;
    } catch (error) {
      console.error('Error creating reward notification:', error);
      return null;
    }
  });
