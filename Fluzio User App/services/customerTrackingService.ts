import { db } from './apiService';
import { collection, doc, setDoc, getDoc, getDocs, query, where, increment, serverTimestamp, Timestamp } from './firestoreCompat';
import { notifyCheckInMilestone, notifyNewCustomer, notifyCustomerCheckIn } from './notificationServiceEnhanced';

/**
 * Smart Customer Tracking Service
 * Tracks all customer interactions with businesses to identify real customers
 */

export interface CustomerInteraction {
  userId: string;
  businessId: string;
  checkIns: number; // Number of times user viewed/visited business
  lastCheckIn: string; // ISO timestamp
  firstCheckIn: string; // ISO timestamp
  missionsCompleted: number;
  isFollowing: boolean;
  isFavorited: boolean;
  hasMessaged: boolean;
  totalSpent?: number; // For future e-commerce integration
}

export interface CustomerQualification {
  isQualified: boolean;
  reason: string;
  checkIns: number;
  missionsCompleted: number;
  engagementScore: number; // 0-100
}

/**
 * Track a check-in when user is physically near the business (within 250m)
 * Smart logic: Only counts if within 250m AND 30+ minutes since last check-in
 * Awards points: 1st check-in = +10, 5th = +25, 10th = +50
 */
export async function trackCheckIn(
  userId: string, 
  businessId: string, 
  userLat: number, 
  userLng: number, 
  businessLat: number, 
  businessLng: number
): Promise<{ success: boolean; checkInCount: number; points?: number; message?: string }> {
  try {
    // Calculate distance in meters
    const distance = calculateDistanceInMeters(userLat, userLng, businessLat, businessLng);
    
    // Must be within 250m to check in
    if (distance > 250) {
      return { 
        success: false, 
        checkInCount: 0, 
        message: `Too far away (${Math.round(distance)}m). Must be within 250m to check in.`
      };
    }

    const interactionRef = doc(db, 'customerInteractions', `${userId}_${businessId}`);
    const interactionDoc = await getDoc(interactionRef);

    const now = new Date();
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

    if (interactionDoc.exists()) {
      const data = interactionDoc.data();
      const lastCheckIn = data.lastCheckIn?.toDate?.() || new Date(data.lastCheckIn);

      // Only count if 30+ minutes since last check-in
      if (lastCheckIn < thirtyMinutesAgo) {
        const newCheckInCount = (data.checkIns || 0) + 1;
        
        // Calculate points reward based on milestone
        let pointsReward = 10; // Default for regular check-ins
        if (newCheckInCount === 5) {
          pointsReward = 25; // Loyal customer
        } else if (newCheckInCount === 10) {
          pointsReward = 50; // VIP
        } else if (newCheckInCount > 10 && newCheckInCount % 10 === 0) {
          pointsReward = 50; // Every 10th check-in
        }

        await setDoc(interactionRef, {
          userId,
          businessId,
          checkIns: increment(1),
          lastCheckIn: serverTimestamp(),
          lastCheckInDistance: Math.round(distance),
          updatedAt: serverTimestamp()
        }, { merge: true });

        // Award points to user
        await awardCheckInPoints(userId, pointsReward, newCheckInCount);

        // Send notification for milestones (5th, 10th, 25th, etc.)
        if (newCheckInCount === 5 || newCheckInCount === 10 || (newCheckInCount > 10 && newCheckInCount % 10 === 0)) {
          try {
            const businessDoc = await getDoc(doc(db, 'users', businessId));
            const businessName = businessDoc.data()?.name || 'this business';
            await notifyCheckInMilestone(userId, businessId, businessName, newCheckInCount, pointsReward);
            
            // Notify business about active customer
            if (newCheckInCount === 5 || newCheckInCount === 10 || newCheckInCount === 25) {
              const userDoc = await getDoc(doc(db, 'users', userId));
              const userName = userDoc.data()?.name || 'A customer';
              await notifyCustomerCheckIn(businessId, userId, userName, newCheckInCount);
            }
          } catch (error) {
            console.error('Error sending check-in notification:', error);
          }
        }

        return { 
          success: true, 
          checkInCount: newCheckInCount,
          points: pointsReward,
          message: `Check-in #${newCheckInCount} successful! +${pointsReward} points`
        };
      } else {
        const minutesLeft = Math.ceil((lastCheckIn.getTime() + 30 * 60 * 1000 - now.getTime()) / 60000);
        return { 
          success: false, 
          checkInCount: data.checkIns || 0,
          message: `Please wait ${minutesLeft} more minute${minutesLeft > 1 ? 's' : ''} before checking in again.`
        };
      }
    } else {
      // First check-in ever
      await setDoc(interactionRef, {
        userId,
        businessId,
        checkIns: 1,
        firstCheckIn: serverTimestamp(),
        lastCheckIn: serverTimestamp(),
        lastCheckInDistance: Math.round(distance),
        missionsCompleted: 0,
        isFollowing: false,
        isFavorited: false,
        hasMessaged: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Award first check-in points
      await awardCheckInPoints(userId, 10, 1);

      return { 
        success: true, 
        checkInCount: 1,
        points: 10,
        message: 'First check-in! +10 points'
      };
    }
  } catch (error) {
    console.error('Error tracking check-in:', error);
    return { success: false, checkInCount: 0, message: 'Error processing check-in' };
  }
}

/**
 * Calculate distance between two coordinates in meters
 */
function calculateDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Award points to user for check-in and update level
 */
async function awardCheckInPoints(userId: string, points: number, checkInCount: number): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.data();
      const currentPoints = userData.points || 0;
      const newPoints = currentPoints + points;
      const newLevel = Math.floor(Math.sqrt(newPoints / 100)) + 1;
      
      await setDoc(userRef, {
        points: newPoints,
        level: newLevel,
        lastCheckInAt: serverTimestamp()
      }, { merge: true });
      
      console.log(`[CheckIn] User ${userId} earned ${points} points (check-in #${checkInCount}). Total: ${newPoints} points, Level ${newLevel}`);
    }
  } catch (error) {
    console.error('Error awarding check-in points:', error);
  }
}

