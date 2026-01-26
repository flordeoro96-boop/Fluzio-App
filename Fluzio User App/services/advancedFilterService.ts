import { db } from './apiService';
import { collection, query, where, getDocs, orderBy, limit } from '../services/firestoreCompat';

/**
 * Advanced Filter Service
 * Handles complex filtering, search, and discovery features
 */

export interface FilterOptions {
  // Search
  searchQuery?: string;
  
  // Location
  userLocation?: { lat: number; lng: number };
  maxDistance?: number; // in kilometers
  city?: string;
  
  // Price/Points
  minPoints?: number;
  maxPoints?: number;
  
  // Categories
  categories?: string[];
  
  // Ratings
  minRating?: number;
  
  // Status
  isActive?: boolean;
  
  // Sort
  sortBy?: 'distance' | 'newest' | 'reward' | 'trending' | 'rating';
  sortOrder?: 'asc' | 'desc';
  
  // Pagination
  limitResults?: number;
}

export interface FilteredResult {
  id: string;
  type: 'mission' | 'business' | 'reward';
  data: any;
  distance?: number;
  matchScore?: number;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal
};

const toRad = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Calculate relevance score for search results
 */
const calculateMatchScore = (item: any, searchQuery: string): number => {
  if (!searchQuery) return 100;
  
  const query = searchQuery.toLowerCase();
  let score = 0;
  
  // Title match (highest weight)
  if (item.title?.toLowerCase().includes(query)) {
    score += 50;
    if (item.title.toLowerCase().startsWith(query)) {
      score += 25;
    }
  }
  
  // Description match
  if (item.description?.toLowerCase().includes(query)) {
    score += 20;
  }
  
  // Category match
  if (item.category?.toLowerCase().includes(query)) {
    score += 15;
  }
  
  // Business name match
  if (item.businessName?.toLowerCase().includes(query)) {
    score += 15;
  }
  
  // Tags match
  if (item.tags?.some((tag: string) => tag.toLowerCase().includes(query))) {
    score += 10;
  }
  
  return score;
};

/**
 * Filter missions with advanced options
 */
export const filterMissions = async (filters: FilterOptions): Promise<FilteredResult[]> => {
  try {
    const missionsRef = collection(db, 'missions');
    let q = query(missionsRef);
    
    // Basic filters that can be done in Firestore
    if (filters.isActive !== undefined) {
      q = query(q, where('isActive', '==', filters.isActive));
    }
    
    if (filters.city) {
      q = query(q, where('city', '==', filters.city));
    }
    
    // Fetch data
    const snapshot = await getDocs(q);
    let missions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Client-side filtering for complex conditions
    
    // Search query
    if (filters.searchQuery) {
      missions = missions.filter((mission: any) => {
        const score = calculateMatchScore(mission, filters.searchQuery!);
        return score > 0;
      });
    }
    
    // Category filter
    if (filters.categories && filters.categories.length > 0) {
      missions = missions.filter((mission: any) => 
        filters.categories!.includes(mission.category)
      );
    }
    
    // Points range filter
    if (filters.minPoints !== undefined) {
      missions = missions.filter((mission: any) => 
        (mission.points || 0) >= filters.minPoints!
      );
    }
    
    if (filters.maxPoints !== undefined) {
      missions = missions.filter((mission: any) => 
        (mission.points || 0) <= filters.maxPoints!
      );
    }
    
    // Rating filter
    if (filters.minRating !== undefined) {
      missions = missions.filter((mission: any) => 
        (mission.businessRating || 0) >= filters.minRating!
      );
    }
    
    // Calculate distances if location provided
    if (filters.userLocation) {
      missions = missions.map((mission: any) => {
        if (mission.location?.lat && mission.location?.lng) {
          const distance = calculateDistance(
            filters.userLocation!.lat,
            filters.userLocation!.lng,
            mission.location.lat,
            mission.location.lng
          );
          return { ...mission, distance };
        }
        return mission;
      });
      
      // Distance filter
      if (filters.maxDistance !== undefined) {
        missions = missions.filter((mission: any) => 
          mission.distance !== undefined && mission.distance <= filters.maxDistance!
        );
      }
    }
    
    // Calculate match scores for search
    if (filters.searchQuery) {
      missions = missions.map((mission: any) => ({
        ...mission,
        matchScore: calculateMatchScore(mission, filters.searchQuery!)
      }));
    }
    
    // Sorting
    missions = missions.sort((a: any, b: any) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case 'distance':
          comparison = (a.distance || Infinity) - (b.distance || Infinity);
          break;
        case 'newest':
          const dateA = a.createdAt?.toDate?.() || new Date(0);
          const dateB = b.createdAt?.toDate?.() || new Date(0);
          comparison = dateB.getTime() - dateA.getTime();
          break;
        case 'reward':
          comparison = (b.points || 0) - (a.points || 0);
          break;
        case 'trending':
          comparison = (b.participantsCount || 0) - (a.participantsCount || 0);
          break;
        case 'rating':
          comparison = (b.businessRating || 0) - (a.businessRating || 0);
          break;
        default:
          // Default to match score if search query, otherwise newest
          if (filters.searchQuery) {
            comparison = (b.matchScore || 0) - (a.matchScore || 0);
          } else {
            const defaultDateA = a.createdAt?.toDate?.() || new Date(0);
            const defaultDateB = b.createdAt?.toDate?.() || new Date(0);
            comparison = defaultDateB.getTime() - defaultDateA.getTime();
          }
      }
      
      return filters.sortOrder === 'asc' ? -comparison : comparison;
    });
    
    // Limit results
    if (filters.limitResults) {
      missions = missions.slice(0, filters.limitResults);
    }
    
    return missions.map((mission: any) => ({
      id: mission.id,
      type: 'mission' as const,
      data: mission,
      distance: mission.distance,
      matchScore: mission.matchScore
    }));
  } catch (error) {
    console.error('[AdvancedFilter] Error filtering missions:', error);
    return [];
  }
};

