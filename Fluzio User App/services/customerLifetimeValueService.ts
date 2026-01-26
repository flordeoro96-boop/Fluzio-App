import { db } from './apiService';
import { collection, query, where, getDocs, doc, getDoc, Timestamp } from '../services/firestoreCompat';

/**
 * Customer Lifetime Value (CLV) Intelligence Service
 * Predicts customer value, identifies VIPs and at-risk customers
 */

export interface CustomerProfile {
  userId: string;
  businessId: string;
  totalCheckIns: number;
  totalMissionsCompleted: number;
  totalPointsEarned: number;
  totalSpent: number;
  firstVisit: Date;
  lastVisit: Date;
  averageVisitFrequency: number; // days between visits
  preferredCategories: string[];
  favoriteProducts: string[];
  lifetimeValue: number; // predicted CLV score (0-1000)
  customerTier: 'NEW' | 'REGULAR' | 'VIP' | 'CHAMPION' | 'AT_RISK' | 'CHURNED';
  churnRisk: number; // 0-100
  retentionScore: number; // 0-100
  nextExpectedVisit: Date;
}

export interface CustomerSegment {
  segment: string;
  count: number;
  avgLifetimeValue: number;
  characteristics: string[];
  suggestedActions: string[];
}

export interface RetentionAlert {
  userId: string;
  userName: string;
  userAvatar: string;
  tier: string;
  issue: string;
  daysSinceLastVisit: number;
  suggestedAction: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

/**
 * Calculate Customer Lifetime Value for a specific customer
 */
export async function calculateCustomerCLV(
  userId: string,
  businessId: string
): Promise<CustomerProfile | null> {
  try {
    // Get interaction data
    const interactionRef = doc(db, 'customerInteractions', `${userId}_${businessId}`);
    const interactionDoc = await getDoc(interactionRef);
    
    if (!interactionDoc.exists()) {
      return null; // No relationship yet
    }
    
    const data = interactionDoc.data();
    const firstVisit = data.firstCheckIn?.toDate() || new Date();
    const lastVisit = data.lastCheckIn?.toDate() || new Date();
    const daysSinceFirst = Math.max(1, (Date.now() - firstVisit.getTime()) / (1000 * 60 * 60 * 24));
    const daysSinceLast = (Date.now() - lastVisit.getTime()) / (1000 * 60 * 60 * 24);
    
    const checkIns = data.checkIns || 0;
    const missionsCompleted = data.missionsCompleted || 0;
    const avgFrequency = daysSinceFirst / Math.max(1, checkIns);
    
    // Calculate Lifetime Value Score (0-1000)
    let clvScore = 0;
    clvScore += checkIns * 10; // Each visit worth 10 points
    clvScore += missionsCompleted * 15; // Each mission worth 15 points
    clvScore += data.isFollowing ? 50 : 0;
    clvScore += data.isFavorited ? 30 : 0;
    clvScore += data.hasMessaged ? 20 : 0;
    
    // Recency factor (more recent = higher value)
    if (daysSinceLast < 7) clvScore *= 1.5;
    else if (daysSinceLast < 30) clvScore *= 1.2;
    else if (daysSinceLast > 60) clvScore *= 0.5;
    
    // Frequency factor
    if (avgFrequency < 7) clvScore *= 1.3; // Weekly visitor
    else if (avgFrequency < 14) clvScore *= 1.1; // Bi-weekly
    
    clvScore = Math.min(1000, Math.round(clvScore));
    
    // Determine customer tier
    let tier: CustomerProfile['customerTier'] = 'NEW';
    if (daysSinceLast > 90) {
      tier = 'CHURNED';
    } else if (daysSinceLast > 45 && checkIns >= 5) {
      tier = 'AT_RISK';
    } else if (clvScore >= 500) {
      tier = 'CHAMPION';
    } else if (clvScore >= 300) {
      tier = 'VIP';
    } else if (checkIns >= 3) {
      tier = 'REGULAR';
    }
    
    // Calculate churn risk (0-100)
    let churnRisk = 0;
    if (daysSinceLast > 30) churnRisk += 40;
    if (daysSinceLast > 60) churnRisk += 30;
    if (avgFrequency > 30) churnRisk += 20;
    if (missionsCompleted === 0 && checkIns > 3) churnRisk += 10;
    churnRisk = Math.min(100, churnRisk);
    
    // Retention score (inverse of churn risk with engagement boost)
    const engagementBonus = Math.min(30, missionsCompleted * 3);
    const retentionScore = Math.max(0, Math.min(100, 100 - churnRisk + engagementBonus));
    
    // Predict next visit
    const nextExpectedVisit = new Date(lastVisit.getTime() + avgFrequency * 24 * 60 * 60 * 1000);
    
    // Get user details
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data();
    
    return {
      userId,
      businessId,
      totalCheckIns: checkIns,
      totalMissionsCompleted: missionsCompleted,
      totalPointsEarned: data.totalPointsEarned || 0,
      totalSpent: data.totalSpent || 0,
      firstVisit,
      lastVisit,
      averageVisitFrequency: avgFrequency,
      preferredCategories: userData?.interests || [],
      favoriteProducts: [],
      lifetimeValue: clvScore,
      customerTier: tier,
      churnRisk,
      retentionScore,
      nextExpectedVisit
    };
  } catch (error) {
    console.error('[CLV] Error calculating customer lifetime value:', error);
    return null;
  }
}

/**
 * Get all customers for a business with CLV analysis
 */
export async function getBusinessCustomerAnalysis(businessId: string): Promise<CustomerProfile[]> {
  try {
    const interactionsRef = collection(db, 'customerInteractions');
    const q = query(interactionsRef, where('businessId', '==', businessId));
    const snapshot = await getDocs(q);
    
    const profiles = await Promise.all(
      snapshot.docs.map(doc => {
        const data = doc.data();
        return calculateCustomerCLV(data.userId, businessId);
      })
    );
    
    return profiles.filter(p => p !== null) as CustomerProfile[];
  } catch (error) {
    console.error('[CLV] Error getting customer analysis:', error);
    return [];
  }
}

/**
 * Segment customers by behavior and value
 */
export async function segmentCustomers(businessId: string): Promise<CustomerSegment[]> {
  const profiles = await getBusinessCustomerAnalysis(businessId);
  
  const segments: Record<string, CustomerProfile[]> = {
    CHAMPION: profiles.filter(p => p.customerTier === 'CHAMPION'),
    VIP: profiles.filter(p => p.customerTier === 'VIP'),
    REGULAR: profiles.filter(p => p.customerTier === 'REGULAR'),
    NEW: profiles.filter(p => p.customerTier === 'NEW'),
    AT_RISK: profiles.filter(p => p.customerTier === 'AT_RISK'),
    CHURNED: profiles.filter(p => p.customerTier === 'CHURNED')
  };
  
  const segmentAnalysis: CustomerSegment[] = [
    {
      segment: 'Champions',
      count: segments.CHAMPION.length,
      avgLifetimeValue: average(segments.CHAMPION.map(p => p.lifetimeValue)),
      characteristics: ['High frequency', 'High engagement', 'Long history'],
      suggestedActions: [
        'Invite to VIP events',
        'Request testimonials',
        'Offer exclusive previews',
        'Create loyalty program tier'
      ]
    },
    {
      segment: 'VIP Customers',
      count: segments.VIP.length,
      avgLifetimeValue: average(segments.VIP.map(p => p.lifetimeValue)),
      characteristics: ['Regular visitors', 'Good engagement', 'Growing loyalty'],
      suggestedActions: [
        'Personalized rewards',
        'Birthday specials',
        'Upgrade to Champion tier',
        'Referral incentives'
      ]
    },
    {
      segment: 'Regular Customers',
      count: segments.REGULAR.length,
      avgLifetimeValue: average(segments.REGULAR.map(p => p.lifetimeValue)),
      characteristics: ['Occasional visits', 'Moderate engagement'],
      suggestedActions: [
        'Increase visit frequency campaigns',
        'Mission suggestions',
        'Loyalty punch cards',
        'Email marketing'
      ]
    },
    {
      segment: 'New Customers',
      count: segments.NEW.length,
      avgLifetimeValue: average(segments.NEW.map(p => p.lifetimeValue)),
      characteristics: ['First-time or 2nd visit', 'Exploring'],
      suggestedActions: [
        'Welcome bonus',
        'First mission incentives',
        'Tour of features',
        'Next visit discount'
      ]
    },
    {
      segment: 'At-Risk Customers',
      count: segments.AT_RISK.length,
      avgLifetimeValue: average(segments.AT_RISK.map(p => p.lifetimeValue)),
      characteristics: ['Haven\'t visited recently', 'Used to be active'],
      suggestedActions: [
        'Win-back campaign (30-50% off)',
        'Personal message from owner',
        '"We miss you" email',
        'Survey about experience'
      ]
    },
    {
      segment: 'Churned Customers',
      count: segments.CHURNED.length,
      avgLifetimeValue: average(segments.CHURNED.map(p => p.lifetimeValue)),
      characteristics: ['No activity in 90+ days'],
      suggestedActions: [
        'Major incentive (50%+ off)',
        'New feature announcement',
        'Complete rebranding intro',
        'Last chance offer'
      ]
    }
  ];
  
  return segmentAnalysis;
}

/**
 * Get retention alerts for customers who need attention
 */
export async function getRetentionAlerts(businessId: string): Promise<RetentionAlert[]> {
  const profiles = await getBusinessCustomerAnalysis(businessId);
  const alerts: RetentionAlert[] = [];
  
  for (const profile of profiles) {
    const daysSinceLast = (Date.now() - profile.lastVisit.getTime()) / (1000 * 60 * 60 * 24);
    
    // Get user details
    const userDoc = await getDoc(doc(db, 'users', profile.userId));
    const userData = userDoc.data();
    
    // VIP/Champion at risk
    if ((profile.customerTier === 'VIP' || profile.customerTier === 'CHAMPION') && daysSinceLast > 14) {
      alerts.push({
        userId: profile.userId,
        userName: userData?.name || 'Customer',
        userAvatar: userData?.avatarUrl || '',
        tier: profile.customerTier,
        issue: `${profile.customerTier} customer hasn't visited in ${Math.round(daysSinceLast)} days`,
        daysSinceLastVisit: Math.round(daysSinceLast),
        suggestedAction: `Send personalized "We miss you" message with 25% off reward`,
        urgency: daysSinceLast > 30 ? 'CRITICAL' : 'HIGH'
      });
    }
    
    // Regular customer becoming at-risk
    if (profile.customerTier === 'AT_RISK') {
      alerts.push({
        userId: profile.userId,
        userName: userData?.name || 'Customer',
        userAvatar: userData?.avatarUrl || '',
        tier: profile.customerTier,
        issue: `Regular customer at risk of churning (${Math.round(daysSinceLast)} days since last visit)`,
        daysSinceLastVisit: Math.round(daysSinceLast),
        suggestedAction: `Launch win-back campaign with exclusive offer`,
        urgency: 'MEDIUM'
      });
    }
    
    // High-potential new customer not returning
    if (profile.customerTier === 'NEW' && profile.totalCheckIns === 1 && daysSinceLast > 7) {
      alerts.push({
        userId: profile.userId,
        userName: userData?.name || 'Customer',
        userAvatar: userData?.avatarUrl || '',
        tier: profile.customerTier,
        issue: `New customer visited once but hasn't returned in ${Math.round(daysSinceLast)} days`,
        daysSinceLastVisit: Math.round(daysSinceLast),
        suggestedAction: `Send "Complete your 2nd visit" mission with bonus points`,
        urgency: 'LOW'
      });
    }
  }
  
  return alerts.sort((a, b) => {
    const urgencyOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
  });
}

/**
 * Generate personalized retention offer for specific customer
 */
export async function generateRetentionOffer(
  userId: string,
  businessId: string
): Promise<string> {
  const profile = await calculateCustomerCLV(userId, businessId);
  if (!profile) return 'Welcome back! Enjoy 15% off your next visit.';
  
  const daysSinceLast = (Date.now() - profile.lastVisit.getTime()) / (1000 * 60 * 60 * 24);
  
  if (profile.customerTier === 'CHAMPION') {
    return `Our VIP is back! ${profile.totalCheckIns} visits earned you a complimentary premium item of your choice.`;
  }
  
  if (profile.customerTier === 'VIP') {
    return `We've missed you for ${Math.round(daysSinceLast)} days! Here's 30% off + double points on your next visit.`;
  }
  
  if (profile.customerTier === 'AT_RISK') {
    return `It's been ${Math.round(daysSinceLast)} days since we've seen you! Come back with this exclusive 40% off offer.`;
  }
  
  if (profile.customerTier === 'CHURNED') {
    return `We want you back! Here's 50% off your next visit - no strings attached. We've improved a lot!`;
  }
  
  return `Welcome back! Enjoy 20% off your next visit.`;
}

// Helper function
function average(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return Math.round(numbers.reduce((a, b) => a + b, 0) / numbers.length);
}
