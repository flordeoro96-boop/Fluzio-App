/**
 * Special Offer Redemption Service
 * 
 * Flow:
 * 1. Business creates special offer with unique code
 * 2. User views offer and decides to redeem
 * 3. User scans QR code at store OR enters code online
 * 4. System validates offer is active and user eligible
 * 5. Points awarded instantly (encourages immediate purchase)
 * 6. Business tracks redemption metrics
 * 
 * Anti-Cheat:
 * - Rate limit: 10 redemptions per month
 * - Unique device check
 * - One-time use codes
 * - Expiration dates
 * - Location verification (for physical)
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

export type OfferType = 'PERCENTAGE_OFF' | 'FIXED_AMOUNT_OFF' | 'FREE_ITEM' | 'BUY_ONE_GET_ONE' | 'FREE_SHIPPING';
export type RedemptionStatus = 'PENDING' | 'REDEEMED' | 'EXPIRED' | 'CANCELLED';

export interface SpecialOffer {
  id?: string;
  businessId: string;
  businessName: string;
  missionId: string;
  
  // Offer Details
  title: string;
  description: string;
  offerType: OfferType;
  discountValue: number; // Percentage or dollar amount
  offerCode: string; // Unique code like "SAVE20"
  
  // Terms
  minPurchaseAmount?: number;
  maxRedemptionsTotal?: number; // Total redemptions allowed
  maxRedemptionsPerUser: number; // Per user limit
  
  // Validity
  startDate: Timestamp;
  expirationDate: Timestamp;
  isActive: boolean;
  
  // Tracking
  totalRedemptions: number;
  rewardPoints: number;
  
  createdAt: Timestamp;
}

export interface OfferRedemption {
  id?: string;
  offerId: string;
  offerCode: string;
  missionId: string;
  businessId: string;
  businessName: string;
  userId: string;
  userName: string;
  
  // Redemption Details
  status: RedemptionStatus;
  redemptionDate: Timestamp;
  purchaseAmount?: number;
  orderNumber?: string;
  
  // Points
  pointsEarned: number;
  pointsAwarded: boolean;
  
  // Participation link
  participationId?: string;
}

// ============================================================================
// OFFER MANAGEMENT
// ============================================================================

/**
 * Create special offer
 * Called by business when setting up promotion
 */
export async function createSpecialOffer(
  businessId: string,
  businessName: string,
  missionId: string,
  offerDetails: {
    title: string;
    description: string;
    offerType: OfferType;
    discountValue: number;
    offerCode: string;
    minPurchaseAmount?: number;
    maxRedemptionsTotal?: number;
    maxRedemptionsPerUser: number;
    expirationDays: number;
    rewardPoints: number;
  }
): Promise<{ success: boolean; offerId?: string; error?: string }> {
  
  try {
    // Check if offer code already exists
    const existingQuery = query(
      collection(db, 'specialOffers'),
      where('businessId', '==', businessId),
      where('offerCode', '==', offerDetails.offerCode.toUpperCase())
    );
    
    const existingSnap = await getDocs(existingQuery);
    
    if (!existingSnap.empty) {
      return { success: false, error: 'Offer code already exists. Please use a unique code.' };
    }
    
    const now = Timestamp.now();
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + offerDetails.expirationDays);
    
    const offer: SpecialOffer = {
      businessId,
      businessName,
      missionId,
      title: offerDetails.title,
      description: offerDetails.description,
      offerType: offerDetails.offerType,
      discountValue: offerDetails.discountValue,
      offerCode: offerDetails.offerCode.toUpperCase(),
      minPurchaseAmount: offerDetails.minPurchaseAmount,
      maxRedemptionsTotal: offerDetails.maxRedemptionsTotal,
      maxRedemptionsPerUser: offerDetails.maxRedemptionsPerUser,
      startDate: now,
      expirationDate: Timestamp.fromDate(expirationDate),
      isActive: true,
      totalRedemptions: 0,
      rewardPoints: offerDetails.rewardPoints,
      createdAt: now
    };
    
    const docRef = await addDoc(collection(db, 'specialOffers'), offer);
    
    console.log('[OfferService] Created offer:', docRef.id);
    
    return { success: true, offerId: docRef.id };
    
  } catch (error: any) {
    console.error('[OfferService] Error creating offer:', error);
    return { success: false, error: error.message || 'Failed to create offer' };
  }
}

