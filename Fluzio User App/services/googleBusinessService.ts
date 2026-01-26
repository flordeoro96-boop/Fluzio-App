/**
 * Google Business Profile Integration Service
 * Fetches verified business data from Google Business Profile API
 */

import { getAuth } from './authCompat';

const auth = getAuth();
import { api } from './apiService';

export interface GoogleBusinessLocation {
  name: string;
  locationName: string;
  primaryPhone?: string;
  websiteUri?: string;
  regularHours?: GoogleBusinessHours;
  specialHours?: GoogleSpecialHours[];
  storefrontAddress?: GoogleAddress;
  latlng?: {
    latitude: number;
    longitude: number;
  };
  categories?: {
    primaryCategory?: GoogleCategory;
    additionalCategories?: GoogleCategory[];
  };
  attributes?: GoogleAttribute[];
  metadata?: {
    mapsUri?: string;
    newReviewUri?: string;
  };
  profile?: {
    description?: string;
  };
  // Photos
  media?: GoogleMediaItem[];
}

export interface GoogleBusinessHours {
  periods?: Array<{
    openDay: string; // MONDAY, TUESDAY, etc.
    openTime: string; // HH:MM format
    closeDay: string;
    closeTime: string;
  }>;
}

export interface GoogleSpecialHours {
  startDate?: { year: number; month: number; day: number };
  endDate?: { year: number; month: number; day: number };
  closed?: boolean;
  openTime?: string;
  closeTime?: string;
}

export interface GoogleAddress {
  regionCode?: string;
  languageCode?: string;
  postalCode?: string;
  administrativeArea?: string; // State
  locality?: string; // City
  addressLines?: string[];
}

export interface GoogleCategory {
  name: string;
  displayName: string;
}

export interface GoogleAttribute {
  name: string; // e.g., "accounts/{accountId}/attributes/women_owned"
  valueType: string; // BOOL, ENUM, URL, etc.
  values?: any[];
  displayName?: string; // Human-readable name
  groupDisplayName?: string; // Category like "Offerings", "From the business"
}

export interface GoogleMediaItem {
  name: string;
  mediaFormat: 'PHOTO' | 'VIDEO';
  sourceUrl?: string;
  googleUrl?: string;
  thumbnailUrl?: string;
  description?: string;
  locationAssociation?: {
    category: 'COVER' | 'LOGO' | 'EXTERIOR' | 'INTERIOR' | 'PRODUCT' | 'FOOD_AND_DRINK' | 'MENU' | 'COMMON_AREA' | 'TEAMS' | 'AT_WORK';
  };
  createTime?: string;
}

export interface GoogleReviewsData {
  averageRating?: number;
  totalReviewCount?: number;
}

export interface SyncedGoogleData {
  // Basic Info
  googleBusinessName?: string;
  address?: GoogleAddress;
  phone?: string;
  website?: string;
  googleMapsLink?: string;
  
  // Hours
  openingHours?: GoogleBusinessHours;
  specialHours?: GoogleSpecialHours[];
  
  // Attributes (Official Google Badges)
  googleAttributes?: Array<{
    key: string;
    displayName: string;
    group: string;
    value: any;
  }>;
  
  // Photos
  googlePhotos?: Array<{
    url: string;
    category: string;
    description?: string;
  }>;
  
  // Reviews & Rating
  rating?: number;
  reviewCount?: number;
  
  // Additional
  businessDescription?: string;
  categories?: string[];
  
  // Metadata
  lastGoogleSync?: string; // ISO timestamp
  googlePlaceId?: string;
}

class GoogleBusinessService {
  private accessToken: string | null = null;

