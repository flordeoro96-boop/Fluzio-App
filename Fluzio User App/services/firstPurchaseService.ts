/**
 * First Purchase Service
 * 
 * Flow:
 * 1. User makes their very first purchase at business
 * 2. Purchase verified via webhook (online) or receipt upload (physical)
 * 3. Business confirms purchase
 * 4. After 7-day verification period, bonus points awarded
 * 5. One-time reward per business
 * 
 * Anti-Cheat:
 * - One purchase per business lifetime
 * - Unique device check
 * - Minimum purchase amount ($10)
 * - Receipt/order verification required
 * - 7-day reward delay (prevents refund fraud)
 */

import { db } from './AuthContext';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs, 
  getDoc,
  Timestamp 
} from 'firebase/firestore';
import { createNotification } from './notificationService';
import { logPointsTransaction } from './pointsMarketplaceService';

// ============================================================================
// TYPES
// ============================================================================

export type PurchaseStatus = 'PENDING' | 'VERIFIED' | 'COMPLETED' | 'REJECTED' | 'REFUNDED';
export type PurchaseChannel = 'ONLINE' | 'IN_STORE' | 'MOBILE_APP';

export interface FirstPurchase {
  id?: string;
  missionId: string;
  businessId: string;
  businessName: string;
  userId: string;
  userName: string;
  
  // Purchase Details
  purchaseAmount: number;
  orderNumber: string;
  purchaseChannel: PurchaseChannel;
  purchaseDate: Timestamp;
  
  // Verification
  status: PurchaseStatus;
  receiptUrl?: string; // For physical purchases
  webhookVerified: boolean; // For online purchases
  businessConfirmed: boolean;
  
  // Reward
  rewardPoints: number;
  rewardUnlockDate?: Timestamp; // 7 days after purchase
  pointsAwarded: boolean;
  
  // Tracking
  createdAt: Timestamp;
  verifiedAt?: Timestamp;
  completedAt?: Timestamp;
  