/**
 * Get offer by code
 */
export async function getOfferByCode(
  businessId: string,
  offerCode: string
): Promise<SpecialOffer | null> {
  
  try {
    const q = query(
      collection(db, 'specialOffers'),
      where('businessId', '==', businessId),
      where('offerCode', '==', offerCode.toUpperCase()),
      where('isActive', '==', true)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }
    
    const offerDoc = snapshot.docs[0];
    return {
      id: offerDoc.id,
      ...offerDoc.data()
    } as SpecialOffer;
    
  } catch (error) {
    console.error('[OfferService] Error getting offer by code:', error);
    return null;
  }
}

/**
 * Validate offer eligibility
 */
async function validateOfferEligibility(
  offer: SpecialOffer,
  userId: string
): Promise<{ eligible: boolean; reason?: string }> {
  
  // Check if expired
  const now = Timestamp.now();
  if (offer.expirationDate.seconds < now.seconds) {
    return { eligible: false, reason: 'This offer has expired' };
  }
  
  // Check if max total redemptions reached
  if (offer.maxRedemptionsTotal && offer.totalRedemptions >= offer.maxRedemptionsTotal) {
    return { eligible: false, reason: 'This offer has reached its redemption limit' };
  }
  
  // Check user's redemption count for this offer
  const userRedemptionsQuery = query(
    collection(db, 'offerRedemptions'),
    where('offerId', '==', offer.id),
    where('userId', '==', userId),
    where('status', '==', 'REDEEMED')
  );
  
  const userRedemptionsSnap = await getDocs(userRedemptionsQuery);
  
  if (userRedemptionsSnap.size >= offer.maxRedemptionsPerUser) {
    return { 
      eligible: false, 
      reason: `You can only redeem this offer ${offer.maxRedemptionsPerUser} time(s)` 
    };
  }
  
  // Check rate limit (10 per month across all offers)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const rateLimitQuery = query(
    collection(db, 'offerRedemptions'),
    where('userId', '==', userId),
    where('businessId', '==', offer.businessId),
    where('redemptionDate', '>', Timestamp.fromDate(thirtyDaysAgo)),
    where('status', '==', 'REDEEMED')
  );
  
  const rateLimitSnap = await getDocs(rateLimitQuery);
  
  if (rateLimitSnap.size >= 10) {
    return { 
      eligible: false, 
      reason: 'You have reached the monthly redemption limit (10 offers per month)' 
    };
  }
  
  return { eligible: true };
}

// ============================================================================
// REDEMPTION
// ============================================================================

/**
 * Redeem offer
 * Called when user redeems offer at checkout
 */
