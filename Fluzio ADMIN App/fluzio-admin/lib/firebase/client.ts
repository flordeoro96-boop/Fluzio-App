// Client-side Supabase configuration
import { supabase } from './supabaseClient';
import { getAuth } from './authCompat';

// Export for backward compatibility
export const auth = getAuth();
export const db = supabase;

// Re-export supabase instance
export { supabase };