/**
 * Filter businesses with advanced options
 */
export const filterBusinesses = async (filters: FilterOptions): Promise<FilteredResult[]> => {
  try {
    const usersRef = collection(db, 'users');
    let q = query(usersRef, where('role', '==', 'BUSINESS'));
    
    if (filters.city) {
      q = query(q, where('city', '==', filters.city));
    }
    
    const snapshot = await getDocs(q);
    let businesses = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Search query
    if (filters.searchQuery) {
      businesses = businesses.filter((business: any) => {
        const score = calculateMatchScore({
          title: business.name,
          description: business.description,
          category: business.businessType,
          tags: business.tags
        }, filters.searchQuery!);
        return score > 0;
      });
    }
    
    // Category filter
    if (filters.categories && filters.categories.length > 0) {
      businesses = businesses.filter((business: any) => 
        filters.categories!.includes(business.businessType)
      );
    }
    
    // Rating filter
    if (filters.minRating !== undefined) {
      businesses = businesses.filter((business: any) => 
        (business.rating || 0) >= filters.minRating!
      );
    }
    
    // Calculate distances
    if (filters.userLocation) {
      businesses = businesses.map((business: any) => {
        if (business.location?.lat && business.location?.lng) {
          const distance = calculateDistance(
            filters.userLocation!.lat,
            filters.userLocation!.lng,
            business.location.lat,
            business.location.lng
          );
          return { ...business, distance };
        }
        return business;
      });
      
      if (filters.maxDistance !== undefined) {
        businesses = businesses.filter((business: any) => 
          business.distance !== undefined && business.distance <= filters.maxDistance!
        );
      }
    }
    
    // Calculate match scores
    if (filters.searchQuery) {
      businesses = businesses.map((business: any) => ({
        ...business,
        matchScore: calculateMatchScore({
          title: business.name,
          description: business.description,
          category: business.businessType,
          tags: business.tags
        }, filters.searchQuery!)
      }));
    }
    
    // Sorting
    businesses = businesses.sort((a: any, b: any) => {
      switch (filters.sortBy) {
        case 'distance':
          return (a.distance || Infinity) - (b.distance || Infinity);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'trending':
          return (b.totalMissions || 0) - (a.totalMissions || 0);
        default:
          if (filters.searchQuery) {
            return (b.matchScore || 0) - (a.matchScore || 0);
          }
          return (b.rating || 0) - (a.rating || 0);
      }
    });
    
    if (filters.limitResults) {
      businesses = businesses.slice(0, filters.limitResults);
    }
    
    return businesses.map((business: any) => ({
      id: business.id,
      type: 'business' as const,
      data: business,
      distance: business.distance,
      matchScore: business.matchScore
    }));
  } catch (error) {
    console.error('[AdvancedFilter] Error filtering businesses:', error);
    return [];
  }
};

/**
 * Filter rewards with advanced options
 */
