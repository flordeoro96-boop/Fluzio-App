import { collection, query, where, getDocs, orderBy, limit, Query, DocumentData } from 'firebase/firestore';
import { db } from './AuthContext';
import { GeoPoint } from '../types';

export interface SearchableUser {
  id: string;
  name: string;
  email: string;
  role: 'CREATOR' | 'BUSINESS';
  photoUrl?: string;
  avatarUrl?: string; // Alternative avatar field
  city?: string;
  currentCity?: string; // Current city location
  category?: string;
  subCategory?: string; // Business sub-category
  bio?: string;
  geo?: GeoPoint;
  businessMode?: 'PHYSICAL' | 'ONLINE' | 'HYBRID';
  businessType?: string;
  subscriptionLevel?: string;
  location?: string;
  address?: any;
  vibeTags?: string[];
  accountType?: string; // 'creator', 'business', etc.
  creator?: { // Creator profile data
    roles?: string[];
    city?: string;
    radiusKm?: number;
    portfolio?: string[];
    bio?: string;
    hourlyRate?: number;
    availability?: 'FULL_TIME' | 'PART_TIME' | 'WEEKENDS' | 'open' | 'busy';
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
        bio: data.bio,
        geo: data.geo,
        businessMode: data.businessMode,
        businessType: data.businessType,
        subscriptionLevel: data.subscriptionLevel,
        location: data.location,
        address: data.address
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
        city: result.user.city || result.user.homeCity,
        category: result.user.category,
        bio: result.user.bio
      };
    }
    
    return null;
  } catch (error) {
    console.error('[userService] Error fetching user by ID:', error);
    return null;
  }
};

/**
 * Get creators by city (for B2B marketplace)
 */
export const getCreatorsByCity = async (
  city: string,
  roles?: string[]
): Promise<SearchableUser[]> => {
  try {
    const usersRef = collection(db, 'users');
    let q: Query<DocumentData> = query(
      usersRef,
      where('creatorMode', '==', true),
      where('city', '==', city),
      limit(50)
    );

    const snapshot = await getDocs(q);
    const creators: SearchableUser[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      
      // Filter by roles if specified
      if (roles && roles.length > 0) {
        const creatorRoles = data.creator?.roles || [];
        const hasMatchingRole = roles.some(role => 
          creatorRoles.some((cr: string) => cr.toLowerCase().includes(role.toLowerCase()))
        );
        if (!hasMatchingRole) return;
      }

      creators.push({
        id: doc.id,
        name: data.name || 'Unknown',
        email: data.email || '',
        role: 'CREATOR',
        photoUrl: data.photoUrl || data.avatarUrl,
        avatarUrl: data.avatarUrl || data.photoUrl,
        city: data.city,
        bio: data.bio || data.creator?.bio,
        category: data.creator?.roles?.[0] || 'Creator'
      });
    });

    return creators;
  } catch (error) {
    console.error('[userService] Error fetching creators by city:', error);
    return [];
  }
};
