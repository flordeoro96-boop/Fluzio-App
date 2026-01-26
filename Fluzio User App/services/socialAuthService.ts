/**
 * Simplified Social Auth Service
 * Only keeps Google authentication for Google Business sync
 * All other social media platforms (Instagram, Facebook, Twitter, TikTok, LinkedIn) removed
 */

import { getAuth } from './authCompat';
import { GoogleAuthProvider, linkWithPopup, unlink, OAuthCredential } from './authCompat';

const auth = getAuth();

export class SocialAuthService {
  // Google OAuth
  async linkGoogle() {
    try {
      if (!auth.currentUser) {
        return { success: false, error: 'Not authenticated' };
      }

      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/business.manage');
      
      const result = await linkWithPopup(auth.currentUser, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result) as OAuthCredential;
      
      return {
        success: true,
        accessToken: credential.accessToken,
        user: result.user
      };
    } catch (error: any) {
      console.error('[SocialAuthService] Google link error:', error);
      return { success: false, error: error.message };
    }
  }

  async unlinkGoogle() {
    try {
      if (!auth.currentUser) {
        return { success: false, error: 'Not authenticated' };
      }

      await unlink(auth.currentUser, 'google.com');
      return { success: true };
    } catch (error: any) {
      console.error('[SocialAuthService] Google unlink error:', error);
      return { success: false, error: error.message };
    }
  }

  // Removed platform stubs (Instagram, Facebook, Twitter, TikTok, LinkedIn)
  // All external social media integrations have been removed
}

export const socialAuthService = new SocialAuthService();
