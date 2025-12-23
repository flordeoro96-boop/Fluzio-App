import { db } from './AuthContext';
import { collection, doc, setDoc, getDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';

export interface UserBehavior {
    userId: string;
    
    // Visit patterns
    visitedBusinesses: {
        [businessId: string]: {
            count: number;
            lastVisit: string;
            categories: string[];
            averageSpend?: number;
        };
    };
    
    // Category preferences
    categoryAffinities: {
        [category: string]: {
            visits: number;
            redemptions: number;
            timeOfDay: {
                morning: number;
                lunch: number;
                afternoon: number;
                evening: number;
                night: number;
            };
        };
    };
    
    // Time patterns
    activityPatterns: {
        peakHours: number[];
        peakDays: string[];
        averageSessionLength: number;
    };
    
    // Walking radius
    movementProfile: {
        averageDistance: number;
        maxDistance: number;
        preferredRadius: number;
        distanceByCategory: {
            [category: string]: number;
        };
    };
    
    // Redemption history
    rewardHistory: {
        totalRedemptions: number;
        lastRedemption?: string;
        favoriteTypes: string[];
        averagePointsSpent: number;
    };
    
    // Mission completion
    missionProfile: {
        totalCompleted: number;
        completionRate: number;
        preferredDifficulty: 'easy' | 'medium' | 'hard';
        categoriesCompleted: string[];
    };
    
    // Engagement score (0-100)
    engagementScore: number;
    
    // Last updated
    lastUpdated: string;
}

/**
 * Track when user visits a business
 */
export async function trackBusinessVisit(
    userId: string, 
    businessId: string, 
    category: string,
    distance?: number
): Promise<void> {
    try {
        const behaviorRef = doc(db, 'userBehavior', userId);
        const behaviorDoc = await getDoc(behaviorRef);
        
        const timeOfDay = getTimeOfDay();
        const visitData = {
            count: increment(1),
            lastVisit: new Date().toISOString(),
            categories: [category]
        };
        
        if (behaviorDoc.exists()) {
            await updateDoc(behaviorRef, {
                [`visitedBusinesses.${businessId}`]: visitData,
                [`categoryAffinities.${category}.visits`]: increment(1),
                [`categoryAffinities.${category}.timeOfDay.${timeOfDay}`]: increment(1),
                lastUpdated: serverTimestamp()
            });
            
            // Update distance if provided
            if (distance) {
                await updateDoc(behaviorRef, {
                    [`movementProfile.distanceByCategory.${category}`]: distance
                });
            }
        } else {
            // Initialize new behavior profile
            const initialBehavior: Partial<UserBehavior> = {
                userId,
                visitedBusinesses: {
                    [businessId]: {
                        count: 1,
                        lastVisit: new Date().toISOString(),
                        categories: [category]
                    }
                },
                categoryAffinities: {
                    [category]: {
                        visits: 1,
                        redemptions: 0,
                        timeOfDay: {
                            morning: timeOfDay === 'morning' ? 1 : 0,
                            lunch: timeOfDay === 'lunch' ? 1 : 0,
                            afternoon: timeOfDay === 'afternoon' ? 1 : 0,
                            evening: timeOfDay === 'evening' ? 1 : 0,
                            night: timeOfDay === 'night' ? 1 : 0
                        }
                    }
                },
                movementProfile: {
                    averageDistance: distance || 500,
                    maxDistance: distance || 500,
                    preferredRadius: distance || 500,
                    distanceByCategory: { [category]: distance || 500 }
                },
                rewardHistory: {
                    totalRedemptions: 0,
                    favoriteTypes: [],
                    averagePointsSpent: 0
                },
                missionProfile: {
                    totalCompleted: 0,
                    completionRate: 0,
                    preferredDifficulty: 'medium',
                    categoriesCompleted: []
                },
                engagementScore: 50,
                lastUpdated: new Date().toISOString()
            };
            
            await setDoc(behaviorRef, initialBehavior);
        }
    } catch (error) {
        console.error('Error tracking business visit:', error);
    }
}

/**
 * Track reward redemption
 */
export async function trackRewardRedemption(
    userId: string,
    rewardType: string,
    category: string,
    pointsSpent: number
): Promise<void> {
    try {
        const behaviorRef = doc(db, 'userBehavior', userId);
        
        await updateDoc(behaviorRef, {
            'rewardHistory.totalRedemptions': increment(1),
            'rewardHistory.lastRedemption': new Date().toISOString(),
            'rewardHistory.averagePointsSpent': pointsSpent,
            [`categoryAffinities.${category}.redemptions`]: increment(1),
            engagementScore: increment(5),
            lastUpdated: serverTimestamp()
        });
    } catch (error) {
        console.error('Error tracking reward redemption:', error);
    }
}

/**
 * Track mission completion
 */
export async function trackMissionCompletion(
    userId: string,
    category: string,
    difficulty: 'easy' | 'medium' | 'hard'
): Promise<void> {
    try {
        const behaviorRef = doc(db, 'userBehavior', userId);
        
        await updateDoc(behaviorRef, {
            'missionProfile.totalCompleted': increment(1),
            'missionProfile.preferredDifficulty': difficulty,
            engagementScore: increment(3),
            lastUpdated: serverTimestamp()
        });
    } catch (error) {
        console.error('Error tracking mission completion:', error);
    }
}

/**
 * Get user behavior profile
 */
export async function getUserBehavior(userId: string): Promise<UserBehavior | null> {
    try {
        const behaviorRef = doc(db, 'userBehavior', userId);
        const behaviorDoc = await getDoc(behaviorRef);
        
        if (behaviorDoc.exists()) {
            return behaviorDoc.data() as UserBehavior;
        }
        
        return null;
    } catch (error) {
        console.error('Error getting user behavior:', error);
        return null;
    }
}

/**
 * Calculate personalized relevance score for a reward
 */
export function calculatePersonalizedScore(
    reward: any,
    behavior: UserBehavior | null
): number {
    if (!behavior) return 0;
    
    let score = 0;
    
    // Category affinity boost (0-30 points)
    const rewardCategory = reward.businessName?.toLowerCase() || '';
    for (const [category, affinity] of Object.entries(behavior.categoryAffinities)) {
        if (rewardCategory.includes(category.toLowerCase())) {
            score += Math.min(30, affinity.visits * 2 + affinity.redemptions * 5);
        }
    }
    
    // Time of day relevance (0-20 points)
    const timeOfDay = getTimeOfDay();
    for (const affinity of Object.values(behavior.categoryAffinities)) {
        const timeScore = affinity.timeOfDay[timeOfDay as keyof typeof affinity.timeOfDay];
        score += Math.min(20, timeScore * 2);
    }
    
    // Distance preference (0-15 points)
    // Would need reward location to calculate
    
    // Engagement boost (0-10 points)
    score += Math.min(10, behavior.engagementScore / 10);
    
    // Recency boost (0-10 points)
    if (behavior.rewardHistory.lastRedemption) {
        const daysSinceLastRedemption = Math.floor(
            (Date.now() - new Date(behavior.rewardHistory.lastRedemption).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceLastRedemption <= 7) {
            score += 10 - daysSinceLastRedemption;
        }
    }
    
    return Math.round(score);
}

/**
 * Get time of day category
 */
function getTimeOfDay(): 'morning' | 'lunch' | 'afternoon' | 'evening' | 'night' {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 11) return 'morning';
    if (hour >= 11 && hour < 14) return 'lunch';
    if (hour >= 14 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 22) return 'evening';
    return 'night';
}

/**
 * Update walking radius based on actual movement
 */
export async function updateWalkingRadius(
    userId: string,
    actualDistance: number,
    category: string
): Promise<void> {
    try {
        const behaviorRef = doc(db, 'userBehavior', userId);
        const behaviorDoc = await getDoc(behaviorRef);
        
        if (behaviorDoc.exists()) {
            const behavior = behaviorDoc.data() as UserBehavior;
            const currentAverage = behavior.movementProfile?.averageDistance || 500;
            
            // Calculate new average (weighted)
            const newAverage = (currentAverage * 0.7) + (actualDistance * 0.3);
            
            await updateDoc(behaviorRef, {
                'movementProfile.averageDistance': newAverage,
                'movementProfile.maxDistance': Math.max(
                    behavior.movementProfile?.maxDistance || 0,
                    actualDistance
                ),
                'movementProfile.preferredRadius': newAverage,
                [`movementProfile.distanceByCategory.${category}`]: actualDistance,
                lastUpdated: serverTimestamp()
            });
        }
    } catch (error) {
        console.error('Error updating walking radius:', error);
    }
}

/**
 * Get personalized distance recommendation
 */
export function getPersonalizedRadius(behavior: UserBehavior | null, category?: string): number {
    if (!behavior) return 1000; // Default 1km
    
    if (category && behavior.movementProfile?.distanceByCategory?.[category]) {
        return behavior.movementProfile.distanceByCategory[category];
    }
    
    return behavior.movementProfile?.preferredRadius || 1000;
}