/**
 * Update mission completion count
 */
export async function trackMissionCompletion(userId: string, businessId: string): Promise<void> {
  try {
    const interactionRef = doc(db, 'customerInteractions', `${userId}_${businessId}`);
    
    await setDoc(interactionRef, {
      userId,
      businessId,
      missionsCompleted: increment(1),
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('Error tracking mission completion:', error);
  }
}

/**
 * Update follow status
 */
export async function trackFollow(userId: string, businessId: string, isFollowing: boolean): Promise<void> {
  try {
    const interactionRef = doc(db, 'customerInteractions', `${userId}_${businessId}`);
    
    await setDoc(interactionRef, {
      userId,
      businessId,
      isFollowing,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('Error tracking follow:', error);
  }
}

/**
 * Update favorite status
 */
export async function trackFavorite(userId: string, businessId: string, isFavorited: boolean): Promise<void> {
  try {
    const interactionRef = doc(db, 'customerInteractions', `${userId}_${businessId}`);
    
    await setDoc(interactionRef, {
      userId,
      businessId,
      isFavorited,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('Error tracking favorite:', error);
  }
}

/**
 * Update message status
 */
export async function trackMessage(userId: string, businessId: string): Promise<void> {
  try {
    const interactionRef = doc(db, 'customerInteractions', `${userId}_${businessId}`);
    
    await setDoc(interactionRef, {
      userId,
      businessId,
      hasMessaged: true,
      lastMessageAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('Error tracking message:', error);
  }
}

/**
 * Check if user qualifies as a customer
 * Physical/Hybrid: 2+ check-ins OR 1+ mission completed
 * Online: Following OR 1+ mission completed OR has messaged
 */
export async function checkCustomerQualification(
  userId: string, 
  businessId: string, 
  businessMode: 'PHYSICAL' | 'ONLINE' | 'HYBRID'
): Promise<CustomerQualification> {
  try {
    const interactionRef = doc(db, 'customerInteractions', `${userId}_${businessId}`);
    const interactionDoc = await getDoc(interactionRef);

    if (!interactionDoc.exists()) {
      return {
        isQualified: false,
        reason: 'No interactions',
        checkIns: 0,
        missionsCompleted: 0,
        engagementScore: 0
      };
    }

    const data = interactionDoc.data();
    const checkIns = data.checkIns || 0;
    const missionsCompleted = data.missionsCompleted || 0;
    const isFollowing = data.isFollowing || false;
    const hasMessaged = data.hasMessaged || false;

    let isQualified = false;
    let reason = '';
    let engagementScore = 0;

    if (businessMode === 'PHYSICAL' || businessMode === 'HYBRID') {
      // Physical/Hybrid: Need 2+ check-ins OR 1+ mission
      if (checkIns >= 2) {
        isQualified = true;
        reason = `${checkIns} visits`;
        engagementScore = Math.min(100, checkIns * 15 + missionsCompleted * 30);
      } else if (missionsCompleted >= 1) {
        isQualified = true;
        reason = `${missionsCompleted} mission${missionsCompleted > 1 ? 's' : ''} completed`;
        engagementScore = Math.min(100, missionsCompleted * 40 + checkIns * 10);
      } else {
        reason = `Only ${checkIns} visit${checkIns !== 1 ? 's' : ''} (need 2+)`;
        engagementScore = checkIns * 10;
      }
    } else {
      // Online: Following OR mission OR messaged
      if (missionsCompleted >= 1) {
        isQualified = true;
        reason = `${missionsCompleted} mission${missionsCompleted > 1 ? 's' : ''} completed`;
        engagementScore = Math.min(100, missionsCompleted * 50);
      } else if (isFollowing) {
        isQualified = true;
        reason = 'Following';
        engagementScore = 30;
      } else if (hasMessaged) {
        isQualified = true;
        reason = 'Has messaged';
        engagementScore = 25;
      } else {
        reason = 'No meaningful engagement';
        engagementScore = 5;
      }
    }

    return {
      isQualified,
      reason,
      checkIns,
      missionsCompleted,
      engagementScore
    };
  } catch (error) {
    console.error('Error checking customer qualification:', error);
    return {
      isQualified: false,
      reason: 'Error',
      checkIns: 0,
      missionsCompleted: 0,
      engagementScore: 0
    };
  }
}

/**
 * Get all qualified customers for a business
 */
export async function getQualifiedCustomers(businessId: string, businessMode: 'PHYSICAL' | 'ONLINE' | 'HYBRID'): Promise<CustomerInteraction[]> {
  try {
    const interactionsRef = collection(db, 'customerInteractions');
    const q = query(interactionsRef, where('businessId', '==', businessId));
    const snapshot = await getDocs(q);

    const qualifiedCustomers: CustomerInteraction[] = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const userId = data.userId;
      
      const qualification = await checkCustomerQualification(userId, businessId, businessMode);
      
      if (qualification.isQualified) {
        qualifiedCustomers.push({
          userId: data.userId,
          businessId: data.businessId,
          checkIns: data.checkIns || 0,
          lastCheckIn: data.lastCheckIn?.toDate?.()?.toISOString() || new Date(data.lastCheckIn).toISOString(),
          firstCheckIn: data.firstCheckIn?.toDate?.()?.toISOString() || new Date(data.firstCheckIn).toISOString(),
          missionsCompleted: data.missionsCompleted || 0,
          isFollowing: data.isFollowing || false,
          isFavorited: data.isFavorited || false,
          hasMessaged: data.hasMessaged || false
        });
      }
    }

    // Sort by engagement score (missions * 2 + checkIns)
    return qualifiedCustomers.sort((a, b) => {
      const scoreA = a.missionsCompleted * 2 + a.checkIns;
      const scoreB = b.missionsCompleted * 2 + b.checkIns;
      return scoreB - scoreA;
    });
  } catch (error) {
    console.error('Error getting qualified customers:', error);
    return [];
  }
}
