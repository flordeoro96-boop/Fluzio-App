/**
 * Social Media Authentication Service
 * Handles OAuth connections for Google, Facebook, and other platforms
 */

import { 
  GoogleAuthProvider, 
  FacebookAuthProvider,
  linkWithPopup,
  unlink,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from './AuthContext';
import { api } from './apiService';

export interface SocialLinkResult {
  success: boolean;
  provider: string;
  displayName?: string;
  photoURL?: string;
  providerUserId?: string;
  url?: string;
  error?: string;
}

class SocialAuthService {
  /**
   * Link Google account to current Firebase user
   */
  async linkGoogle(): Promise<SocialLinkResult> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user');
      }

      console.log('[SocialAuth] Linking Google account...');
      
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      
      // Add Google Business Profile scope for location data
      provider.addScope('https://www.googleapis.com/auth/business.manage');
      
      const result = await linkWithPopup(currentUser, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      
      if (!credential) {
        throw new Error('No credential returned from Google');
      }

      // Extract user info
      const googleUser = result.user;
      const displayName = googleUser.displayName || '';
      const email = googleUser.email || '';
      const photoURL = googleUser.photoURL || '';
      const providerData = googleUser.providerData.find(p => p.providerId === 'google.com');
      const providerUserId = providerData?.uid || '';

      console.log('[SocialAuth] Google linked successfully:', { displayName, email, providerUserId });

      // Update backend with Google connection
      await this.updateSocialAccount('google', {
        handle: email || displayName, // Use email as handle for Google
        url: '', // Google doesn't have a public profile URL like social media
        providerUserId,
        connected: true,
        lastSyncedAt: new Date().toISOString(),
        displayName,
        photoURL
      });

      return {
        success: true,
        provider: 'google',
        displayName,
        photoURL,
        providerUserId,
        url: ''
      };
    } catch (error: any) {
      console.error('[SocialAuth] Google link error:', error);
      
      // Handle specific errors
      if (error.code === 'auth/credential-already-in-use') {
        return {
          success: false,
          provider: 'google',
          error: 'This Google account is already linked to another user'
        };
      }
      
      if (error.code === 'auth/provider-already-linked') {
        return {
          success: false,
          provider: 'google',
          error: 'A Google account is already linked to your profile'
        };
      }

      return {
        success: false,
        provider: 'google',
        error: error.message || 'Failed to link Google account'
      };
    }
  }

  /**
   * Unlink Google account from current Firebase user
   */
  async unlinkGoogle(): Promise<SocialLinkResult> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user');
      }

      console.log('[SocialAuth] Unlinking Google account...');
      
      await unlink(currentUser, 'google.com');

      // Update backend to remove Google connection
      await this.updateSocialAccount('google', {
        connected: false
      });

      console.log('[SocialAuth] Google unlinked successfully');

      return {
        success: true,
        provider: 'google'
      };
    } catch (error: any) {
      console.error('[SocialAuth] Google unlink error:', error);
      
      if (error.code === 'auth/no-such-provider') {
        return {
          success: false,
          provider: 'google',
          error: 'No Google account is currently linked'
        };
      }

      return {
        success: false,
        provider: 'google',
        error: error.message || 'Failed to unlink Google account'
      };
    }
  }

  /**
   * Link Facebook account to current Firebase user
   */
  async linkFacebook(): Promise<SocialLinkResult> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user');
      }

      console.log('[SocialAuth] Linking Facebook account...');
      
      const provider = new FacebookAuthProvider();
      provider.addScope('public_profile');
      provider.addScope('email');
      // Add Facebook Pages scope for business page access
      provider.addScope('pages_show_list');
      provider.addScope('pages_read_engagement');
      
      const result = await linkWithPopup(currentUser, provider);
      const credential = FacebookAuthProvider.credentialFromResult(result);
      
      if (!credential) {
        throw new Error('No credential returned from Facebook');
      }

      // Extract user info
      const facebookUser = result.user;
      const displayName = facebookUser.displayName || '';
      const email = facebookUser.email || '';
      const photoURL = facebookUser.photoURL || '';
      const providerData = facebookUser.providerData.find(p => p.providerId === 'facebook.com');
      const providerUserId = providerData?.uid || '';
      
      // Construct Facebook profile URL
      const url = providerUserId ? `https://www.facebook.com/${providerUserId}` : '';

      console.log('[SocialAuth] Facebook linked successfully:', { displayName, email, providerUserId });

      // Update backend with Facebook connection
      await this.updateSocialAccount('facebook', {
        handle: displayName || email, // Use display name or email as handle
        url,
        providerUserId,
        connected: true,
        lastSyncedAt: new Date().toISOString(),
        displayName,
        photoURL
      });

      return {
        success: true,
        provider: 'facebook',
        displayName,
        photoURL,
        providerUserId,
        url
      };
    } catch (error: any) {
      console.error('[SocialAuth] Facebook link error:', error);
      
      // Handle specific errors
      if (error.code === 'auth/credential-already-in-use') {
        return {
          success: false,
          provider: 'facebook',
          error: 'This Facebook account is already linked to another user'
        };
      }
      
      if (error.code === 'auth/provider-already-linked') {
        return {
          success: false,
          provider: 'facebook',
          error: 'A Facebook account is already linked to your profile'
        };
      }

      if (error.code === 'auth/popup-closed-by-user') {
        return {
          success: false,
          provider: 'facebook',
          error: 'Login popup was closed before completing'
        };
      }

      return {
        success: false,
        provider: 'facebook',
        error: error.message || 'Failed to link Facebook account'
      };
    }
  }

  /**
   * Unlink Facebook account from current Firebase user
   */
  async unlinkFacebook(): Promise<SocialLinkResult> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user');
      }

      console.log('[SocialAuth] Unlinking Facebook account...');
      
      await unlink(currentUser, 'facebook.com');

      // Update backend to remove Facebook connection
      await this.updateSocialAccount('facebook', {
        connected: false
      });

      console.log('[SocialAuth] Facebook unlinked successfully');

      return {
        success: true,
        provider: 'facebook'
      };
    } catch (error: any) {
      console.error('[SocialAuth] Facebook unlink error:', error);
      
      if (error.code === 'auth/no-such-provider') {
        return {
          success: false,
          provider: 'facebook',
          error: 'No Facebook account is currently linked'
        };
      }

      return {
        success: false,
        provider: 'facebook',
        error: error.message || 'Failed to unlink Facebook account'
      };
    }
  }

  /**
   * Link TikTok account via OAuth 2.0
   */
  async linkTikTok(): Promise<SocialLinkResult> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user');
      }

      console.log('[SocialAuth] Initiating TikTok OAuth...');
      
      // TikTok OAuth configuration
      const clientKey = import.meta.env.VITE_TIKTOK_CLIENT_KEY;
      const redirectUri = `${window.location.origin}/auth/tiktok/callback`;
      const state = this.generateState();
      
      // Store state for verification
      sessionStorage.setItem('tiktok_oauth_state', state);
      sessionStorage.setItem('tiktok_oauth_userId', currentUser.uid);
      
      // TikTok OAuth endpoint
      const scope = 'user.info.basic,video.list'; // Basic profile and video permissions
      const authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&scope=${scope}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
      
      // Redirect to TikTok OAuth
      window.location.href = authUrl;
      
      return {
        success: true,
        provider: 'tiktok'
      };
    } catch (error: any) {
      console.error('[SocialAuth] TikTok link error:', error);
      return {
        success: false,
        provider: 'tiktok',
        error: error.message || 'Failed to initiate TikTok connection'
      };
    }
  }

  /**
   * Handle TikTok OAuth callback
   */
  async handleTikTokCallback(code: string, state: string): Promise<SocialLinkResult> {
    try {
      const storedState = sessionStorage.getItem('tiktok_oauth_state');
      const userId = sessionStorage.getItem('tiktok_oauth_userId');
      
      if (state !== storedState) {
        throw new Error('Invalid state parameter');
      }
      
      if (!userId) {
        throw new Error('User ID not found');
      }
      
      // Exchange code for access token via backend
      // TODO: Implement backend endpoint
      const response: any = { success: false, error: 'Backend endpoint not implemented' }; // await api.exchangeTikTokCode(userId, code);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to exchange TikTok code');
      }
      
      const { accessToken, openId, displayName, avatarUrl } = response.data;
      
      // Update backend with TikTok connection
      await this.updateSocialAccount('tiktok', {
        handle: displayName || openId,
        url: `https://www.tiktok.com/@${displayName}`,
        providerUserId: openId,
        connected: true,
        lastSyncedAt: new Date().toISOString(),
        displayName,
        photoURL: avatarUrl,
        accessToken: accessToken // Encrypted in backend
      });
      
      // Clear session storage
      sessionStorage.removeItem('tiktok_oauth_state');
      sessionStorage.removeItem('tiktok_oauth_userId');
      
      console.log('[SocialAuth] TikTok linked successfully');
      
      return {
        success: true,
        provider: 'tiktok',
        displayName,
        photoURL: avatarUrl,
        providerUserId: openId,
        url: `https://www.tiktok.com/@${displayName}`
      };
    } catch (error: any) {
      console.error('[SocialAuth] TikTok callback error:', error);
      
      // Clear session storage on error
      sessionStorage.removeItem('tiktok_oauth_state');
      sessionStorage.removeItem('tiktok_oauth_userId');
      
      return {
        success: false,
        provider: 'tiktok',
        error: error.message || 'Failed to link TikTok account'
      };
    }
  }

  /**
   * Unlink TikTok account
   */
  async unlinkTikTok(): Promise<SocialLinkResult> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user');
      }

      console.log('[SocialAuth] Unlinking TikTok account...');
      
      // Revoke access token via backend
      // TODO: Implement backend endpoint
      // await api.revokeTikTokAccess(currentUser.uid);
      
      // Update backend to remove TikTok connection
      await this.updateSocialAccount('tiktok', {
        connected: false
      });

      console.log('[SocialAuth] TikTok unlinked successfully');

      return {
        success: true,
        provider: 'tiktok'
      };
    } catch (error: any) {
      console.error('[SocialAuth] TikTok unlink error:', error);
      return {
        success: false,
        provider: 'tiktok',
        error: error.message || 'Failed to unlink TikTok account'
      };
    }
  }

  /**
   * Link Twitter/X account via OAuth 2.0
   */
  async linkTwitter(): Promise<SocialLinkResult> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user');
      }

      console.log('[SocialAuth] Initiating Twitter OAuth...');
      
      // Twitter OAuth 2.0 configuration
      const clientId = import.meta.env.VITE_TWITTER_CLIENT_ID;
      const redirectUri = `${window.location.origin}/auth/twitter/callback`;
      const state = this.generateState();
      const codeVerifier = this.generateCodeVerifier();
      const codeChallenge = await this.generateCodeChallenge(codeVerifier);
      
      // Store for verification
      sessionStorage.setItem('twitter_oauth_state', state);
      sessionStorage.setItem('twitter_code_verifier', codeVerifier);
      sessionStorage.setItem('twitter_oauth_userId', currentUser.uid);
      
      // Twitter OAuth 2.0 endpoint with PKCE
      const scope = 'tweet.read users.read follows.read offline.access';
      const authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`;
      
      // Redirect to Twitter OAuth
      window.location.href = authUrl;
      
      return {
        success: true,
        provider: 'twitter'
      };
    } catch (error: any) {
      console.error('[SocialAuth] Twitter link error:', error);
      return {
        success: false,
        provider: 'twitter',
        error: error.message || 'Failed to initiate Twitter connection'
      };
    }
  }

  /**
   * Handle Twitter OAuth callback
   */
  async handleTwitterCallback(code: string, state: string): Promise<SocialLinkResult> {
    try {
      const storedState = sessionStorage.getItem('twitter_oauth_state');
      const codeVerifier = sessionStorage.getItem('twitter_code_verifier');
      const userId = sessionStorage.getItem('twitter_oauth_userId');
      
      if (state !== storedState) {
        throw new Error('Invalid state parameter');
      }
      
      if (!userId || !codeVerifier) {
        throw new Error('Missing OAuth parameters');
      }
      
      // Exchange code for access token via backend
      // TODO: Implement backend endpoint
      const response: any = { success: false, error: 'Backend endpoint not implemented' }; // await api.exchangeTwitterCode(userId, code, codeVerifier);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to exchange Twitter code');
      }
      
      const { accessToken, username, displayName, profileImageUrl, userId: twitterUserId } = response.data;
      
      // Update backend with Twitter connection
      await this.updateSocialAccount('twitter', {
        handle: username,
        url: `https://twitter.com/${username}`,
        providerUserId: twitterUserId,
        connected: true,
        lastSyncedAt: new Date().toISOString(),
        displayName,
        photoURL: profileImageUrl,
        accessToken: accessToken // Encrypted in backend
      });
      
      // Clear session storage
      sessionStorage.removeItem('twitter_oauth_state');
      sessionStorage.removeItem('twitter_code_verifier');
      sessionStorage.removeItem('twitter_oauth_userId');
      
      console.log('[SocialAuth] Twitter linked successfully');
      
      return {
        success: true,
        provider: 'twitter',
        displayName,
        photoURL: profileImageUrl,
        providerUserId: twitterUserId,
        url: `https://twitter.com/${username}`
      };
    } catch (error: any) {
      console.error('[SocialAuth] Twitter callback error:', error);
      
      // Clear session storage on error
      sessionStorage.removeItem('twitter_oauth_state');
      sessionStorage.removeItem('twitter_code_verifier');
      sessionStorage.removeItem('twitter_oauth_userId');
      
      return {
        success: false,
        provider: 'twitter',
        error: error.message || 'Failed to link Twitter account'
      };
    }
  }

  /**
   * Unlink Twitter account
   */
  async unlinkTwitter(): Promise<SocialLinkResult> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user');
      }

      console.log('[SocialAuth] Unlinking Twitter account...');
      
      // Revoke access token via backend
      // TODO: Implement backend endpoint
      // await api.revokeTwitterAccess(currentUser.uid);
      
      // Update backend to remove Twitter connection
      await this.updateSocialAccount('twitter', {
        connected: false
      });

      console.log('[SocialAuth] Twitter unlinked successfully');

      return {
        success: true,
        provider: 'twitter'
      };
    } catch (error: any) {
      console.error('[SocialAuth] Twitter unlink error:', error);
      return {
        success: false,
        provider: 'twitter',
        error: error.message || 'Failed to unlink Twitter account'
      };
    }
  }

  /**
   * Link LinkedIn account via OAuth 2.0
   */
  async linkLinkedIn(): Promise<SocialLinkResult> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user');
      }

      console.log('[SocialAuth] Initiating LinkedIn OAuth...');
      
      // LinkedIn OAuth configuration
      const clientId = import.meta.env.VITE_LINKEDIN_CLIENT_ID;
      const redirectUri = `${window.location.origin}/auth/linkedin/callback`;
      const state = this.generateState();
      
      // Store state for verification
      sessionStorage.setItem('linkedin_oauth_state', state);
      sessionStorage.setItem('linkedin_oauth_userId', currentUser.uid);
      
      // LinkedIn OAuth endpoint
      const scope = 'openid profile email w_member_social'; // Profile and posting permissions
      const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${encodeURIComponent(scope)}`;
      
      // Redirect to LinkedIn OAuth
      window.location.href = authUrl;
      
      return {
        success: true,
        provider: 'linkedin'
      };
    } catch (error: any) {
      console.error('[SocialAuth] LinkedIn link error:', error);
      return {
        success: false,
        provider: 'linkedin',
        error: error.message || 'Failed to initiate LinkedIn connection'
      };
    }
  }

  /**
   * Handle LinkedIn OAuth callback
   */
  async handleLinkedInCallback(code: string, state: string): Promise<SocialLinkResult> {
    try {
      const storedState = sessionStorage.getItem('linkedin_oauth_state');
      const userId = sessionStorage.getItem('linkedin_oauth_userId');
      
      if (state !== storedState) {
        throw new Error('Invalid state parameter');
      }
      
      if (!userId) {
        throw new Error('User ID not found');
      }
      
      // Exchange code for access token via backend
      // TODO: Implement backend endpoint
      const response: any = { success: false, error: 'Backend endpoint not implemented' }; // await api.exchangeLinkedInCode(userId, code);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to exchange LinkedIn code');
      }
      
      const { accessToken, sub, name, picture } = response.data;
      
      // Update backend with LinkedIn connection
      await this.updateSocialAccount('linkedin', {
        handle: name,
        url: `https://www.linkedin.com/in/${sub}`,
        providerUserId: sub,
        connected: true,
        lastSyncedAt: new Date().toISOString(),
        displayName: name,
        photoURL: picture,
        accessToken: accessToken // Encrypted in backend
      });
      
      // Clear session storage
      sessionStorage.removeItem('linkedin_oauth_state');
      sessionStorage.removeItem('linkedin_oauth_userId');
      
      console.log('[SocialAuth] LinkedIn linked successfully');
      
      return {
        success: true,
        provider: 'linkedin',
        displayName: name,
        photoURL: picture,
        providerUserId: sub,
        url: `https://www.linkedin.com/in/${sub}`
      };
    } catch (error: any) {
      console.error('[SocialAuth] LinkedIn callback error:', error);
      
      // Clear session storage on error
      sessionStorage.removeItem('linkedin_oauth_state');
      sessionStorage.removeItem('linkedin_oauth_userId');
      
      return {
        success: false,
        provider: 'linkedin',
        error: error.message || 'Failed to link LinkedIn account'
      };
    }
  }

  /**
   * Unlink LinkedIn account
   */
  async unlinkLinkedIn(): Promise<SocialLinkResult> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user');
      }

      console.log('[SocialAuth] Unlinking LinkedIn account...');
      
      // Revoke access token via backend
      // TODO: Implement backend endpoint
      // await api.revokeLinkedInAccess(currentUser.uid);
      
      // Update backend to remove LinkedIn connection
      await this.updateSocialAccount('linkedin', {
        connected: false
      });

      console.log('[SocialAuth] LinkedIn unlinked successfully');

      return {
        success: true,
        provider: 'linkedin'
      };
    } catch (error: any) {
      console.error('[SocialAuth] LinkedIn unlink error:', error);
      return {
        success: false,
        provider: 'linkedin',
        error: error.message || 'Failed to unlink LinkedIn account'
      };
    }
  }

  /**
   * Generate random state for OAuth
   */
  private generateState(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Generate code verifier for PKCE (Twitter OAuth 2.0)
   */
  private generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return this.base64URLEncode(array);
  }

  /**
   * Generate code challenge from verifier for PKCE
   */
  private async generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return this.base64URLEncode(new Uint8Array(hash));
  }

  /**
   * Base64 URL encode
   */
  private base64URLEncode(buffer: Uint8Array): string {
    return btoa(String.fromCharCode(...buffer))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Update social account data in backend
   */
  private async updateSocialAccount(
    platform: 'google' | 'facebook' | 'instagram' | 'tiktok' | 'twitter' | 'linkedin',
    data: any
  ): Promise<void> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('No authenticated user');
    }

    try {
      console.log(`[SocialAuth] Updating ${platform} account in backend:`, data);
      
      await api.updateUser(currentUser.uid, {
        socialAccounts: {
          [platform]: data
        }
      });

      console.log(`[SocialAuth] ${platform} account updated successfully`);
    } catch (error) {
      console.error(`[SocialAuth] Failed to update ${platform} account:`, error);
      throw error;
    }
  }

  /**
   * Check if a provider is already linked
   */
  isProviderLinked(providerId: string): boolean {
    const currentUser = auth.currentUser;
    if (!currentUser) return false;

    return currentUser.providerData.some(p => p.providerId === providerId);
  }

  /**
   * Get all linked providers
   */
  getLinkedProviders(): string[] {
    const currentUser = auth.currentUser;
    if (!currentUser) return [];

    return currentUser.providerData.map(p => p.providerId);
  }
}

export const socialAuthService = new SocialAuthService();
