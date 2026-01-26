import { db } from './apiService';
import { collection, query, where, getDocs, doc, getDoc, Timestamp } from '../services/firestoreCompat';

/**
 * Business Intelligence Service
 * Analyzes customer check-in patterns and suggests optimal times for:
 * - Reward campaigns (target slow periods)
 * - Customer squad meetups (when business has capacity)
 * - Mission creation (boost traffic during off-peak hours)
 */

export interface TimeSlotAnalysis {
  hour: number; // 0-23
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  checkInCount: number;
  averageCustomers: number;
  trafficLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface BusinessTrafficPattern {
  businessId: string;
  businessName: string;
  totalCheckIns: number;
  hourlyDistribution: Map<number, number>; // hour -> count
  dailyDistribution: Map<number, number>; // day -> count
  peakHours: number[]; // Hours with highest traffic
  slowHours: number[]; // Hours with lowest traffic
  bestTimesForPromotions: TimeSlotAnalysis[];
  bestTimesForMeetups: TimeSlotAnalysis[];
  lastAnalyzed: Date;
}

export interface OptimalTimesSuggestion {
  type: 'REWARD' | 'MEETUP' | 'MISSION';
  suggestedDays: string[]; // ['Monday', 'Tuesday']
  suggestedHours: string[]; // ['14:00-16:00', '20:00-22:00']
  reason: string;
  expectedImpact: string;
  trafficBoostPotential: number; // 0-100%
}

/**
 * Analyze check-in patterns for a business over the last 30 days
 */
export async function analyzeBusinessTraffic(businessId: string): Promise<BusinessTrafficPattern | null> {
  try {
    console.log('[BI] 🔍 Analyzing traffic patterns for business:', businessId);
    
    // Get business info
    const businessDoc = await getDoc(doc(db, 'users', businessId));
    if (!businessDoc.exists()) {
      console.error('[BI] Business not found:', businessId);
      return null;
    }
    
    const businessName = businessDoc.data()?.name || 'Business';
    
    // Get all check-ins for this business in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const interactionsRef = collection(db, 'customerInteractions');
    const q = query(
      interactionsRef,
      where('businessId', '==', businessId),
      where('lastCheckIn', '>=', Timestamp.fromDate(thirtyDaysAgo))
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log('[BI] No check-ins found for analysis');
      return {
        businessId,
        businessName,
        totalCheckIns: 0,
        hourlyDistribution: new Map(),
        dailyDistribution: new Map(),
        peakHours: [],
        slowHours: [],
        bestTimesForPromotions: [],
        bestTimesForMeetups: [],
        lastAnalyzed: new Date()
      };
    }
    
    // Initialize distributions
    const hourlyDist = new Map<number, number>();
    const dailyDist = new Map<number, number>();
    
    // Count check-ins by hour and day
    let totalCheckIns = 0;
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const checkIns = data.checkIns || 0;
      const lastCheckIn = data.lastCheckIn?.toDate?.() || new Date(data.lastCheckIn);
      
      totalCheckIns += checkIns;
      
      const hour = lastCheckIn.getHours();
      const day = lastCheckIn.getDay();
      
      hourlyDist.set(hour, (hourlyDist.get(hour) || 0) + checkIns);
      dailyDist.set(day, (dailyDist.get(day) || 0) + checkIns);
    });
    
    // Identify peak and slow hours
    const hourlyArray = Array.from(hourlyDist.entries()).sort((a, b) => b[1] - a[1]);
    const peakHours = hourlyArray.slice(0, 3).map(([hour]) => hour);
    const slowHours = hourlyArray.slice(-3).map(([hour]) => hour);
    
    // Generate time slot analysis
    const timeSlots: TimeSlotAnalysis[] = [];
    for (let hour = 0; hour < 24; hour++) {
      const count = hourlyDist.get(hour) || 0;
      const avgPerDay = count / 30; // Average over 30 days
      
      let trafficLevel: 'LOW' | 'MEDIUM' | 'HIGH';
      if (avgPerDay < 2) trafficLevel = 'LOW';
      else if (avgPerDay < 5) trafficLevel = 'MEDIUM';
      else trafficLevel = 'HIGH';
      
      timeSlots.push({
        hour,
        dayOfWeek: -1, // Not day-specific in this analysis
        checkInCount: count,
        averageCustomers: avgPerDay,
        trafficLevel
      });
    }
    
