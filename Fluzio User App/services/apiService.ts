import { OnboardingState } from '../types';
import { supabase } from './supabaseClient';

// Export supabase for all services
export { supabase };

// Also export as 'db' for compatibility with existing imports
export const db = supabase;


export const api = {
  async createUser(userData: OnboardingState, authUserId?: string): Promise<{ success: boolean; userId?: string; error?: string }> {
    try {
      console.log('🔨 Creating user in Supabase:', userData);
      
      // Use provided user ID or get the current authenticated user
      let userId = authUserId;
      
      if (!userId) {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !authUser) {
          throw new Error('No authenticated user found');
        }
        userId = authUser.id;
      }

      // Prepare user data matching actual Supabase schema
      const userRecord = {
        id: userId, // Map uid to id
        email: userData.email,
        display_name: userData.name || userData.legalName || userData.handle || userData.email?.split('@')[0],
        role: userData.role || 'MEMBER',
        city: userData.city || userData.homeCity,
        country: userData.country,
        home_city: userData.homeCity,
        creator_verified: false,
        approval_status: userData.role === 'BUSINESS' ? 'PENDING' : null,
      };

      // Insert into users table
      const { data, error } = await supabase
        .from('users')
        .upsert(userRecord, { onConflict: 'id' }) // Use upsert to avoid duplicates
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }

      console.log('✅ User created successfully:', data);
      return { 
        success: true, 
        userId: userId 
      };
    } catch (error) {
      console.error('Failed to create user:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create user' 
      };
    }
  },

  async getUser(userId: string): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      console.log('🔍 Fetching user from Supabase:', userId);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          console.warn('User not found:', userId);
          return { success: false, error: 'User not found' };
        }
        throw error;
      }

      // Transform Supabase data to match expected format
      const user = {
        uid: data.id, // Map id back to uid
        email: data.email,
        displayName: data.display_name,
        role: data.role,
        city: data.city,
        country: data.country,
        homeCity: data.home_city,
        approvalStatus: data.approval_status,
        // Additional fields from new columns
        photoUrl: data.photo_url,
        bio: data.bio,
        instagram: data.instagram,
        website: data.website,
        vibeTags: data.vibe_tags,
        profileComplete: data.profile_complete,
        category: data.category,
        planTier: data.plan_tier,
        credits: data.credits,
        referralCode: data.referral_code,
        referredBy: data.referred_by,
        referralCount: data.referral_count,
        referralPoints: data.referral_points,
      };

      console.log('✅ User fetched:', user);
      return { success: true, user };
    } catch (error) {
      console.error('Failed to get user:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get user' 
      };
    }
  },

  async updateUser(userId: string, updates: Partial<OnboardingState> | Record<string, any>): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('📝 Updating user in Supabase:', userId, updates);

      // Transform camelCase to snake_case for Supabase
      const supabaseUpdates: any = {};
      
      if (updates.displayName !== undefined) supabaseUpdates.display_name = updates.displayName;
      if (updates.name !== undefined) supabaseUpdates.display_name = updates.name;
      if (updates.legalName !== undefined) supabaseUpdates.legal_name = updates.legalName;
      if (updates.handle !== undefined) supabaseUpdates.handle = updates.handle;
      if (updates.city !== undefined) supabaseUpdates.city = updates.city;
      if (updates.homeCity !== undefined) supabaseUpdates.home_city = updates.homeCity;
      if (updates.country !== undefined) supabaseUpdates.country = updates.country;
      if (updates.instagram !== undefined) supabaseUpdates.instagram = updates.instagram;
      if (updates.website !== undefined) supabaseUpdates.website = updates.website;
      if (updates.vibeTags !== undefined) supabaseUpdates.vibe_tags = updates.vibeTags;
      if (updates.profileComplete !== undefined) supabaseUpdates.profile_complete = updates.profileComplete;
      if (updates.category !== undefined) supabaseUpdates.category = updates.category;
      if (updates.bio !== undefined) supabaseUpdates.bio = updates.bio;
      if (updates.photoUrl !== undefined) supabaseUpdates.photo_url = updates.photoUrl;
      if (updates.planTier !== undefined) supabaseUpdates.plan_tier = updates.planTier;
      if (updates.credits !== undefined) supabaseUpdates.credits = updates.credits;
      if (updates.referralCode !== undefined) supabaseUpdates.referral_code = updates.referralCode;
      if (updates.referredBy !== undefined) supabaseUpdates.referred_by = updates.referredBy;
      if (updates.referralCount !== undefined) supabaseUpdates.referral_count = updates.referralCount;
      if (updates.referralPoints !== undefined) supabaseUpdates.referral_points = updates.referralPoints;

      if (updates.role !== undefined) supabaseUpdates.role = updates.role;
      
      // Update timestamp
      supabaseUpdates.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('users')
        .update(supabaseUpdates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }

      console.log('✅ User updated successfully:', data);
      return { success: true };
    } catch (error) {
      console.error('Failed to update user:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update user',
      };
    }
  }
};
