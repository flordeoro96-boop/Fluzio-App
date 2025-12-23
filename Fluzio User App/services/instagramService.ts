import { db } from './AuthContext';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

const FACEBOOK_APP_ID = '1247527037206389';
const REDIRECT_URI = 'https://fluzio-13af2.web.app/instagram/callback';
const INSTAGRAM_CALLBACK_URL = 'https://us-central1-fluzio-13af2.cloudfunctions.net/instagramcallback';

/**
 * Enhanced error messages for better user experience
 */
const getEnhancedErrorMessage = (error: any): { title: string; message: string; action?: string } => {
  const errorStr = error?.message || error?.toString() || '';
  
  // Access denied / User cancelled
  if (errorStr.includes('access_denied') || errorStr.includes('user_denied')) {
    return {
      title: 'Connection Cancelled',
      message: 'You cancelled the Instagram connection. No worries! You can try again whenever you\'re ready.',
      action: 'Click "Connect Instagram" to try again'
    };
  }
  
  // Invalid redirect URI
  if (errorStr.includes('redirect_uri') || errorStr.includes('Invalid URI')) {
    return {
      title: 'Configuration Error',
      message: 'There\'s a technical issue with the Instagram connection. Our team has been notified.',
      action: 'Please try again in a few minutes or contact support'
    };
  }
  
  // Code expired
  if (errorStr.includes('expired') || errorStr.includes('Code was already redeemed')) {
    return {
      title: 'Session Expired',
      message: 'The connection took too long to complete. Instagram authorization codes expire quickly.',
      action: 'Please click "Connect Instagram" and complete the process within 60 seconds'
    };
  }
  
  // Network errors
  if (errorStr.includes('network') || errorStr.includes('fetch') || errorStr.includes('CORS')) {
    return {
      title: 'Connection Issue',
      message: 'Unable to reach Instagram servers. Please check your internet connection.',
      action: 'Try again in a moment when your connection is stable'
    };
  }
  
  // Invalid platform app
  if (errorStr.includes('Invalid platform app') || errorStr.includes('Invalid client')) {
    return {
      title: 'App Configuration Error',
      message: 'The Instagram app configuration needs to be updated. Our technical team has been notified.',
      action: 'Please try again later or contact support if this persists'
    };
  }
  
  // Token/Permission errors
  if (errorStr.includes('Invalid access token') || errorStr.includes('insufficient permissions')) {
    return {
      title: 'Permission Error',
      message: 'Instagram didn\'t grant the required permissions. Make sure to approve all requested permissions.',
      action: 'Click "Connect Instagram" and approve all permissions when asked'
    };
  }
  
  // Rate limiting
  if (errorStr.includes('rate limit') || errorStr.includes('too many requests')) {
    return {
      title: 'Too Many Attempts',
      message: 'You\'ve tried connecting too many times in a short period.',
      action: 'Please wait 15-30 minutes before trying again'
    };
  }
  
  // Generic error with helpful message
  return {
    title: 'Connection Failed',
    message: errorStr || 'An unexpected error occurred while connecting to Instagram.',
    action: 'Please try again. If the problem persists, contact our support team'
  };
};

export interface InstagramData {
  connected: boolean;
  username?: string;
  id?: string;
  accountType?: 'PERSONAL' | 'BUSINESS' | 'CREATOR';
  profilePicture?: string;
  followers?: number;
  postsSyncedAt?: Date;
  longLivedToken?: string;
  tokenExpiresAt?: Date;
  error?: string;
}

export interface InstagramPost {
  id: string;
  caption?: string;
  media_url: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  thumbnail_url?: string;
  permalink: string;
  timestamp?: string;
}

export const InstagramService = {
  /**
   * Start Instagram OAuth flow
   * Redirects user to Instagram authorization page
   */
  startAuthFlow: (userId: string) => {
    // Store userId in localStorage so callback can retrieve it
    localStorage.setItem('instagram_oauth_userId', userId);
    
    // Instagram Graph API via Facebook Login (Basic Display deprecated Dec 2024)
    const scopes = ['instagram_basic', 'pages_show_list'];
    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${scopes.join(',')}&response_type=code`;
    
    console.log('[Instagram] ===== OAuth Flow Starting =====');
    console.log('[Instagram] User ID:', userId);
    console.log('[Instagram] Using Facebook Login for Instagram Graph API');
    console.log('[Instagram] App ID:', FACEBOOK_APP_ID);
    console.log('[Instagram] Redirect URI:', REDIRECT_URI);
    console.log('[Instagram] Scopes:', scopes.join(','));
    console.log('[Instagram] Full Auth URL:', authUrl);
    console.log('[Instagram] ===== Redirecting to Facebook =====');
    
    window.location.href = authUrl;
  },

  /**
   * Complete OAuth callback flow and save to Firestore
   */
  handleOAuthCallback: async (code: string, userId: string): Promise<void> => {
    try {
      console.log('[Instagram] Handling OAuth callback for user:', userId);

      // Call the backend function to handle token exchange
      const response = await fetch(INSTAGRAM_CALLBACK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, userId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.message || `Server error: ${response.status}`;
        
        console.error('[Instagram] Backend error:', errorMessage);
        
        // Enhance the error message for users
        const enhanced = getEnhancedErrorMessage(new Error(errorMessage));
        const detailedError = new Error(enhanced.message);
        (detailedError as any).title = enhanced.title;
        (detailedError as any).action = enhanced.action;
        
        throw detailedError;
      }

      const data = await response.json();
      console.log('[Instagram] ✅ Successfully connected:', data.instagram.username);
    } catch (error: any) {
      console.error('[Instagram] ❌ OAuth callback failed:', error);
      
      // If error doesn't already have enhanced info, add it
      if (!error.title) {
        const enhanced = getEnhancedErrorMessage(error);
        error.message = enhanced.message;
        error.title = enhanced.title;
        error.action = enhanced.action;
      }
      
      throw error;
    }
  },

  /**
   * Get Instagram data from Firestore
   */
  getUserInstagramData: async (userId: string): Promise<InstagramData | null> => {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return null;
    }

    const data = userDoc.data();
    const socialAccounts = data.socialAccounts;
    const instagram = socialAccounts?.instagram;

    if (!instagram || !instagram.connected) {
      return null;
    }

    // Convert Firestore Timestamps to Dates if needed
    return {
      connected: true,
      username: instagram.username,
      id: instagram.userId,
      accountType: instagram.accountType,
      followers: instagram.mediaCount,
      ...instagram
    };
  },

  /**
   * Disconnect Instagram
   */
  disconnectInstagram: async (userId: string): Promise<void> => {
    console.log('[Instagram] Disconnecting for user:', userId);

    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      'socialAccounts.instagram': {
        connected: false
      }
    });

    console.log('[Instagram] ✅ Disconnected');
  },
};
