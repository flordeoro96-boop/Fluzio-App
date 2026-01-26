import { collection, query, where, getDocs, orderBy, limit, Query, DocumentData } from '../services/firestoreCompat';
import { db } from './apiService';
import { GeoPoint, User } from '../types';

export interface SearchableUser {
  id: string;
  name: string;
  email: string;
  role: 'CREATOR' | 'BUSINESS';
  photoUrl?: string;
  avatarUrl?: string;
  city?: string;
  currentCity?: string;
  category?: string;
  subCategory?: string;
  bio?: string;
  geo?: GeoPoint;
  businessMode?: 'PHYSICAL' | 'ONLINE' | 'HYBRID';
  businessType?: string;
  businessName?: string;
  subscriptionLevel?: string;
  location?: string;
  address?: any;
  vibeTags?: string[];
  accountType?: 'business' | 'creator';
  isAspiringBusiness?: boolean;
  creator?: {
    roles: string[];
    availability?: 'open' | 'busy';
  };
}

/**
 * Search for users by name or email
 * Returns users matching the search term (case-insensitive)
 */
export const searchUsers = async (
  searchTerm: string,
  currentUserId: string,
  maxResults: number = 20
): Promise<SearchableUser[]> => {
  try {
    if (!searchTerm || searchTerm.trim().length < 2) {
      console.log('[userService] Search term too short');
      return [];
    }

    const normalizedSearch = searchTerm.toLowerCase().trim();
    console.log('[userService] Searching for users:', normalizedSearch);

    const usersRef = collection(db, 'users');
    
    // Firestore doesn't support case-insensitive queries or LIKE queries
    // So we'll fetch all users and filter in-memory
    // For better performance with large datasets, you'd use:
    // 1. Algolia/ElasticSearch for full-text search
    // 2. Create lowercase name/email fields in Firestore
    // 3. Use Cloud Functions to maintain search indexes
    
    const usersSnapshot = await getDocs(query(
      usersRef,
      limit(100) // Limit initial fetch
    ));

    const users: SearchableUser[] = [];
    
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      
      // Skip current user
      if (doc.id === currentUserId) {
        return;
      }

      // Check if name or email matches search term
      const name = (data.name || '').toLowerCase();
      const email = (data.email || '').toLowerCase();
      
      if (name.includes(normalizedSearch) || email.includes(normalizedSearch)) {
        users.push({
          id: doc.id,
          name: data.name || 'Unknown User',
          email: data.email || '',
          role: data.role || 'CREATOR',
          photoUrl: data.photoUrl,
          city: data.city || data.homeCity,
          category: data.category,
          subCategory: data.subCategory,
          bio: data.bio,
          geo: data.geo,
          businessMode: data.businessMode,
          businessType: data.businessType,
          subscriptionLevel: data.subscriptionLevel,
          location: data.location,
          address: data.address
        });
      }
    });

    console.log('[userService] Found users:', users.length);
    
    // Sort by name and limit results
    return users
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, maxResults);
      
  } catch (error) {
    console.error('[userService] Error searching users:', error);
    return [];
  }
};

/**
 * Get users by role (for filtering partners vs ambassadors)
 */
