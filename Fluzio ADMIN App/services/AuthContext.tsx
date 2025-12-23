import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  User,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  OAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  UserCredential,
} from "firebase/auth";
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { api } from "./apiService";
import { setAnalyticsUserId, setAnalyticsUserProperties, trackLogin, trackSignUp } from "./firebaseAnalytics";
import { setSentryUser, clearSentryUser } from "./sentryService";

export interface UserProfile {
  uid: string;
  email: string;
  emailVerified?: boolean;
  role: "CREATOR" | "BUSINESS";
  name?: string;
  city?: string;
  homeCity?: string;
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
  // Allow any additional fields
  [key: string]: any;
}

// ---------- Firebase Init (client) ----------

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

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

  // Load user profile from backend (Cloud Function -> Firestore)
  const loadUserProfile = async (uid: string) => {
    setLoadingProfile(true);
    try {
      console.log("🔍 [AuthContext] Loading user profile for UID:", uid);
      const result = await api.getUser(uid);

      if (result.success && result.user) {
        console.log("📦 [AuthContext] Firestore returned profile:");
        console.log("  Email:", result.user.email);
        console.log("  Name:", result.user.name);
        console.log("  Role:", result.user.role);
        console.log("  Full data:", result.user);
        
        // Add emailVerified from Firebase Auth
        const profileWithVerification = {
          ...result.user,
          emailVerified: auth.currentUser?.emailVerified || false
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
        // During signup, the user document may not exist yet (created after auth)
        // This is expected and will be resolved when signup completes
        console.log(
          "[AuthContext] User profile not found yet for uid:",
          uid,
          "- this is normal during signup"
        );
        setUserProfile(null);
      }
    } catch (err) {
      // Silently handle 404 errors during signup flow
      console.log("[AuthContext] Profile not loaded (may be during signup):", err);
      setUserProfile(null);
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

  // Listen to auth state changes (login / logout)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("[AuthContext] onAuthStateChanged:", firebaseUser?.uid);
      setUser(firebaseUser);

      if (firebaseUser) {
        await loadUserProfile(firebaseUser.uid);
        
        // Set analytics user ID
        setAnalyticsUserId(firebaseUser.uid);
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // ---------- Auth Methods ----------
  const signInWithGoogle = async (): Promise<UserCredential> => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: "select_account",
    });
    const credential = await signInWithPopup(auth, provider);
    // Track login
    trackLogin('google');
    return credential;
  };

  const signInWithApple = async (): Promise<UserCredential> => {
    const provider = new OAuthProvider('apple.com');
    provider.addScope('email');
    provider.addScope('name');
    const credential = await signInWithPopup(auth, provider);
    // Track login
    trackLogin('apple');
    return credential;
  };

  const signInWithEmail = async (
    email: string,
    password: string
  ): Promise<UserCredential> => {
    const credential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    // Track login
    trackLogin('email');
    // profile will be loaded automatically by onAuthStateChanged
    return credential;
  };

  const signUpWithEmail = async (
    email: string,
    password: string
  ): Promise<UserCredential> => {
    // after signup, your SignUpScreen will call api.createUser / api.updateUser
    // to create the Firestore document
    return await createUserWithEmailAndPassword(auth, email, password);
  };

  const signOut = async (): Promise<void> => {
    await firebaseSignOut(auth);
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
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