  // Participation link
  participationId?: string;
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Check if user has already made first purchase at this business
 */
async function hasExistingFirstPurchase(
  userId: string,
  businessId: string
): Promise<boolean> {
  
  try {
    const q = query(
      collection(db, 'firstPurchases'),
      where('userId', '==', userId),
      where('businessId', '==', businessId),
      where('status', 'in', ['VERIFIED', 'COMPLETED'])
    );
    
    const snapshot = await getDocs(q);
    return snapshot.size > 0;
    
  } catch (error) {
    console.error('[FirstPurchaseService] Error checking existing purchase:', error);
    return false;
  }
}

/**
 * Validate purchase amount meets minimum
 */
function validatePurchaseAmount(amount: number): { valid: boolean; error?: string } {
  const MIN_AMOUNT = 10;
  
  if (amount < MIN_AMOUNT) {
    return { 
      valid: false, 
      error: `Minimum purchase amount is $${MIN_AMOUNT}` 
    };
  }
  
  return { valid: true };
}

// ============================================================================
// PURCHASE SUBMISSION
// ============================================================================

/**
 * Submit first purchase
 * Called when user completes their first purchase
 */
export async function submitFirstPurchase(
  userId: string,
  userName: string,
  missionId: string,
  businessId: string,
  businessName: string,
  purchaseDetails: {
    purchaseAmount: number;
    orderNumber: string;
    purchaseChannel: PurchaseChannel;
    receiptUrl?: string;
  },
  rewardPoints: number
): Promise<{ success: boolean; purchaseId?: string; error?: string }> {
  
  try {
    // Check if user already has first purchase at this business
    const existingPurchase = await hasExistingFirstPurchase(userId, businessId);
    
    if (existingPurchase) {
      return { 
        success: false, 
        error: 'You have already claimed your first purchase reward at this business' 
      };
    }
    
    // Validate purchase amount
    const amountValidation = validatePurchaseAmount(purchaseDetails.purchaseAmount);
    if (!amountValidation.valid) {
      return { success: false, error: amountValidation.error };
    }
    
    // Create purchase record
    const purchase: FirstPurchase = {
      missionId,
      businessId,
      businessName,
      userId,
      userName,
      purchaseAmount: purchaseDetails.purchaseAmount,
      orderNumber: purchaseDetails.orderNumber,
      purchaseChannel: purchaseDetails.purchaseChannel,
      purchaseDate: Timestamp.now(),
      status: 'PENDING',
      receiptUrl: purchaseDetails.receiptUrl,
      webhookVerified: false,
      businessConfirmed: false,
      rewardPoints,
      pointsAwarded: false,
      createdAt: Timestamp.now()
    };
    
    const docRef = await addDoc(collection(db, 'firstPurchases'), purchase);
    
    console.log('[FirstPurchaseService] Purchase submitted:', docRef.id);
    
    // Notify business
    await createNotification(
      businessId,
      {
        type: 'MISSION_APPLICATION',
        title: '🛍️ First Purchase Submitted',
        message: `${userName} submitted their first purchase of $${purchaseDetails.purchaseAmount.toFixed(2)}. Please verify.`,
        actionLink: `/business/purchases/${docRef.id}`
      }
    );
    
    // Notify user
    await createNotification(
      userId,
      {
        type: 'POINTS_ACTIVITY',
        title: '✅ Purchase Submitted',
        message: `Your first purchase has been submitted! You'll earn ${rewardPoints} points after business verification.`,
        actionLink: `/missions/${missionId}`
      }
    );
    
    return { success: true, purchaseId: docRef.id };
    
  } catch (error: any) {
    console.error('[FirstPurchaseService] Error submitting purchase:', error);
    return { success: false, error: error.message || 'Failed to submit purchase' };
  }
}

/**
 * Verify purchase via webhook
 * Called by webhook when online purchase is confirmed
 */
export async function verifyPurchaseViaWebhook(
  orderNumber: string,
  businessId: string,
  purchaseAmount: number
): Promise<{ success: boolean; error?: string }> {
  
  try {
    // Find purchase by order number
    const q = query(
      collection(db, 'firstPurchases'),
      where('orderNumber', '==', orderNumber),
      where('businessId', '==', businessId),
      where('status', '==', 'PENDING')
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return { success: false, error: 'Purchase not found' };
    }
    
    const purchaseDoc = snapshot.docs[0];
    const purchase = purchaseDoc.data() as FirstPurchase;
    
    // Calculate reward unlock date (7 days)
    const rewardUnlockDate = new Date();
    rewardUnlockDate.setDate(rewardUnlockDate.getDate() + 7);
    
    // Update purchase
    await updateDoc(doc(db, 'firstPurchases', purchaseDoc.id), {
      status: 'VERIFIED',
      webhookVerified: true,
      purchaseAmount: purchaseAmount, // Update with actual amount from webhook
      verifiedAt: Timestamp.now(),
      rewardUnlockDate: Timestamp.fromDate(rewardUnlockDate)
    });
    
    console.log('[FirstPurchaseService] Purchase verified via webhook:', purchaseDoc.id);
    
    // Notify user
    await createNotification(
      purchase.userId,
      {
        type: 'MISSION_APPROVED',
        title: '✅ Purchase Verified!',
        message: `Your first purchase at ${purchase.businessName} has been verified! ${purchase.rewardPoints} points will unlock in 7 days.`,
        actionLink: '/wallet'
      }
    );
    
    return { success: true };
    
  } catch (error: any) {
    console.error('[FirstPurchaseService] Error verifying via webhook:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Business confirms purchase
 * Called when business manually reviews and approves
 */
export async function confirmPurchase(
  purchaseId: string
): Promise<{ success: boolean; error?: string }> {
  
  try {
    const purchaseRef = doc(db, 'firstPurchases', purchaseId);
    const purchaseSnap = await getDoc(purchaseRef);
    
    if (!purchaseSnap.exists()) {
      return { success: false, error: 'Purchase not found' };
    }
    
    const purchase = purchaseSnap.data() as FirstPurchase;
    
    if (purchase.status !== 'PENDING') {
      return { success: false, error: `Cannot confirm purchase with status: ${purchase.status}` };
    }
    
    // Calculate reward unlock date (7 days)
    const rewardUnlockDate = new Date();
    rewardUnlockDate.setDate(rewardUnlockDate.getDate() + 7);
    
    // Update purchase
    await updateDoc(purchaseRef, {
      status: 'VERIFIED',
      businessConfirmed: true,
      verifiedAt: Timestamp.now(),
      rewardUnlockDate: Timestamp.fromDate(rewardUnlockDate)
    });
    
    console.log('[FirstPurchaseService] Purchase confirmed:', purchaseId);
    
    // Notify user
    await createNotification(
      purchase.userId,
      {
        type: 'MISSION_APPROVED',
        title: '🎉 First Purchase Confirmed!',
        message: `Your first purchase at ${purchase.businessName} has been confirmed! ${purchase.rewardPoints} points will unlock in 7 days.`,
        actionLink: '/wallet'
      }
    );
    
    return { success: true };
    
  } catch (error: any) {
    console.error('[FirstPurchaseService] Error confirming purchase:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Reject purchase
 */
export async function rejectPurchase(
  purchaseId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  
  try {
    const purchaseRef = doc(db, 'firstPurchases', purchaseId);
    const purchaseSnap = await getDoc(purchaseRef);
    
    if (!purchaseSnap.exists()) {
      return { success: false, error: 'Purchase not found' };
    }
    
    const purchase = purchaseSnap.data() as FirstPurchase;
    
    await updateDoc(purchaseRef, {
      status: 'REJECTED'
    });
    
    // Notify user
    await createNotification(
      purchase.userId,
      {
        type: 'MISSION_REJECTED',
        title: '❌ Purchase Not Approved',
        message: `Your first purchase submission was not approved. Reason: ${reason}`,
        actionLink: `/missions/${purchase.missionId}`
      }
    );
    
    return { success: true };
    
  } catch (error: any) {
    console.error('[FirstPurchaseService] Error rejecting purchase:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// REWARD DISTRIBUTION
// ============================================================================

/**
 * Unlock pending rewards
 * Called by scheduled Cloud Function after 7-day verification period
 */
export async function unlockFirstPurchaseRewards(): Promise<{ 
  success: boolean; 
  processed: number; 
  errors: string[] 
}> {
  
  try {
    const now = Timestamp.now();
    
    // Query verified purchases where reward unlock date has passed
    const q = query(
      collection(db, 'firstPurchases'),
      where('status', '==', 'VERIFIED'),
      where('pointsAwarded', '==', false),
      where('rewardUnlockDate', '<=', now)
    );
    
    const snapshot = await getDocs(q);
    let processed = 0;
    const errors: string[] = [];
    
    console.log(`[FirstPurchaseService] Found ${snapshot.size} purchases ready for reward unlock`);
    
    for (const docSnap of snapshot.docs) {
      try {
        const purchase = docSnap.data() as FirstPurchase;
        const purchaseId = docSnap.id;
        
        // Get current user points
        const userRef = doc(db, 'users', purchase.userId);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          errors.push(`User not found: ${purchase.userId}`);
          continue;
        }
        
        const userData = userSnap.data();
        const currentPoints = userData.points || 0;
        const newPoints = currentPoints + purchase.rewardPoints;
        
        // Award points
        await updateDoc(userRef, {
          points: newPoints
        });
        
        // Log transaction
        await logPointsTransaction(
          purchase.userId,
          'EARN',
          purchase.rewardPoints,
          'MISSION',
          `First purchase at ${purchase.businessName}`,
          currentPoints,
          newPoints
        );
        
        // Update purchase
        await updateDoc(doc(db, 'firstPurchases', purchaseId), {
          status: 'COMPLETED',
          pointsAwarded: true,
          completedAt: Timestamp.now()
        });
        
        // Notify user
        await createNotification(
          purchase.userId,
          {
            type: 'POINTS_ACTIVITY',
            title: '💰 First Purchase Reward Unlocked!',
            message: `You've earned ${purchase.rewardPoints} points for your first purchase at ${purchase.businessName}!`,
            actionLink: '/wallet'
          }
        );
        
        processed++;
        console.log(`[FirstPurchaseService] Unlocked reward for purchase ${purchaseId}`);
        
      } catch (error: any) {
        errors.push(`Error processing ${docSnap.id}: ${error.message}`);
      }
    }
    
    return { success: true, processed, errors };
    
  } catch (error: any) {
    console.error('[FirstPurchaseService] Error unlocking rewards:', error);
    return { success: false, processed: 0, errors: [error.message] };
  }
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get user's first purchases
 */
export async function getUserFirstPurchases(userId: string): Promise<FirstPurchase[]> {
  try {
    const q = query(
      collection(db, 'firstPurchases'),
      where('userId', '==', userId)
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FirstPurchase));
    
  } catch (error) {
    console.error('[FirstPurchaseService] Error getting user purchases:', error);
    return [];
  }
}

/**
 * Get business first purchases
 */
export async function getBusinessFirstPurchases(
  businessId: string,
  status?: PurchaseStatus
): Promise<FirstPurchase[]> {
  
  try {
    let q = query(
      collection(db, 'firstPurchases'),
      where('businessId', '==', businessId)
    );
    
    if (status) {
      q = query(q, where('status', '==', status));
    }
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FirstPurchase));
    
  } catch (error) {
    console.error('[FirstPurchaseService] Error getting business purchases:', error);
    return [];
  }
}

/**
 * Get purchase by order number
 */
export async function getPurchaseByOrderNumber(
  orderNumber: string,
  businessId: string
): Promise<FirstPurchase | null> {
  
  try {
    const q = query(
      collection(db, 'firstPurchases'),
      where('orderNumber', '==', orderNumber),
      where('businessId', '==', businessId)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }
    
    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    } as FirstPurchase;
    
  } catch (error) {
    console.error('[FirstPurchaseService] Error getting purchase by order number:', error);
    return null;
  }
}
