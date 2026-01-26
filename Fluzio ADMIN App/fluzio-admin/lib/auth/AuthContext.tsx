'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut } from '@/lib/firebase/authCompat';
import { auth, db } from '@/lib/firebase/client';
import { doc, getDoc } from '@/lib/firebase/firestoreCompat';
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
        // Get ID token and create session cookie
        const idToken = await firebaseUser.getIdToken();
        
        // Create session cookie via API
        try {
          await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
          });
        } catch (error) {
          console.error('Failed to create session cookie:', error);
        }
        
        await loadAdminData(firebaseUser.uid);
      } else {
        // Remove session cookie
        try {
          await fetch('/api/auth/session', { method: 'DELETE' });
        } catch (error) {
          console.error('Failed to delete session cookie:', error);
        }
        setAdmin(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Refresh token and session every 50 minutes
  useEffect(() => {
    if (!user) return;

    const refreshSession = async () => {
      try {
        const idToken = await user.getIdToken(true); // Force refresh
        
        // Refresh session cookie
        await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        });
      } catch (error) {
        console.error('Session refresh error:', error);
      }
    };

    const interval = setInterval(refreshSession, 50 * 60 * 1000); // 50 minutes

    return () => clearInterval(interval);
  }, [user]);

  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Get the ID token and create session cookie
      const idToken = await userCredential.user.getIdToken();
      
      // Create session cookie via API
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }
      
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
      // Remove the session cookie
      await fetch('/api/auth/session', { method: 'DELETE' });
      
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