export const getUsersByRole = async (
  role: 'CREATOR' | 'BUSINESS',
  currentUserId: string,
  maxResults: number = 50
): Promise<SearchableUser[]> => {
  try {
    console.log('[userService] Fetching users by role:', role);

    const usersRef = collection(db, 'users');
    const usersQuery = query(
      usersRef,
      where('role', '==', role),
      limit(maxResults)
    );

    const usersSnapshot = await getDocs(usersQuery);
    const users: SearchableUser[] = [];

    usersSnapshot.forEach(doc => {
      // Skip current user
      if (doc.id === currentUserId) {
        return;
      }

      const data = doc.data();
      users.push({
        id: doc.id,
        name: data.name || 'Unknown User',
        email: data.email || '',
        role: data.role || role,
        photoUrl: data.photoUrl,
        city: data.city || data.homeCity,
        category: data.category,
        subCategory: data.subCategory,
        bio: data.bio,
        geo: data.geo,
        businessMode: data.businessMode,
        businessType: data.businessType,
        subscriptionLevel: data.subscriptionLevel,
        location: data.location,
        address: data.address,
        isAspiringBusiness: data.isAspiringBusiness || false
      });
    });

    console.log('[userService] Found users:', users.length);
    
    // Sort by name in-memory to avoid composite index requirement
    return users.sort((a, b) => a.name.localeCompare(b.name));

  } catch (error) {
    console.error('[userService] Error fetching users by role:', error);
    return [];
  }
};

/**
 * Get a specific user by ID
 */
export const getUserById = async (userId: string): Promise<SearchableUser | null> => {
  try {
    const { api } = await import('./apiService');
    const result = await api.getUser(userId);
    
    if (result.success && result.user) {
      return {
        id: userId,
        name: result.user.name || 'Unknown User',
        email: result.user.email || '',
        role: result.user.role || 'CREATOR',
        photoUrl: result.user.photoUrl,
        avatarUrl: result.user.avatarUrl,
        city: result.user.city || result.user.homeCity,
        currentCity: result.user.currentCity,
        category: result.user.category,
        subCategory: result.user.subCategory,
        businessType: result.user.businessType,
        businessName: result.user.businessName,
        bio: result.user.bio,
        accountType: result.user.accountType,
        creator: result.user.creator
      };
    }
    
    return null;
  } catch (error) {
    console.error('[userService] Error fetching user by ID:', error);
    return null;
  }
};

/**
 * Get creators by city
 * Returns creators in a specific city for Market discovery
 */
export const getCreatorsByCity = async (
  city: string,
  maxResults: number = 50
): Promise<SearchableUser[]> => {
  try {
    console.log('[userService] Fetching creators in city:', city);

    const usersRef = collection(db, 'users');
    
    // Query for creators by role (more reliable than accountType)
    const creatorsQuery = query(
      usersRef,
      where('role', '==', 'CREATOR'),
      limit(maxResults)
    );

    const snapshot = await getDocs(creatorsQuery);
    console.log('[userService] Total users with role CREATOR:', snapshot.size);
    
    const creators: SearchableUser[] = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      const userCity = data.currentCity || data.city || data.homeCity || data.address?.city;
      
      console.log('[userService] Checking creator:', {
        id: doc.id,
        name: data.name,
        role: data.role,
        accountType: data.accountType,
        currentCity: data.currentCity,
        city: data.city,
        homeCity: data.homeCity,
        addressCity: data.address?.city,
        hasCreatorField: !!data.creator,
        category: data.category
      });
      
      // Filter by city (if city is provided, otherwise include all)
      if (!city || !userCity || userCity.toLowerCase() === city.toLowerCase()) {
        creators.push({
          id: doc.id,
          name: data.name || 'Unknown Creator',
          email: data.email || '',
          role: data.role || 'CREATOR',
          photoUrl: data.photoUrl,
          avatarUrl: data.avatarUrl,
          city: userCity,
          currentCity: data.currentCity,
          category: data.category,
          subCategory: data.subCategory,
          bio: data.bio,
          geo: data.geo,
          businessType: data.businessType,
          subscriptionLevel: data.subscriptionLevel,
          location: data.location,
          address: data.address,
          accountType: data.accountType || 'creator',
          creator: data.creator
        });
      }
    });

    console.log('[userService] Found creators:', creators.length);
    console.log('[userService] Creator details:', creators.map(c => ({ name: c.name, city: c.city, category: c.category })));
    return creators.sort((a, b) => a.name.localeCompare(b.name));

  } catch (error) {
    console.error('[userService] Error fetching creators by city:', error);
    return [];
  }
};
