'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/client';
import { doc, getDoc } from '../../../services/firestoreCompat';
import { Admin } from '@/lib/types';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  admin: Admin | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  admin: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Load admin data from Firestore
  const loadAdminData = async (uid: string) => {
    try {
      console.log('🔍 Loading admin data for UID:', uid);
      console.log('🔍 Current auth user:', auth.currentUser?.uid);
      console.log('🔍 Project ID:', db.app.options.projectId);
      
      const adminDoc = await getDoc(doc(db, 'admins', uid));
      console.log('✅ Admin doc fetch successful. Exists:', adminDoc.exists());
      
      if (adminDoc.exists()) {
        const adminData = { uid, ...adminDoc.data() } as Admin;
        console.log('✅ Admin data:', adminData);
        
        // Check if admin is active
        if (adminData.status === 'ACTIVE') {
          setAdmin(adminData);
          return adminData;
        } else {
          console.error('❌ Admin account is suspended');
          await firebaseSignOut(auth);
          setAdmin(null);
          return null;
        }
      } else {
        console.error('❌ Admin account not found in database');
        await firebaseSignOut(auth);
        setAdmin(null);
        return null;
      }
    } catch (error: any) {
      console.error('❌ Error loading admin data:', error);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error message:', error.message);
      setAdmin(null);
      return null;
    }
  };

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Get and store ID token
        const idToken = await firebaseUser.getIdToken();
        document.cookie = `idToken=${idToken}; path=/; max-age=3600; SameSite=Strict`;
        
        await loadAdminData(firebaseUser.uid);
      } else {
        // Remove token cookie
        document.cookie = 'idToken=; path=/; max-age=0';
        setAdmin(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Refresh token every 50 minutes (before 1 hour expiry)
  useEffect(() => {
    if (!user) return;

    const refreshToken = async () => {
      try {
        const idToken = await user.getIdToken(true); // Force refresh
        document.cookie = `idToken=${idToken}; path=/; max-age=3600; SameSite=Strict`;
      } catch (error) {
        console.error('Token refresh error:', error);
      }
    };

    const interval = setInterval(refreshToken, 50 * 60 * 1000); // 50 minutes

    return () => clearInterval(interval);
  }, [user]);

  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Get the ID token and store it in a cookie for server actions
      const idToken = await userCredential.user.getIdToken();
      document.cookie = `idToken=${idToken}; path=/; max-age=3600; SameSite=Strict`;
      
      const adminData = await loadAdminData(userCredential.user.uid);
      
      if (adminData) {
        router.push('/admin');
      } else {
        throw new Error('Not authorized as admin');
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw new Error(error.message || 'Failed to sign in');
    }
  };

  const signOut = async () => {
    try {
      // Remove the ID token cookie
      document.cookie = 'idToken=; path=/; max-age=0';
      
      await firebaseSignOut(auth);
      setUser(null);
      setAdmin(null);
      router.push('/admin/login');
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    admin,
    loading,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