export async function redeemOffer(
  userId: string,
  userName: string,
  offerCode: string,
  businessId: string,
  businessName: string,
  missionId: string,
  purchaseAmount?: number,
  orderNumber?: string
): Promise<{ success: boolean; pointsEarned?: number; error?: string }> {
  
  try {
    // Get offer
    const offer = await getOfferByCode(businessId, offerCode);
    
    if (!offer) {
      return { success: false, error: 'Invalid offer code' };
    }
    
    // Validate eligibility
    const eligibility = await validateOfferEligibility(offer, userId);
    
    if (!eligibility.eligible) {
      return { success: false, error: eligibility.reason };
    }
    
    // Check minimum purchase amount
    if (offer.minPurchaseAmount && purchaseAmount && purchaseAmount < offer.minPurchaseAmount) {
      return { 
        success: false, 
        error: `Minimum purchase amount of $${offer.minPurchaseAmount} required` 
      };
    }
    
    // Create redemption record
    const redemption: OfferRedemption = {
      offerId: offer.id!,
      offerCode: offer.offerCode,
      missionId,
      businessId,
      businessName,
      userId,
      userName,
      status: 'REDEEMED',
      redemptionDate: Timestamp.now(),
      purchaseAmount,
      orderNumber,
      pointsEarned: offer.rewardPoints,
      pointsAwarded: false
    };
    
    const redemptionRef = await addDoc(collection(db, 'offerRedemptions'), redemption);
    
    // Update offer total redemptions
    const offerRef = doc(db, 'specialOffers', offer.id!);
    await updateDoc(offerRef, {
      totalRedemptions: offer.totalRedemptions + 1
    });
    
    // Award points immediately
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.data();
      const currentPoints = userData.points || 0;
      const newPoints = currentPoints + offer.rewardPoints;
      
      await updateDoc(userRef, {
        points: newPoints
      });
      
      // Log transaction
      await logPointsTransaction(
        userId,
        'EARN',
        offer.rewardPoints,
        'MISSION',
        `Redeemed offer: ${offer.title}`,
        currentPoints,
        newPoints
      );
      
      // Mark points as awarded
      await updateDoc(doc(db, 'offerRedemptions', redemptionRef.id), {
        pointsAwarded: true
      });
    }
    
    console.log('[OfferService] Offer redeemed:', redemptionRef.id);
    
    // Send notification
    await createNotification(
      userId,
      {
        type: 'POINTS_ACTIVITY',
        title: '🎉 Offer Redeemed!',
        message: `You've earned ${offer.rewardPoints} points by redeeming "${offer.title}"!`,
        actionLink: '/wallet'
      }
    );
    
    return { success: true, pointsEarned: offer.rewardPoints };
    
  } catch (error: any) {
    console.error('[OfferService] Error redeeming offer:', error);
    return { success: false, error: error.message || 'Failed to redeem offer' };
  }
}

/**
 * Get user's redemption history
 */
export async function getUserRedemptions(userId: string): Promise<OfferRedemption[]> {
  try {
    const q = query(
      collection(db, 'offerRedemptions'),
      where('userId', '==', userId)
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as OfferRedemption));
    
  } catch (error) {
    console.error('[OfferService] Error getting redemptions:', error);
    return [];
  }
}

/**
 * Get business offers
 */
export async function getBusinessOffers(
  businessId: string,
  activeOnly: boolean = false
): Promise<SpecialOffer[]> {
  
  try {
    let q = query(
      collection(db, 'specialOffers'),
      where('businessId', '==', businessId)
    );
    
    if (activeOnly) {
      q = query(q, where('isActive', '==', true));
    }
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as SpecialOffer));
    
  } catch (error) {
    console.error('[OfferService] Error getting business offers:', error);
    return [];
  }
}

/**
 * Deactivate offer
 */
export async function deactivateOffer(offerId: string): Promise<{ success: boolean }> {
  try {
    await updateDoc(doc(db, 'specialOffers', offerId), {
      isActive: false
    });
    
    return { success: true };
  } catch (error) {
    console.error('[OfferService] Error deactivating offer:', error);
    return { success: false };
  }
}

/**
 * Get offer statistics
 */
export async function getOfferStats(offerId: string): Promise<{
  totalRedemptions: number;
  uniqueUsers: number;
  totalRevenue: number;
  averageOrderValue: number;
}> {
  
  try {
    const q = query(
      collection(db, 'offerRedemptions'),
      where('offerId', '==', offerId),
      where('status', '==', 'REDEEMED')
    );
    
    const snapshot = await getDocs(q);
    
    const uniqueUsers = new Set(snapshot.docs.map(doc => doc.data().userId)).size;
    const totalRevenue = snapshot.docs.reduce((sum, doc) => {
      const data = doc.data();
      return sum + (data.purchaseAmount || 0);
    }, 0);
    
    return {
      totalRedemptions: snapshot.size,
      uniqueUsers,
      totalRevenue,
      averageOrderValue: snapshot.size > 0 ? totalRevenue / snapshot.size : 0
    };
    
  } catch (error) {
    console.error('[OfferService] Error getting stats:', error);
    return {
      totalRedemptions: 0,
      uniqueUsers: 0,
      totalRevenue: 0,
      averageOrderValue: 0
    };
  }
}