    // Identify best times for promotions (slow periods)
    const bestTimesForPromotions = timeSlots
      .filter(slot => slot.trafficLevel === 'LOW')
      .sort((a, b) => a.averageCustomers - b.averageCustomers)
      .slice(0, 5);
    
    // Identify best times for meetups (medium traffic - social but not too crowded)
    const bestTimesForMeetups = timeSlots
      .filter(slot => slot.trafficLevel === 'MEDIUM')
      .sort((a, b) => b.averageCustomers - a.averageCustomers)
      .slice(0, 5);
    
    console.log('[BI] ✅ Analysis complete:', {
      totalCheckIns,
      peakHours,
      slowHours,
      bestPromotionTimes: bestTimesForPromotions.length,
      bestMeetupTimes: bestTimesForMeetups.length
    });
    
    return {
      businessId,
      businessName,
      totalCheckIns,
      hourlyDistribution: hourlyDist,
      dailyDistribution: dailyDist,
      peakHours,
      slowHours,
      bestTimesForPromotions,
      bestTimesForMeetups,
      lastAnalyzed: new Date()
    };
  } catch (error) {
    console.error('[BI] Error analyzing business traffic:', error);
    return null;
  }
}

/**
 * Get optimal time suggestions for rewards, meetups, or missions
 */
export async function getOptimalTimeSuggestions(
  businessId: string,
  type: 'REWARD' | 'MEETUP' | 'MISSION'
): Promise<OptimalTimesSuggestion[]> {
  try {
    const analysis = await analyzeBusinessTraffic(businessId);
    if (!analysis) {
      return [];
    }
    
    const suggestions: OptimalTimesSuggestion[] = [];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    if (type === 'REWARD' || type === 'MISSION') {
      // Suggest slow periods to boost traffic
      const slowHourSlots = analysis.bestTimesForPromotions;
      
      if (slowHourSlots.length > 0) {
        // Morning slow period (6am-11am)
        const morningSlots = slowHourSlots.filter(s => s.hour >= 6 && s.hour <= 11);
        if (morningSlots.length > 0) {
          suggestions.push({
            type,
            suggestedDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            suggestedHours: morningSlots.map(s => `${s.hour}:00-${s.hour + 1}:00`),
            reason: 'Morning hours show lower customer traffic. A reward campaign here could boost breakfast/coffee business.',
            expectedImpact: 'Attract 15-25% more customers during typically slow morning hours',
            trafficBoostPotential: 20
          });
        }
        
        // Afternoon slow period (2pm-5pm)
        const afternoonSlots = slowHourSlots.filter(s => s.hour >= 14 && s.hour <= 17);
        if (afternoonSlots.length > 0) {
          suggestions.push({
            type,
            suggestedDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            suggestedHours: afternoonSlots.map(s => `${s.hour}:00-${s.hour + 1}:00`),
            reason: 'Afternoon hours have lower foot traffic. Perfect time to run a "Happy Hour" style promotion.',
            expectedImpact: 'Fill the afternoon gap and increase revenue by 20-30%',
            trafficBoostPotential: 25
          });
        }
        
        // Late evening slow period (9pm-11pm)
        const lateSlots = slowHourSlots.filter(s => s.hour >= 21 && s.hour <= 23);
        if (lateSlots.length > 0) {
          suggestions.push({
            type,
            suggestedDays: ['Friday', 'Saturday', 'Sunday'],
            suggestedHours: lateSlots.map(s => `${s.hour}:00-${s.hour + 1}:00`),
            reason: 'Late evening shows lower activity. A "Night Owl Special" could attract customers before closing.',
            expectedImpact: 'Extend busy hours and capture late-night customers',
            trafficBoostPotential: 15
          });
        }
      }
      
      // Weekend vs Weekday analysis
      const weekdayCheckIns = Array.from({ length: 5 }, (_, i) => analysis.dailyDistribution.get(i + 1) || 0).reduce((a, b) => a + b, 0);
      const weekendCheckIns = (analysis.dailyDistribution.get(0) || 0) + (analysis.dailyDistribution.get(6) || 0);
      
      if (weekdayCheckIns < weekendCheckIns * 0.5) {
        suggestions.push({
          type,
          suggestedDays: ['Monday', 'Tuesday', 'Wednesday'],
          suggestedHours: ['12:00-14:00', '18:00-20:00'],
          reason: 'Weekdays have significantly lower traffic than weekends. Target these days to balance weekly revenue.',
          expectedImpact: 'Boost weekday traffic by 30-40% with strategic promotions',
          trafficBoostPotential: 35
        });
      }
    }
    
    if (type === 'MEETUP') {
      // Suggest medium traffic periods (social but not too crowded)
      const mediumSlots = analysis.bestTimesForMeetups;
      
      if (mediumSlots.length > 0) {
        // Weekend brunch (10am-2pm)
        const brunchSlots = mediumSlots.filter(s => s.hour >= 10 && s.hour <= 14);
        if (brunchSlots.length > 0) {
          suggestions.push({
            type: 'MEETUP',
            suggestedDays: ['Saturday', 'Sunday'],
            suggestedHours: ['10:00-12:00', '12:00-14:00'],
            reason: 'Perfect brunch timing with moderate crowd. Great atmosphere for customer meetups.',
            expectedImpact: 'Customers can socialize comfortably without overwhelming your staff',
            trafficBoostPotential: 15
          });
        }
        
        // Weekday evening (6pm-8pm)
        const eveningSlots = mediumSlots.filter(s => s.hour >= 18 && s.hour <= 20);
        if (eveningSlots.length > 0) {
          suggestions.push({
            type: 'MEETUP',
            suggestedDays: ['Tuesday', 'Wednesday', 'Thursday'],
            suggestedHours: ['18:00-20:00'],
            reason: 'Mid-week evenings have moderate traffic. Ideal for after-work customer squad gatherings.',
            expectedImpact: 'Build customer community while maintaining service quality',
            trafficBoostPotential: 20
          });
        }
      }
    }
    
    console.log('[BI] 💡 Generated', suggestions.length, 'suggestions for', type);
    return suggestions;
  } catch (error) {
    console.error('[BI] Error generating suggestions:', error);
    return [];
  }
}