export const filterRewards = async (filters: FilterOptions): Promise<FilteredResult[]> => {
  try {
    const rewardsRef = collection(db, 'rewards');
    let q = query(rewardsRef);
    
    if (filters.isActive !== undefined) {
      q = query(q, where('isActive', '==', filters.isActive));
    }
    
    const snapshot = await getDocs(q);
    let rewards = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Search query
    if (filters.searchQuery) {
      rewards = rewards.filter((reward: any) => {
        const score = calculateMatchScore(reward, filters.searchQuery!);
        return score > 0;
      });
    }
    
    // Points range filter
    if (filters.minPoints !== undefined) {
      rewards = rewards.filter((reward: any) => 
        (reward.pointsCost || 0) >= filters.minPoints!
      );
    }
    
    if (filters.maxPoints !== undefined) {
      rewards = rewards.filter((reward: any) => 
        (reward.pointsCost || 0) <= filters.maxPoints!
      );
    }
    
    // Category filter
    if (filters.categories && filters.categories.length > 0) {
      rewards = rewards.filter((reward: any) => 
        filters.categories!.includes(reward.category)
      );
    }
    
    // Calculate match scores
    if (filters.searchQuery) {
      rewards = rewards.map((reward: any) => ({
        ...reward,
        matchScore: calculateMatchScore(reward, filters.searchQuery!)
      }));
    }
    
    // Sorting
    rewards = rewards.sort((a: any, b: any) => {
      switch (filters.sortBy) {
        case 'newest':
          const dateA = a.createdAt?.toDate?.() || new Date(0);
          const dateB = b.createdAt?.toDate?.() || new Date(0);
          return dateB.getTime() - dateA.getTime();
        case 'reward':
          return (a.pointsCost || 0) - (b.pointsCost || 0);
        case 'trending':
          return (b.redemptionsCount || 0) - (a.redemptionsCount || 0);
        default:
          if (filters.searchQuery) {
            return (b.matchScore || 0) - (a.matchScore || 0);
          }
          const defaultDateA = a.createdAt?.toDate?.() || new Date(0);
          const defaultDateB = b.createdAt?.toDate?.() || new Date(0);
          return defaultDateB.getTime() - defaultDateA.getTime();
      }
    });
    
    if (filters.limitResults) {
      rewards = rewards.slice(0, filters.limitResults);
    }
    
    return rewards.map((reward: any) => ({
      id: reward.id,
      type: 'reward' as const,
      data: reward,
      matchScore: reward.matchScore
    }));
  } catch (error) {
    console.error('[AdvancedFilter] Error filtering rewards:', error);
    return [];
  }
};

/**
 * Get search suggestions based on partial query
 */
export const getSearchSuggestions = async (searchTerm: string, type: 'missions' | 'businesses' | 'rewards' | 'all' = 'all'): Promise<string[]> => {
  if (!searchTerm || searchTerm.length < 2) return [];
  
  try {
    const suggestions = new Set<string>();
    const lowerQuery = searchTerm.toLowerCase();
    
    // Get missions
    if (type === 'missions' || type === 'all') {
      const missionsQuery = query(collection(db, 'missions'), limit(20));
      const missionsSnapshot = await getDocs(missionsQuery);
      missionsSnapshot.docs.forEach(doc => {
        const data = doc.data() as any;
        if (data.title?.toLowerCase().includes(lowerQuery)) {
          suggestions.add(data.title);
        }
        if (data.businessName?.toLowerCase().includes(lowerQuery)) {
          suggestions.add(data.businessName);
        }
      });
    }
    
    // Get businesses
    if (type === 'businesses' || type === 'all') {
      const businessesQuery = query(collection(db, 'users'), where('role', '==', 'BUSINESS'), limit(20));
      const businessesSnapshot = await getDocs(businessesQuery);
      businessesSnapshot.docs.forEach(doc => {
        const data = doc.data() as any;
        if (data.name?.toLowerCase().includes(lowerQuery)) {
          suggestions.add(data.name);
        }
      });
    }
    
    return Array.from(suggestions).slice(0, 5);
  } catch (error) {
    console.error('[AdvancedFilter] Error getting suggestions:', error);
    return [];
  }
};

/**
 * Get popular search terms
 */
export const getPopularSearches = (): string[] => {
  return [
    'Food & Dining',
    'Shopping',
    'Entertainment',
    'Fitness & Wellness',
    'Beauty & Spa',
    'Coffee Shops',
    'Restaurants',
    'Retail Stores',
    'Events',
    'Local Services'
  ];
};

/**
 * Save filter preferences to localStorage
 */
export const saveFilterPreferences = (filters: FilterOptions): void => {
  try {
    localStorage.setItem('filterPreferences', JSON.stringify(filters));
  } catch (error) {
    console.error('[AdvancedFilter] Error saving preferences:', error);
  }
};

/**
 * Load filter preferences from localStorage
 */
export const loadFilterPreferences = (): FilterOptions | null => {
  try {
    const saved = localStorage.getItem('filterPreferences');
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error('[AdvancedFilter] Error loading preferences:', error);
    return null;
  }
};

/**
 * Clear filter preferences
 */
export const clearFilterPreferences = (): void => {
  try {
    localStorage.removeItem('filterPreferences');
  } catch (error) {
    console.error('[AdvancedFilter] Error clearing preferences:', error);
  }
};
