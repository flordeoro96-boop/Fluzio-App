import { getAuth } from './authCompat';

const auth = getAuth();

const GENERATE_ABOUT_URL = import.meta.env.VITE_GENERATE_ABOUT_URL || 'https://us-central1-fluzio-13af2.cloudfunctions.net/generatebusinessabout';

export interface GenerateAboutResponse {
  success: boolean;
  tagline?: string;
  about?: string;
  vibeTags?: string[];
  language?: string;
  error?: string;
  code?: string;
}

export const aiAboutService = {
  /**
   * Generate business About section from website using AI
   * @param businessId - The business ID to generate about text for
   * @param language - Optional language override (default: 'en')
   * @returns Generated tagline and about text
   */
  async generateBusinessAbout(
    businessId: string,
    language: string = 'en'
  ): Promise<GenerateAboutResponse> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const idToken = await currentUser.getIdToken();

      console.log('[aiAboutService] Generating About for business:', businessId);

      const response = await fetch(GENERATE_ABOUT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          businessId,
          language
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('[aiAboutService] Error response:', data);
        return {
          success: false,
          error: data.error || 'Failed to generate About text',
          code: data.code || 'UNKNOWN_ERROR'
        };
      }

      console.log('[aiAboutService] About generated successfully');
      return {
        success: true,
        tagline: data.tagline,
        about: data.about,
        vibeTags: data.vibeTags,
        language: data.language
      };

    } catch (error: any) {
      console.error('[aiAboutService] Exception:', error);
      return {
        success: false,
        error: error.message || 'Network error occurred',
        code: 'NETWORK_ERROR'
      };
    }
  }
};
