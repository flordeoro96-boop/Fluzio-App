import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { supabase } from "./supabaseClient";
import { User as SupabaseUser, Session, AuthError } from "@supabase/supabase-js";
import { api } from "./apiService";
import { setAnalyticsUserId, setAnalyticsUserProperties, trackLogin, trackSignUp } from "./firebaseAnalytics";
import { setSentryUser, clearSentryUser } from "./sentryService";

// Note: db, auth, storage are exported from apiService
// Use supabase directly from services/supabaseClient.ts

// Compatibility type to match Firebase User structure
export interface User {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  displayName?: string | null;
  photoURL?: string | null;
}

export interface UserProfile {
  uid: string;
  email: string;
  emailVerified?: boolean;
  role: "CREATOR" | "BUSINESS" | "MEMBER" | "ADMIN";
  name?: string;
  city?: string;
  homeCity?: string;
  country?: string;
  instagram?: string;
  website?: string;
  vibeTags?: string[];
  vibe?: string[]; // legacy field name
  profileComplete?: boolean;
  // Business-specific fields
  category?: string;
  bio?: string;
  photoUrl?: string;
  planTier?: string;
  credits?: number;
  socialLinks?: {
    instagram?: { connected: boolean; username?: string; lastSync?: string };
    tiktok?: { connected: boolean; username?: string; lastSync?: string };
    website?: string;
  };
  preferences?: {
    notifications_squad?: boolean;
    notifications_missions?: boolean;
  };
  // Referral system
  referralCode?: string;
  referredBy?: string; // UID of the user who referred them
  referralCount?: number;
  referralPoints?: number;
  // Allow any additional fields
  [key: string]: any;
}

// Compatibility type for auth responses
interface UserCredential {
  user: User;
}

// Helper to convert Supabase user to our User type
const convertSupabaseUser = (supabaseUser: SupabaseUser): User => {
  return {
    uid: supabaseUser.id,
    email: supabaseUser.email || null,
    emailVerified: !!supabaseUser.email_confirmed_at,
    displayName: supabaseUser.user_metadata?.name || null,
    photoURL: supabaseUser.user_metadata?.avatar_url || null,
  };
};

