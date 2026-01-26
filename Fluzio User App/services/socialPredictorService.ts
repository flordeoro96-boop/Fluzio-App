import { db } from './apiService';
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from '../services/firestoreCompat';

/**
 * Social Activity Predictor - Predict when friends will be active
 * Suggests best times to engage socially
 */

export interface FriendActivity {
  userId: string;
  userName: string;
  lastActive: Date;
  typicalActiveDays: number[]; // 0 = Sunday, 6 = Saturday
  typicalActiveHours: number[]; // 0-23
  activityScore: number; // 0-100, how active they are
  predictedNextActive: Date;
  sharedInterests: string[]; // Common categories/businesses
}

export interface SocialMoment {
  type: 'MISSION_TOGETHER' | 'MEETUP' | 'GROUP_CHALLENGE';
  suggestedTime: Date;
  participants: string[]; // User IDs
  description: string;
  confidence: number; // 0-100
  businessSuggestion?: {
    businessId: string;
    businessName: string;
    reason: string;
  };
}

export interface SocialInsight {
  insight: string;
  actionable: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

/**
 * Analyze friend activity patterns
 */
export async function analyzeFriendActivity(userId: string): Promise<FriendActivity[]> {
  try {
    // Get user's friends
    const userDoc = await getDocs(query(collection(db, 'users'), where('__name__', '==', userId)));
    if (userDoc.empty) return [];
    
    const userData = userDoc.docs[0].data();
    const friendIds: string[] = userData.following || [];
    
    if (friendIds.length === 0) return [];
    
    const friendActivities: FriendActivity[] = [];
    
    for (const friendId of friendIds.slice(0, 20)) { // Limit to prevent overload
      // Get friend's recent participations
      const participationsRef = collection(db, 'participations');
      const thirtyDaysAgo = Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
      const friendQuery = query(
        participationsRef,
        where('userId', '==', friendId),
        where('createdAt', '>=', thirtyDaysAgo),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      const participations = await getDocs(friendQuery);
      
      if (participations.empty) continue;
      
      // Analyze patterns
      const dayCount: Record<number, number> = {};
      const hourCount: Record<number, number> = {};
      const categories: Set<string> = new Set();
      let lastActiveDate: Date | null = null;
      
      participations.forEach(doc => {
        const data = doc.data();
        if (data.createdAt) {
          const date = data.createdAt.toDate();
          const day = date.getDay();
          const hour = date.getHours();
          
          dayCount[day] = (dayCount[day] || 0) + 1;
          hourCount[hour] = (hourCount[hour] || 0) + 1;
          
          if (!lastActiveDate || date > lastActiveDate) {
            lastActiveDate = date;
          }
        }
        
        if (data.category) categories.add(data.category);
      });
      
      // Find typical days (top 3)
      const typicalActiveDays = Object.entries(dayCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([day]) => parseInt(day));
      
      // Find typical hours (top 3)
      const typicalActiveHours = Object.entries(hourCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([hour]) => parseInt(hour));
      
      // Calculate activity score
      const daysActive = Object.keys(dayCount).length;
      const avgActivitiesPerDay = participations.size / 30;
      const activityScore = Math.min(100, (daysActive * 10) + (avgActivitiesPerDay * 20));
      
      // Predict next active time
      const avgDaysBetweenActivity = 30 / participations.size;
      const predictedNextActive = new Date(
        lastActiveDate!.getTime() + avgDaysBetweenActivity * 24 * 60 * 60 * 1000
      );
      
      // Get user's interests to find shared ones
      const userCategories = await getUserCategories(userId);
      const sharedInterests = [...categories].filter(cat => userCategories.has(cat));
      
      // Get friend's name
      const friendDoc = await getDocs(query(collection(db, 'users'), where('__name__', '==', friendId)));
      const friendName = friendDoc.empty ? 'Friend' : friendDoc.docs[0].data().displayName || 'Friend';
      
      friendActivities.push({
        userId: friendId,
        userName: friendName,
        lastActive: lastActiveDate || new Date(),
        typicalActiveDays,
        typicalActiveHours,
        activityScore: Math.round(activityScore),
        predictedNextActive,
        sharedInterests
      });
    }
    
    return friendActivities.sort((a, b) => b.activityScore - a.activityScore);
  } catch (error) {
    console.error('[Social Predictor] Error analyzing friend activity:', error);
    return [];
  }
}

/**
 * Suggest optimal social moments
 */
export async function suggestSocialMoments(userId: string): Promise<SocialMoment[]> {
  try {
    const friendActivities = await analyzeFriendActivity(userId);
    if (friendActivities.length === 0) return [];
    
    const moments: SocialMoment[] = [];
    const now = new Date();
    
    // Find friends with overlapping active times
    const hourOverlap: Record<number, string[]> = {};
    friendActivities.forEach(friend => {
      friend.typicalActiveHours.forEach(hour => {
        if (!hourOverlap[hour]) hourOverlap[hour] = [];
        hourOverlap[hour].push(friend.userId);
      });
    });
    
    // Suggest group activities for overlapping times
    Object.entries(hourOverlap)
      .filter(([, users]) => users.length >= 2)
      .forEach(([hour, users]) => {
        const hourNum = parseInt(hour);
        
        // Find next occurrence of this hour
        const suggestedTime = new Date(now);
        if (now.getHours() >= hourNum) {
          suggestedTime.setDate(suggestedTime.getDate() + 1);
        }
        suggestedTime.setHours(hourNum, 0, 0, 0);
        
        // Find shared interests
        const participantActivities = friendActivities.filter(f => users.includes(f.userId));
        const sharedInterests = findSharedInterests(participantActivities);
        
        let description = `${users.length} of your friends are typically active around ${formatHour(hourNum)}.`;
        if (sharedInterests.length > 0) {
          description += ` You all enjoy ${sharedInterests[0]}.`;
        }
        
        moments.push({
          type: users.length >= 3 ? 'GROUP_CHALLENGE' : 'MISSION_TOGETHER',
          suggestedTime,
          participants: users,
          description,
          confidence: Math.min(85, 50 + (users.length * 10))
        });
      });
    
    // Suggest meetups with highly active friends
    const topFriends = friendActivities.slice(0, 3);
    for (const friend of topFriends) {
      if (friend.sharedInterests.length > 0) {
        // Find a business in shared category
        const category = friend.sharedInterests[0];
        const businessSuggestion = await findBusinessInCategory(category);
        
        if (businessSuggestion) {
          const nextActiveTime = friend.predictedNextActive;
          
          moments.push({
            type: 'MEETUP',
            suggestedTime: nextActiveTime,
            participants: [friend.userId],
            description: `${friend.userName} is usually active around this time and loves ${category}.`,
            confidence: friend.activityScore,
            businessSuggestion
          });
        }
      }
    }
    
    return moments.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
  } catch (error) {
    console.error('[Social Predictor] Error suggesting moments:', error);
    return [];
  }
}

/**
 * Get social insights
 */
export async function getSocialInsights(userId: string): Promise<SocialInsight[]> {
  try {
    const friendActivities = await analyzeFriendActivity(userId);
    const insights: SocialInsight[] = [];
    
    if (friendActivities.length === 0) {
      insights.push({
        insight: 'You haven\'t connected with friends yet!',
        actionable: 'Follow friends to see their activity and discover new places together.',
        priority: 'HIGH'
      });
      return insights;
    }
    
    // Find most active friend
    const mostActive = friendActivities[0];
    if (mostActive.activityScore >= 70) {
      insights.push({
        insight: `${mostActive.userName} is very active (${mostActive.activityScore}/100)!`,
        actionable: `Check out what they're doing - they're typically active on ${getDayNames(mostActive.typicalActiveDays).join(', ')}.`,
        priority: 'HIGH'
      });
    }
    
    // Find friends who haven't been active
    const inactiveFriends = friendActivities.filter(f => {
      const daysSinceActive = (Date.now() - f.lastActive.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceActive > 14;
    });
    
    if (inactiveFriends.length > 0) {
      insights.push({
        insight: `${inactiveFriends.length} friend${inactiveFriends.length > 1 ? 's haven\'t' : ' hasn\'t'} been active in 2+ weeks.`,
        actionable: 'Send them a message or invite them to a mission to reconnect!',
        priority: 'MEDIUM'
      });
    }
    
    // Find friends with shared interests
    const friendsWithSharedInterests = friendActivities.filter(f => f.sharedInterests.length > 0);
    if (friendsWithSharedInterests.length >= 2) {
      insights.push({
        insight: `You have ${friendsWithSharedInterests.length} friends with similar interests!`,
        actionable: 'Plan a group outing to explore your shared favorite categories together.',
        priority: 'MEDIUM'
      });
    }
    
    return insights;
  } catch (error) {
    console.error('[Social Predictor] Error getting insights:', error);
    return [];
  }
}

// Helper functions
async function getUserCategories(userId: string): Promise<Set<string>> {
  const categories = new Set<string>();
  
  try {
    const participationsRef = collection(db, 'participations');
    const userQuery = query(
      participationsRef,
      where('userId', '==', userId),
      where('status', 'in', ['COMPLETED', 'APPROVED'])
    );
    const participations = await getDocs(userQuery);
    
    participations.forEach(doc => {
      const category = doc.data().category;
      if (category) categories.add(category);
    });
  } catch (error) {
    console.error('[Social Predictor] Error getting user categories:', error);
  }
  
  return categories;
}

function findSharedInterests(activities: FriendActivity[]): string[] {
  const interestCount: Record<string, number> = {};
  
  activities.forEach(activity => {
    activity.sharedInterests.forEach(interest => {
      interestCount[interest] = (interestCount[interest] || 0) + 1;
    });
  });
  
  return Object.entries(interestCount)
    .filter(([, count]) => count >= 2)
    .sort(([, a], [, b]) => b - a)
    .map(([interest]) => interest);
}

async function findBusinessInCategory(category: string): Promise<{
  businessId: string;
  businessName: string;
  reason: string;
} | null> {
  try {
    const missionsRef = collection(db, 'missions');
    const categoryQuery = query(
      missionsRef,
      where('category', '==', category),
      where('lifecycleStatus', '==', 'ACTIVE'),
      limit(1)
    );
    const missions = await getDocs(categoryQuery);
    
    if (!missions.empty) {
      const mission = missions.docs[0].data();
      return {
        businessId: mission.businessId,
        businessName: mission.businessName || 'Business',
        reason: `Perfect spot for your shared interest in ${category}`
      };
    }
  } catch (error) {
    console.error('[Social Predictor] Error finding business:', error);
  }
  
  return null;
}

function formatHour(hour: number): string {
  if (hour === 0) return 'midnight';
  if (hour === 12) return 'noon';
  if (hour < 12) return `${hour}am`;
  return `${hour - 12}pm`;
}

function getDayNames(days: number[]): string[] {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days.map(d => dayNames[d]);
}
