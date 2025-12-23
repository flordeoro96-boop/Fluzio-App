/**
 * Geographic Targeting Service
 * 
 * Calculates mission visibility based on:
 * - Business type (Physical/Online/Hybrid)
 * - Subscription level (Free/Silver/Gold/Platinum)
 * - User location
 */

export type BusinessType = 'PHYSICAL' | 'ONLINE' | 'HYBRID';
export type GeoScope = 'CITY' | 'REGION' | 'COUNTRY' | 'MULTI_COUNTRY' | 'GLOBAL';
export type SubscriptionTier = 'FREE' | 'SILVER' | 'GOLD' | 'PLATINUM';

/**
 * Get geographic scope based on business type and subscription
 */
export const getGeoScope = (
  businessType: BusinessType,
  subscription: SubscriptionTier
): GeoScope => {
  // Online businesses always have global reach
  if (businessType === 'ONLINE') {
    return 'GLOBAL';
  }

  // Physical and Hybrid businesses depend on subscription
  switch (subscription) {
    case 'FREE':
      return 'CITY'; // City only
    
    case 'SILVER':
      return 'REGION'; // Same region/state
    
    case 'GOLD':
      return 'COUNTRY'; // Entire country
    
    case 'PLATINUM':
      return 'GLOBAL'; // Worldwide
    
    default:
      return 'CITY';
  }
};

/**
 * Geographic scope descriptions for UI
 */
export const GEO_SCOPE_LABELS: Record<GeoScope, string> = {
  CITY: 'Your city only',
  REGION: 'Your region',
  COUNTRY: 'Nationwide',
  MULTI_COUNTRY: 'Selected countries',
  GLOBAL: 'Worldwide'
};

/**
 * Geographic scope details for subscription tiers
 */
export const SUBSCRIPTION_GEO_BENEFITS: Record<SubscriptionTier, {
  physical: string;
  online: string;
  radius?: string;
}> = {
  FREE: {
    physical: 'City only (where your business is located)',
    online: 'Global reach',
    radius: '20km from business location'
  },
  SILVER: {
    physical: 'Regional reach (your state/region)',
    online: 'Global reach',
    radius: '100km from business location'
  },
  GOLD: {
    physical: 'Nationwide (entire country)',
    online: 'Global reach',
    radius: 'Unlimited within country'
  },
  PLATINUM: {
    physical: 'Global reach (all countries)',
    online: 'Global reach',
    radius: 'Unlimited worldwide'
  }
};

/**
 * Check if mission is visible to user based on geography
 */
export const isMissionVisibleToUser = (
  mission: {
    businessType?: BusinessType;
    geoScope?: GeoScope;
    city?: string;
    businessCity?: string;
    businessCountry?: string;
    targetCountries?: string[];
  },
  user: {
    city: string;
    country?: string;
  }
): boolean => {
  // Online businesses - always visible
  if (mission.businessType === 'ONLINE') {
    return true;
  }

  // Check based on geographic scope
  switch (mission.geoScope) {
    case 'CITY':
      // Must be in same city
      return mission.city === user.city || mission.businessCity === user.city;
    
    case 'REGION':
      // Same country (region targeting not fully implemented, using country as proxy)
      return mission.businessCountry === user.country;
    
    case 'COUNTRY':
      // Same country
      return mission.businessCountry === user.country;
    
    case 'MULTI_COUNTRY':
      // User's country must be in target list
      return mission.targetCountries?.includes(user.country || '') || false;
    
    case 'GLOBAL':
      // Visible to everyone
      return true;
    
    default:
      // Fallback to city matching
      return mission.city === user.city || mission.businessCity === user.city;
  }
};

/**
 * Get available countries for targeting (for GOLD tier multi-country selection)
 */
export const AVAILABLE_COUNTRIES = [
  'Germany',
  'France',
  'Italy',
  'Spain',
  'Portugal',
  'Netherlands',
  'Belgium',
  'Austria',
  'Switzerland',
  'Greece',
  'Poland',
  'Czech Republic',
  'Hungary',
  'Romania',
  'United Kingdom',
  'Ireland',
  'Denmark',
  'Sweden',
  'Norway',
  'Finland',
  'United States',
  'Canada',
  'Mexico',
  'Brazil',
  'Argentina',
  'Japan',
  'South Korea',
  'Australia',
  'New Zealand',
  'Singapore'
];

/**
 * Get country limit based on subscription
 */
export const getCountryLimit = (subscription: SubscriptionTier): number => {
  switch (subscription) {
    case 'FREE':
      return 0; // City only
    case 'SILVER':
      return 1; // Home country only
    case 'GOLD':
      return 10; // Up to 10 countries
    case 'PLATINUM':
      return 999; // Unlimited
    default:
      return 0;
  }
};