  /**
   * Get Google access token from Firebase Auth
   */
  private async getAccessToken(): Promise<string | null> {
    console.log('[GoogleBusiness] 🔵 Getting access token...');
    const user = auth.currentUser;
    if (!user) {
      console.warn('[GoogleBusiness] ⚠️ No authenticated user');
      return null;
    }

    try {
      // First check if we have it in memory
      if (this.accessToken) {
        console.log('[GoogleBusiness] ✅ Using cached OAuth access token');
        return this.accessToken;
      }

      // Get the Google provider data
      const providerData = user.providerData.find(p => p.providerId === 'google.com');
      if (!providerData) {
        console.warn('[GoogleBusiness] ⚠️ No Google provider linked');
        return null;
      }

      console.log('[GoogleBusiness] 🔵 Google provider found:', providerData.uid);

      // Fetch the access token from Firestore (stored in socialAccounts)
      console.log('[GoogleBusiness] 🔵 Fetching access token from Firestore...');
      const { api } = await import('./apiService');
      const result = await api.getUser(user.uid);
      
      if (result.success && result.user?.socialAccounts?.google?.accessToken) {
        const token = result.user.socialAccounts.google.accessToken;
        console.log('[GoogleBusiness] ✅ Retrieved access token from Firestore');
        console.log('[GoogleBusiness] 🔑 Token length:', token.length);
        
        // Cache it for future use
        this.accessToken = token;
        return token;
      } else {
        console.warn('[GoogleBusiness] ⚠️ No access token found in Firestore');
        console.log('[GoogleBusiness] 📊 User data:', {
          hasSocialAccounts: !!result.user?.socialAccounts,
          hasGoogle: !!result.user?.socialAccounts?.google,
          hasAccessToken: !!result.user?.socialAccounts?.google?.accessToken
        });
        return null;
      }
    } catch (error) {
      console.error('[GoogleBusiness] ❌ Error getting access token:', error);
      return null;
    }
  }

  /**
   * Set the OAuth access token (called after successful Google link)
   */
  setAccessToken(token: string) {
    console.log('[GoogleBusiness] 🔵 Setting OAuth access token');
    console.log('[GoogleBusiness] 🔑 Token length:', token.length);
    this.accessToken = token;
    console.log('[GoogleBusiness] ✅ Access token stored successfully');
  }

