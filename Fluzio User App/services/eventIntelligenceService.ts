import { db } from './apiService';
import { collection, query, where, getDocs, Timestamp } from '../services/firestoreCompat';

/**
 * Event Intelligence Service
 * Recommends events and special occasions based on patterns
 */

export interface EventRecommendation {
  eventId: string;
  businessId: string;
  businessName: string;
  eventType: 'SPECIAL_HOURS' | 'HOLIDAY' | 'LOCAL_EVENT' | 'BUSINESS_ANNIVERSARY' | 'SEASONAL';
  title: string;
  description: string;
  startDate: Date;
  endDate?: Date;
  relevanceScore: number; // 0-100
  reasons: string[];
  suggestedAction: string;
  estimatedCrowd: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface SeasonalInsight {
  season: 'SPRING' | 'SUMMER' | 'FALL' | 'WINTER';
  trendingCategories: string[];
  recommendations: string[];
  historicalData: {
    avgCheckInsThisSeason: number;
    popularBusinessTypes: string[];
  };
}

/**
 * Detect upcoming events and holidays
 */
export async function detectUpcomingEvents(
  userId: string,
  userCity: string,
  daysAhead: number = 14
): Promise<EventRecommendation[]> {
  try {
    const events: EventRecommendation[] = [];
    const now = new Date();
    const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
    
    // Check for upcoming holidays
    const holidays = getUpcomingHolidays(now, futureDate);
    
    // Get user's favorite businesses
    const interactionsRef = collection(db, 'customerInteractions');
    const userQuery = query(
      interactionsRef,
      where('userId', '==', userId),
      where('isFavorited', '==', true)
    );
    const interactions = await getDocs(userQuery);
    
    const favoriteBusinessIds = interactions.docs.map(doc => doc.data().businessId);
    
    // Check each favorite business for special events
    for (const businessId of favoriteBusinessIds.slice(0, 10)) {
      // Check if business has special hours or events
      const businessDoc = await getDocs(query(collection(db, 'users'), where('__name__', '==', businessId)));
      if (businessDoc.empty) continue;
      
      const businessData = businessDoc.docs[0].data();
      const businessName = businessData.displayName || 'Business';
      
      // Check for business anniversary
      if (businessData.createdAt) {
        const createdDate = businessData.createdAt.toDate();
        const anniversary = new Date(now.getFullYear(), createdDate.getMonth(), createdDate.getDate());
        
        if (anniversary >= now && anniversary <= futureDate) {
          const daysUntil = Math.ceil((anniversary.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          events.push({
            eventId: `${businessId}_anniversary`,
            businessId,
            businessName,
            eventType: 'BUSINESS_ANNIVERSARY',
            title: `${businessName} Anniversary`,
            description: `${businessName} is celebrating another year! They might have special offers.`,
            startDate: anniversary,
            relevanceScore: 75,
            reasons: ['One of your favorite businesses', 'Special celebration'],
            suggestedAction: daysUntil <= 3 ? 'Check for anniversary specials!' : 'Mark your calendar',
            estimatedCrowd: 'MEDIUM'
          });
        }
      }
      
      // Check for holiday specials at this business
      holidays.forEach(holiday => {
        events.push({
          eventId: `${businessId}_${holiday.name}`,
          businessId,
          businessName,
          eventType: 'HOLIDAY',
          title: `${holiday.name} at ${businessName}`,
          description: `${businessName} likely has special ${holiday.name} offers or hours.`,
          startDate: holiday.date,
          relevanceScore: 80,
          reasons: ['Holiday special', 'Your favorite business'],
          suggestedAction: 'Check their profile for holiday hours and offers',
          estimatedCrowd: holiday.name.includes('Christmas') || holiday.name.includes('New Year') ? 'HIGH' : 'MEDIUM'
        });
      });
    }
    
    // Add seasonal events
    const seasonalEvents = detectSeasonalEvents(now, futureDate, userCity);
    events.push(...seasonalEvents);
    
    // Sort by relevance and date
    return events
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 10);
  } catch (error) {
    console.error('[Event Intelligence] Error detecting events:', error);
    return [];
  }
}

/**
 * Get seasonal insights and recommendations
 */
export async function getSeasonalInsights(
  userId: string,
  userCity: string
): Promise<SeasonalInsight> {
  try {
    const now = new Date();
    const season = getCurrentSeason(now);
    
    // Get historical data for this season
    const lastYear = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    const lastYearEnd = new Date(lastYear.getTime() + 90 * 24 * 60 * 60 * 1000);
    
    const checkInsRef = collection(db, 'customerInteractions');
    const historicalQuery = query(
      checkInsRef,
      where('userId', '==', userId),
      where('lastCheckIn', '>=', Timestamp.fromDate(lastYear)),
      where('lastCheckIn', '<=', Timestamp.fromDate(lastYearEnd))
    );
    const historicalCheckIns = await getDocs(historicalQuery);
    
    // Analyze patterns
    const categoryCount: Record<string, number> = {};
    const businessTypeCount: Record<string, number> = {};
    
    for (const checkIn of historicalCheckIns.docs) {
      const data = checkIn.data();
      const businessId = data.businessId;
      
      // Get business details
      const businessDoc = await getDocs(query(collection(db, 'users'), where('__name__', '==', businessId)));
      if (!businessDoc.empty) {
        const businessData = businessDoc.docs[0].data();
        const category = businessData.category || 'OTHER';
        const businessType = businessData.businessType || 'GENERAL';
        
        categoryCount[category] = (categoryCount[category] || 0) + 1;
        businessTypeCount[businessType] = (businessTypeCount[businessType] || 0) + 1;
      }
    }
    
    const trendingCategories = Object.entries(categoryCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([cat]) => cat);
    
    const popularBusinessTypes = Object.entries(businessTypeCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([type]) => type);
    
    // Generate season-specific recommendations
    const recommendations = getSeasonalRecommendations(season);
    
    return {
      season,
      trendingCategories,
      recommendations,
      historicalData: {
        avgCheckInsThisSeason: historicalCheckIns.size / 3, // Per month
        popularBusinessTypes
      }
    };
  } catch (error) {
    console.error('[Event Intelligence] Error getting seasonal insights:', error);
    return {
      season: getCurrentSeason(new Date()),
      trendingCategories: [],
      recommendations: [],
      historicalData: {
        avgCheckInsThisSeason: 0,
        popularBusinessTypes: []
      }
    };
  }
}

/**
 * Predict crowd levels for businesses
 */
export async function predictCrowdLevels(
  businessId: string,
  targetDate: Date
): Promise<{ level: 'LOW' | 'MEDIUM' | 'HIGH'; confidence: number; recommendation: string }> {
  try {
    const dayOfWeek = targetDate.getDay();
    const hour = targetDate.getHours();
    
    // Get historical check-ins for this business
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const checkInsRef = collection(db, 'customerInteractions');
    const historyQuery = query(
      checkInsRef,
      where('businessId', '==', businessId),
      where('lastCheckIn', '>=', Timestamp.fromDate(thirtyDaysAgo))
    );
    const checkIns = await getDocs(historyQuery);
    
    // Analyze patterns by day/hour
    const sameDayCheckIns = checkIns.docs.filter(doc => {
      const checkInDate = doc.data().lastCheckIn.toDate();
      return checkInDate.getDay() === dayOfWeek;
    });
    
    const sameHourCheckIns = sameDayCheckIns.filter(doc => {
      const checkInDate = doc.data().lastCheckIn.toDate();
      return Math.abs(checkInDate.getHours() - hour) <= 1;
    });
    
    // Calculate crowd level
    const avgCheckInsThisTime = sameHourCheckIns.length / 4; // ~4 weeks of data
    
    let level: 'LOW' | 'MEDIUM' | 'HIGH';
    let recommendation: string;
    
    if (avgCheckInsThisTime < 2) {
      level = 'LOW';
      recommendation = 'Great time to visit - usually quiet';
    } else if (avgCheckInsThisTime < 5) {
      level = 'MEDIUM';
      recommendation = 'Moderate crowd expected';
    } else {
      level = 'HIGH';
      recommendation = 'Popular time - expect a crowd';
    }
    
    // Adjust for holidays
    if (isHoliday(targetDate)) {
      if (level === 'HIGH') {
        recommendation = 'Very busy - holiday rush expected';
      } else {
        level = 'HIGH';
        recommendation = 'Holiday - expect larger crowds than usual';
      }
    }
    
    const confidence = sameDayCheckIns.length >= 4 ? 80 : 50;
    
    return { level, confidence, recommendation };
  } catch (error) {
    console.error('[Event Intelligence] Error predicting crowd:', error);
    return {
      level: 'MEDIUM',
      confidence: 30,
      recommendation: 'Insufficient data for prediction'
    };
  }
}

// Helper functions
function getUpcomingHolidays(start: Date, end: Date): Array<{ name: string; date: Date }> {
  const holidays: Array<{ name: string; date: Date }> = [];
  const year = start.getFullYear();
  
  // Common holidays
  const holidayDates = [
    { name: 'New Year\'s Day', month: 0, day: 1 },
    { name: 'Valentine\'s Day', month: 1, day: 14 },
    { name: 'St. Patrick\'s Day', month: 2, day: 17 },
    { name: 'Easter Sunday', month: 3, day: 9 }, // Approximate
    { name: 'Mother\'s Day', month: 4, day: 14 }, // 2nd Sunday
    { name: 'Father\'s Day', month: 5, day: 18 }, // 3rd Sunday
    { name: 'Halloween', month: 9, day: 31 },
    { name: 'Black Friday', month: 10, day: 24 }, // Approximate
    { name: 'Christmas Eve', month: 11, day: 24 },
    { name: 'Christmas', month: 11, day: 25 },
    { name: 'New Year\'s Eve', month: 11, day: 31 }
  ];
  
  holidayDates.forEach(({ name, month, day }) => {
    const date = new Date(year, month, day);
    if (date >= start && date <= end) {
      holidays.push({ name, date });
    }
    
    // Check next year too if range spans years
    if (end.getFullYear() > year) {
      const nextYearDate = new Date(year + 1, month, day);
      if (nextYearDate >= start && nextYearDate <= end) {
        holidays.push({ name, date: nextYearDate });
      }
    }
  });
  
  return holidays;
}

function getCurrentSeason(date: Date): 'SPRING' | 'SUMMER' | 'FALL' | 'WINTER' {
  const month = date.getMonth();
  
  if (month >= 2 && month <= 4) return 'SPRING';
  if (month >= 5 && month <= 7) return 'SUMMER';
  if (month >= 8 && month <= 10) return 'FALL';
  return 'WINTER';
}

function getSeasonalRecommendations(season: 'SPRING' | 'SUMMER' | 'FALL' | 'WINTER'): string[] {
  const recommendations: Record<string, string[]> = {
    SPRING: [
      'Outdoor cafes and patios are opening up - perfect weather!',
      'Spring sales and promotions are common at retail businesses',
      'Visit parks and outdoor venues while weather improves'
    ],
    SUMMER: [
      'Beach bars and outdoor venues are in full swing',
      'Ice cream shops and refreshment stands are popular now',
      'Summer festivals and events - check local businesses for tie-ins'
    ],
    FALL: [
      'Cozy cafes perfect for autumn vibes',
      'Fall fashion and seasonal menu items are trending',
      'Holiday shopping season begins - great deals ahead'
    ],
    WINTER: [
      'Indoor entertainment venues are popular',
      'Holiday shopping and special winter menus',
      'Warm up at cafes and restaurants - off-peak outdoor venues'
    ]
  };
  
  return recommendations[season] || [];
}

function detectSeasonalEvents(
  start: Date,
  end: Date,
  city: string
): EventRecommendation[] {
  const events: EventRecommendation[] = [];
  const season = getCurrentSeason(start);
  
  // Generic seasonal events
  if (season === 'SUMMER') {
    events.push({
      eventId: 'summer_season',
      businessId: '',
      businessName: 'Outdoor Venues',
      eventType: 'SEASONAL',
      title: 'Summer Season',
      description: 'Perfect time for outdoor dining and events',
      startDate: start,
      endDate: new Date(start.getFullYear(), 8, 1), // End of August
      relevanceScore: 60,
      reasons: ['Seasonal opportunity'],
      suggestedAction: 'Explore outdoor cafes and beach bars',
      estimatedCrowd: 'HIGH'
    });
  }
  
  return events;
}

function isHoliday(date: Date): boolean {
  const holidays = getUpcomingHolidays(date, date);
  return holidays.length > 0;
}
