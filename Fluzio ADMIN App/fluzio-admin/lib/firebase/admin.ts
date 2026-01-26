// Server-side Supabase Admin configuration
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let adminClient: SupabaseClient;

// Initialize Supabase Admin (singleton)
function getAdminClient(): SupabaseClient {
  if (adminClient) return adminClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase admin environment variables');
    throw new Error('SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL not configured');
  }

  console.log('Initializing Supabase Admin Client...');
  
  adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log('✅ Supabase Admin Client initialized successfully');
  return adminClient;
}

// Export admin instances
export const adminDb = getAdminClient();
export const db = adminDb; // Alias for compatibility

// Create auth wrapper with verifySessionCookie method
export const adminAuth = {
  ...getAdminClient(),
  verifySessionCookie: async (sessionCookie: string, checkRevoked = true): Promise<{ uid: string; email?: string }> => {
    try => {
      const { data: { user }, error } = await getAdminClient().auth.getUser(sessionCookie);
      if (error || !user) {
        throw new Error('Invalid session cookie');
      }
      return { uid: user.id, email: user.email };
    } catch (error) {
      console.error('Session verification failed:', error);
      throw error;
    }
  },
};

// Export compatibility layer functions for Firestore-style queries
export {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  deleteField,
  runTransaction,
  writeBatch,
  FieldValue,
} from './firestoreCompat';

export const db = getAdminClient(); // Shorthand export for backward compatibility
export const auth = adminAuth; // Shorthand export

// Export helper functions
export function getAdminAuth() {
  return adminAuth;
}

export function getAdminDb() {
  return getAdminClient();
}

// Export the client getter
export { getAdminClient };