// ---------- Auth Context Types ----------

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  loadingProfile: boolean;
  signInWithGoogle: () => Promise<UserCredential>;
  signInWithApple: () => Promise<UserCredential>;
  signInWithEmail: (
    email: string,
    password: string
  ) => Promise<UserCredential>;
  signUpWithEmail: (
    email: string,
    password: string
  ) => Promise<UserCredential>;
  signOut: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// ---------- Provider Implementation ----------

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Load user profile from backend
  const loadUserProfile = async (uid: string) => {
    setLoadingProfile(true);
    try {
      console.log("🔍 [AuthContext] Loading user profile for UID:", uid);
      
      // Add timeout to prevent infinite hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('User profile fetch timeout')), 10000)
      );
      
      const result = await Promise.race([
        api.getUser(uid),
        timeoutPromise
      ]) as { success: boolean; user?: any; error?: string };

      if (result.success && result.user) {
        console.log("📦 [AuthContext] Backend returned profile:");
        console.log("  Email:", result.user.email);
        console.log("  Name:", result.user.name);
        console.log("  Role:", result.user.role);
        console.log("  Full data:", result.user);
        
        // Add emailVerified from Supabase Auth
        const session = await supabase.auth.getSession();
        const profileWithVerification = {
          ...result.user,
          emailVerified: !!session.data.session?.user.email_confirmed_at
        } as UserProfile;
        
        setUserProfile(profileWithVerification);
        
        // Set analytics user properties
        setAnalyticsUserProperties({
          role: result.user.role,
          city: result.user.city || result.user.homeCity,
          planTier: result.user.planTier,
        });
        
        // Set Sentry user context
        setSentryUser(
          result.user.uid,
          result.user.email,
          result.user.role
        );
      } else {
        console.warn(
          "[AuthContext] No user profile found for uid:",
          uid,
          "error:",
          result.error
        );
        
        // CRITICAL: Create minimal profile from Supabase auth data to unblock app
        const session = await supabase.auth.getSession();
        const authUser = session.data.session?.user;
        
        if (authUser) {
          console.log("🆕 [AuthContext] Creating minimal profile from auth data");
          const minimalProfile: UserProfile = {
            uid: authUser.id,
            email: authUser.email || '',
            emailVerified: !!authUser.email_confirmed_at,
            role: 'MEMBER', // Default role
            name: authUser.user_metadata?.name,
            profileComplete: false,
          };
          setUserProfile(minimalProfile);
          
          // Try to create user in database (don't wait for it)
          api.createUser({
            uid: authUser.id,
            email: authUser.email || '',
            role: 'MEMBER',
            displayName: authUser.user_metadata?.name,
          }).catch(err => console.warn('Failed to create user in DB:', err));
        } else {
          setUserProfile(null);
        }
      }
    } catch (err) {
      console.error("[AuthContext] Failed to load user profile:", err);
      
      // CRITICAL: Create fallback profile from auth session to prevent white screen
      try {
        const session = await supabase.auth.getSession();
        const authUser = session.data.session?.user;
        
        if (authUser) {
          console.log("⚠️ [AuthContext] Using fallback profile from auth session");
          const fallbackProfile: UserProfile = {
            uid: authUser.id,
            email: authUser.email || '',
            emailVerified: !!authUser.email_confirmed_at,
            role: 'MEMBER',
            name: authUser.user_metadata?.name,
            profileComplete: false,
          };
          setUserProfile(fallbackProfile);
        } else {
          setUserProfile(null);
        }
      } catch (fallbackErr) {
        console.error("[AuthContext] Fallback profile creation failed:", fallbackErr);
        setUserProfile(null);
      }
    } finally {
      setLoadingProfile(false);
    }
  };

  // Manual refresh for the "Refresh Profile" button
  const refreshUserProfile = async () => {
    if (user) {
      await loadUserProfile(user.uid);
    }
  };

  // Update user profile
  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user) {
      throw new Error('No user logged in');
    }

    try {
      // Update via API (which will update the database)
      await api.updateUser(user.uid, updates);
      
      // Refresh the profile to get updated data
      await loadUserProfile(user.uid);
    } catch (error) {
      console.error('[AuthContext] Error updating profile:', error);
      throw error;
    }
  };

  // Listen to auth state changes (login / logout)
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("[AuthContext] Initial session:", session?.user?.id);
      const supaUser = session?.user;
      if (supaUser) {
        const convertedUser = convertSupabaseUser(supaUser);
        setUser(convertedUser);
        loadUserProfile(convertedUser.uid);
        setAnalyticsUserId(convertedUser.uid);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("[AuthContext] Auth event:", event, session?.user?.id);
        const supaUser = session?.user;

        if (supaUser) {
          const convertedUser = convertSupabaseUser(supaUser);
          setUser(convertedUser);
          await loadUserProfile(convertedUser.uid);
          setAnalyticsUserId(convertedUser.uid);
        } else {
          setUser(null);
          setUserProfile(null);
        }

        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ---------- Auth Methods ----------
  const signInWithGoogle = async (): Promise<UserCredential> => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) throw error;
    
    // Track login
    trackLogin('google');
    
    // Return credential-like object
    const session = await supabase.auth.getSession();
    if (!session.data.session?.user) {
      throw new Error('No user after Google sign in');
    }
    
    return {
      user: convertSupabaseUser(session.data.session.user),
    };
  };

  const signInWithApple = async (): Promise<UserCredential> => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) throw error;
    
    // Track login
    trackLogin('apple');
    
    // Return credential-like object
    const session = await supabase.auth.getSession();
    if (!session.data.session?.user) {
      throw new Error('No user after Apple sign in');
    }
    
    return {
      user: convertSupabaseUser(session.data.session.user),
    };
  };

  const signInWithEmail = async (
    email: string,
    password: string
  ): Promise<UserCredential> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    if (!data.user) throw new Error('No user returned');

    // Track login
    trackLogin('email');
    
    return {
      user: convertSupabaseUser(data.user),
    };
  };

  const signUpWithEmail = async (
    email: string,
    password: string
  ): Promise<UserCredential> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;
    if (!data.user) throw new Error('No user returned');

    return {
      user: convertSupabaseUser(data.user),
    };
  };

  const signOut = async (): Promise<void> => {
    await supabase.auth.signOut();
    setUserProfile(null);
    
    // Clear Sentry user context
    clearSentryUser();
  };

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    loadingProfile,
    signInWithGoogle,
    signInWithApple,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    refreshUserProfile,
    updateUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Backward compatibility exports
export { api } from './apiService';
export { supabase as auth } from './supabaseClient';
export { storage } from './storageCompat';

// Stub for uploadImage (was used for file uploads)
export const uploadImage = async (file: File, path: string) => {
  console.warn('[AuthContext] uploadImage is deprecated, use storageCompat directly');
  const { ref, uploadBytes, getDownloadURL } = await import('./storageCompat');
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
};