/**
 * Get a simple text summary of optimal times for business dashboard
 */
export async function getOptimalTimesSummary(businessId: string): Promise<string> {
  try {
    const analysis = await analyzeBusinessTraffic(businessId);
    if (!analysis || analysis.totalCheckIns === 0) {
      return 'Not enough data yet. Check-ins will help us identify your slow periods and suggest optimal times for promotions.';
    }
    
    const peakHourStr = analysis.peakHours.map(h => `${h}:00`).join(', ');
    const slowHourStr = analysis.slowHours.map(h => `${h}:00`).join(', ');
    
    let summary = `📊 Traffic Analysis (Last 30 days):\n\n`;
    summary += `🔥 Peak Hours: ${peakHourStr}\n`;
    summary += `😴 Slow Hours: ${slowHourStr}\n\n`;
    summary += `💡 Recommendation: Create rewards or missions targeting ${slowHourStr} to boost traffic during these quiet periods.\n\n`;
    summary += `👥 Squad Meetups: Best scheduled during medium traffic times (not your busiest hours) to ensure good atmosphere without overwhelming your staff.`;
    
    return summary;
  } catch (error) {
    console.error('[BI] Error generating summary:', error);
    return 'Unable to analyze traffic patterns at this time.';
  }
}

/**
 * Format hour to readable time string
 */
export function formatHour(hour: number): string {
  if (hour === 0) return '12:00 AM';
  if (hour < 12) return `${hour}:00 AM`;
  if (hour === 12) return '12:00 PM';
  return `${hour - 12}:00 PM`;
}

/**
 * Get color indicator for traffic level
 */
export function getTrafficColor(level: 'LOW' | 'MEDIUM' | 'HIGH'): string {
  switch (level) {
    case 'LOW': return '#22C55E'; // Green - good time for promotions
    case 'MEDIUM': return '#F59E0B'; // Orange - moderate
    case 'HIGH': return '#EF4444'; // Red - busy
  }
}