  /**
   * List all business locations for the authenticated account
   */
  async listLocations(): Promise<GoogleBusinessLocation[]> {
    console.log('[GoogleBusiness] 🔵 Listing business locations...');
    const token = await this.getAccessToken();
    if (!token) {
      console.error('[GoogleBusiness] ❌ No Google access token available');
      throw new Error('No Google access token available');
    }

    try {
      // First, get the account
      console.log('[GoogleBusiness] 🔵 Fetching Google Business accounts...');
      let accountsResponse = await fetch(
        'https://mybusinessaccountmanagement.googleapis.com/v1/accounts',
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('[GoogleBusiness] 🔵 Accounts response status:', accountsResponse.status);

      // Handle 401 Unauthorized - token expired
      if (accountsResponse.status === 401) {
        console.log('[GoogleBusiness] 🔄 Token expired, attempting refresh...');
        
        const { socialAuthService } = await import('./socialAuthService');
        const refreshResult = await socialAuthService.refreshGoogleToken();
        
        if (refreshResult.success && refreshResult.accessToken) {
          console.log('[GoogleBusiness] ✅ Token refreshed, retrying request...');
          this.accessToken = refreshResult.accessToken;
          
          // Retry the request with new token
          accountsResponse = await fetch(
            'https://mybusinessaccountmanagement.googleapis.com/v1/accounts',
            {
              headers: {
                'Authorization': `Bearer ${refreshResult.accessToken}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          if (!accountsResponse.ok) {
            const errorText = await accountsResponse.text();
            console.error('[GoogleBusiness] ❌ Failed after token refresh:', errorText);
            throw new Error('Failed to fetch accounts after token refresh: ' + errorText);
          }
        } else {
          throw new Error('Access token expired. Please reconnect your Google account.');
        }
      } else if (!accountsResponse.ok) {
        const errorText = await accountsResponse.text();
        console.error('[GoogleBusiness] ❌ Failed to fetch accounts:', {
          status: accountsResponse.status,
          statusText: accountsResponse.statusText,
          error: errorText
        });
        throw new Error('Failed to fetch accounts: ' + errorText);
      }

      const accountsData = await accountsResponse.json();
      console.log('[GoogleBusiness] 📊 Accounts data:', accountsData);
      const accounts = accountsData.accounts || [];
      
      if (accounts.length === 0) {
        console.warn('[GoogleBusiness] ⚠️ No Google Business accounts found');
        return [];
      }

      console.log('[GoogleBusiness] ✅ Found', accounts.length, 'account(s)');

      // Get locations for the first account
      const accountName = accounts[0].name;
      console.log('[GoogleBusiness] 🔵 Fetching locations for account:', accountName);
      
      const locationsResponse = await fetch(
        `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('[GoogleBusiness] 🔵 Locations response status:', locationsResponse.status);

      if (!locationsResponse.ok) {
        const errorText = await locationsResponse.text();
        console.error('[GoogleBusiness] ❌ Failed to fetch locations:', {
          status: locationsResponse.status,
          statusText: locationsResponse.statusText,
          error: errorText
        });
        throw new Error(`Failed to fetch locations: ${locationsResponse.statusText}`);
      }

      const locationsData = await locationsResponse.json();
      console.log('[GoogleBusiness] 📊 Locations data:', locationsData);
      const locations = locationsData.locations || [];
      console.log('[GoogleBusiness] ✅ Found', locations.length, 'location(s)');
      
      return locations;
    } catch (error) {
      console.error('[GoogleBusiness] ❌ Error listing locations:', error);
      throw error;
    }
  }

  /**
   * Get detailed information for a specific location
   */
  async getLocation(locationName: string): Promise<GoogleBusinessLocation | null> {
    const token = await this.getAccessToken();
    if (!token) {
      throw new Error('No Google access token available');
    }

    try {
      const response = await fetch(
        `https://mybusinessbusinessinformation.googleapis.com/v1/${locationName}?readMask=name,title,phoneNumbers,websiteUri,regularHours,specialHours,storefrontAddress,latlng,categories,attributes,metadata,profile`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch location: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[GoogleBusiness] Error getting location:', error);
      return null;
    }
  }

  /**
   * Get media (photos) for a location
   */
  async getLocationMedia(locationName: string): Promise<GoogleMediaItem[]> {
    const token = await this.getAccessToken();
    if (!token) {
      throw new Error('No Google access token available');
    }

    try {
      const response = await fetch(
        `https://mybusinessbusinessinformation.googleapis.com/v1/${locationName}/media`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch media: ${response.statusText}`);
      }

      const data = await response.json();
      return data.mediaItems || [];
    } catch (error) {
      console.error('[GoogleBusiness] Error getting media:', error);
      return [];
    }
  }

  /**
   * Get reviews data (rating and count) from Google My Business
   */
  async getReviewsData(locationName: string): Promise<GoogleReviewsData> {
    const token = await this.getAccessToken();
    if (!token) {
      throw new Error('No Google access token available');
    }

    try {
      // Note: The actual reviews endpoint might differ based on API version
      const response = await fetch(
        `https://mybusiness.googleapis.com/v4/${locationName}/reviews:aggregate`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        console.warn('[GoogleBusiness] Could not fetch reviews data');
        return {};
      }

      const data = await response.json();
      return {
        averageRating: data.averageRating,
        totalReviewCount: data.totalReviewCount
      };
    } catch (error) {
      console.error('[GoogleBusiness] Error getting reviews:', error);
      return {};
    }
  }

  /**
   * Sync Google Business Profile data to Fluzio user profile
   */
  async syncToProfile(userId: string, locationName?: string): Promise<SyncedGoogleData> {
    try {
      console.log('[GoogleBusiness] 🚀 Starting sync for user:', userId);

      // Get locations
      console.log('[GoogleBusiness] 🔵 Step 1: Fetching locations...');
      const locations = await this.listLocations();
      
      if (locations.length === 0) {
        console.error('[GoogleBusiness] ❌ No Google Business locations found');
        throw new Error('No Google Business locations found');
      }

      // Use specified location or first one
      const location = locationName 
        ? locations.find(l => l.name === locationName) || locations[0]
        : locations[0];

      console.log('[GoogleBusiness] ✅ Syncing location:', location.locationName);
      console.log('[GoogleBusiness] 📊 Location details:', {
        name: location.locationName,
        phone: location.primaryPhone,
        website: location.websiteUri,
        hasAddress: !!location.storefrontAddress,
        hasCategories: !!location.categories,
        attributeCount: location.attributes?.length || 0
      });

      // Get media (photos)
      console.log('[GoogleBusiness] 🔵 Step 2: Fetching photos...');
      const media = await this.getLocationMedia(location.name);
      console.log('[GoogleBusiness] ✅ Found', media.length, 'media items');

      // Get reviews data
      console.log('[GoogleBusiness] 🔵 Step 3: Fetching reviews data...');
      const reviewsData = await this.getReviewsData(location.name);
      console.log('[GoogleBusiness] ✅ Reviews data:', reviewsData);

      // Parse attributes into friendly format
      console.log('[GoogleBusiness] 🔵 Step 4: Parsing attributes...');
      const parsedAttributes = this.parseAttributes(location.attributes || []);
      console.log('[GoogleBusiness] ✅ Parsed', parsedAttributes.length, 'attributes');

      // Extract photos by category
      const photos = media
        .filter(m => m.mediaFormat === 'PHOTO' && m.googleUrl)
        .map(m => ({
          url: m.googleUrl!,
          category: m.locationAssociation?.category || 'OTHER',
          description: m.description
        }));
      console.log('[GoogleBusiness] ✅ Filtered to', photos.length, 'photos');

      // Build synced data
      const syncedData: SyncedGoogleData = {
        googleBusinessName: location.locationName,
        address: location.storefrontAddress,
        phone: location.primaryPhone,
        website: location.websiteUri,
        googleMapsLink: location.metadata?.mapsUri,
        openingHours: location.regularHours,
        specialHours: location.specialHours,
        googleAttributes: parsedAttributes,
        googlePhotos: photos,
        rating: reviewsData.averageRating,
        reviewCount: reviewsData.totalReviewCount,
        businessDescription: location.profile?.description,
        categories: [
          location.categories?.primaryCategory?.displayName,
          ...(location.categories?.additionalCategories?.map(c => c.displayName) || [])
        ].filter(Boolean) as string[],
        lastGoogleSync: new Date().toISOString(),
        googlePlaceId: location.metadata?.mapsUri?.match(/place_id=([^&]+)/)?.[1]
      };

      console.log('[GoogleBusiness] 📊 Synced data summary:', {
        businessName: syncedData.googleBusinessName,
        hasAddress: !!syncedData.address,
        hasPhone: !!syncedData.phone,
        hasWebsite: !!syncedData.website,
        rating: syncedData.rating,
        reviewCount: syncedData.reviewCount,
        attributeCount: syncedData.googleAttributes?.length || 0,
        photoCount: syncedData.googlePhotos?.length || 0
      });

      // Update user profile in Firestore via API
      console.log('[GoogleBusiness] 🔵 Step 5: Updating Firestore...');
      await api.updateUser(userId, {
        ...syncedData
      });

      console.log('[GoogleBusiness] ✅ Sync completed successfully');
      return syncedData;
    } catch (error) {
      console.error('[GoogleBusiness] ❌ Sync failed:', error);
      throw error;
    }
  }

  /**
   * Parse Google attributes into friendly format
   */
  private parseAttributes(attributes: GoogleAttribute[]): Array<{
    key: string;
    displayName: string;
    group: string;
    value: any;
  }> {
    return attributes.map(attr => {
      // Extract attribute key from name (e.g., "accounts/123/attributes/women_owned" -> "women_owned")
      const key = attr.name.split('/').pop() || attr.name;
      
      return {
        key,
        displayName: attr.displayName || this.formatAttributeName(key),
        group: attr.groupDisplayName || 'Other',
        value: attr.values?.[0] || true
      };
    });
  }

  /**
   * Format attribute name for display
   */
  private formatAttributeName(key: string): string {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Get popular Google attributes that create trust
   */
  getPopularAttributes(attributes: SyncedGoogleData['googleAttributes']): string[] {
    if (!attributes) return [];

    const popularKeys = [
      'women_owned',
      'lgbtq_friendly',
      'black_owned',
      'veteran_owned',
      'asian_owned',
      'latino_owned',
      'wheelchair_accessible',
      'delivery',
      'pickup',
      'online_appointments',
      'in_store_shopping',
      'free_wifi',
      'free_parking'
    ];

    return attributes
      .filter(attr => popularKeys.includes(attr.key) && attr.value)
      .map(attr => attr.displayName);
  }
}

export const googleBusinessService = new GoogleBusinessService();
