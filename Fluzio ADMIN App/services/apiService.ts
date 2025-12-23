import { OnboardingState } from '../types';
import { db } from './AuthContext';

// Export db for other services
export { db };

// Cloud Function URLs
const CREATE_USER_URL = import.meta.env.VITE_CREATE_USER_URL || 'https://createuser-uvpokjrjsq-uc.a.run.app';
const GET_USER_URL = import.meta.env.VITE_GET_USER_URL || 'https://getuser-uvpokjrjsq-uc.a.run.app';
const UPDATE_USER_URL = import.meta.env.VITE_UPDATE_USER_URL || 'https://updateuser-uvpokjrjsq-uc.a.run.app';

// Feature flag to enable/disable backend API calls
const USE_BACKEND_API = import.meta.env.VITE_USE_BACKEND_API === 'true';

export const api = {
  async createUser(userData: OnboardingState): Promise<{ success: boolean; userId?: string; error?: string }> {
    // If backend is not configured, simulate success locally
    if (!USE_BACKEND_API) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('Backend API disabled. User data would be sent to:', userData);
      }
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Generate a mock user ID
      const mockUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return { 
        success: true, 
        userId: mockUserId 
      };
    }

    // Cloud Function API call
    try {
      const response = await fetch(CREATE_USER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        if (process.env.NODE_ENV !== 'production') {
          console.error('Error response body:', errorText);
        }        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }
        
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, userId: data.userId || data.id };
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Failed to create user:', error);
      }
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create user' 
      };
    }
  },

  async getUser(userId: string): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      const response = await fetch(`${GET_USER_URL}?userId=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, user: data.user || data };
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Failed to get user:', error);
      }
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get user' 
      };
    }
  },

async updateUser(userId: string, updates: Partial<OnboardingState> | Record<string, any>): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(UPDATE_USER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        updates,   // <-- must be nested exactly like this
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { success: true };
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error("Failed to update user:", error);
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update user",
    };
  }
}




};
