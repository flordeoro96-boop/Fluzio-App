/**
 * Firebase Cloud Functions API Configuration
 * 
 * Centralized configuration for all backend API calls
 * Update FIREBASE_PROJECT_ID before deployment
 */

// Firebase project ID configured on December 19, 2025
const FIREBASE_PROJECT_ID = 'fluzio-13af2';

// Cloud Functions region
const FUNCTIONS_REGION = 'us-central1';

// Base URL for Cloud Functions
export const FUNCTIONS_BASE_URL = `https://${FUNCTIONS_REGION}-${FIREBASE_PROJECT_ID}.cloudfunctions.net`;

/**
 * Get full URL for a Cloud Function endpoint
 */
export const getFunctionUrl = (functionName: string): string => {
  return `${FUNCTIONS_BASE_URL}/${functionName}`;
};

/**
 * Cloud Function endpoints
 */
export const ENDPOINTS = {
  // Cohorts
  createCityCohort: getFunctionUrl('createCityCohort'),
  getCityCohorts: getFunctionUrl('getCityCohorts'),
  updateCityCohort: getFunctionUrl('updateCityCohort'),
  activateCohort: getFunctionUrl('activateCohort'),
  getCohortStats: getFunctionUrl('getCohortStats'),
  
  // Events - Admin
  createEvent: getFunctionUrl('createEvent'),
  updateEvent: getFunctionUrl('updateEvent'),
  publishEvent: getFunctionUrl('publishEvent'),
  getEvents: getFunctionUrl('getEvents'),
  checkInAttendee: getFunctionUrl('checkInAttendee'),
  
  // Events - Business
  registerForEvent: getFunctionUrl('registerForEvent'),
  cancelEventRegistration: getFunctionUrl('cancelEventRegistration'),
  getAvailableEvents: getFunctionUrl('getAvailableEvents'),
  getMyTickets: getFunctionUrl('getMyTickets'),
  getMyEntitlements: getFunctionUrl('getMyEntitlements'),
} as const;

/**
 * Check if Firebase is configured
 */
export const isFirebaseConfigured = (): boolean => {
  return true; // Project ID is configured
};

/**
 * Get project configuration status
 */
export const getConfigStatus = () => {
  return {
    projectId: FIREBASE_PROJECT_ID,
    configured: isFirebaseConfigured(),
    region: FUNCTIONS_REGION,
    baseUrl: FUNCTIONS_BASE_URL
  };
};
