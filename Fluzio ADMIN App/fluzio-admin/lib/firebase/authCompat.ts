// Supabase Auth compatibility layer for Firebase Auth API
import { supabase } from './supabaseClient';

/**
 * Send password reset email (compatible with Firebase API)
 */
export async function sendPasswordResetEmail(auth: any, email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  
  if (error) {
    throw error;
  }
}

/**
 * Send email verification (stub - Supabase handles this automatically)
 */
export async function sendEmailVerification(user: any) {
  console.log('[Auth] Email verification is handled by Supabase automatically');
  // Supabase sends verification emails automatically on signup
  // This is a no-op for compatibility
  return Promise.resolve();
}

/**
 * Update password (compatible with Firebase API)
 */
export async function updatePassword(user: any, newPassword: string) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  
  if (error) {
    throw error;
  }
}

/**
 * Delete user (compatible with Firebase API)
 */
export async function deleteUser(user: any) {
  // Note: Supabase doesn't have a client-side delete user method
  // This would typically be done through an admin API or database function
  console.warn('[Auth] User deletion should be handled through Supabase admin API');
  throw new Error('User deletion must be handled server-side with Supabase');
}

/**
 * Email auth provider (stub for compatibility)
 */
export class EmailAuthProvider {
  static credential(email: string, password: string) {
    return {
      email,
      password,
      providerId: 'password',
    };
  }
}

/**
 * Google auth provider (stub for compatibility)
 */
export class GoogleAuthProvider {
  constructor() {
    // Stub
  }
}

/**
 * OAuth credential (stub for compatibility)
 */
export class OAuthCredential {
  constructor(public providerId: string) {}
}

/**
 * Reauthenticate with credential
 */
export async function reauthenticateWithCredential(user: any, credential: any) {
  // Supabase requires the user to sign in again
  const { error } = await supabase.auth.signInWithPassword({
    email: credential.email,
    password: credential.password,
  });
  
  if (error) {
    throw error;
  }
}

/**
 * Link with popup (stub for social auth linking)
 */
export async function linkWithPopup(user: any, provider: any) {
  console.warn('[Auth] Social auth linking not implemented for Supabase');
  throw new Error('Social auth linking not implemented');
}

/**
 * Unlink provider
 */
export async function unlink(user: any, providerId: string) {
  console.warn('[Auth] Provider unlinking not implemented for Supabase');
  throw new Error('Provider unlinking not implemented');
}

/**
 * Get auth instance (stub)
 */
export function getAuth() {
  return {
    _type: 'SupabaseAuth',
    currentUser: null,
  };
}

/**
 * User type (re-export from AuthContext for compatibility)
 */
export interface User {
  uid: string;
  email: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  emailVerified?: boolean;
}

/**
 * Auth state change listener (stub - use AuthContext instead)
 */
export function onAuthStateChanged(auth: any, callback: (user: User | null) => void) {
  // This should use the AuthContext implementation
  console.warn('[Auth] Use AuthContext.useAuth() instead of onAuthStateChanged');
  return () => {}; // Return unsubscribe function
}

/**
 * Sign in with email and password (stub - use AuthContext)
 */
export async function signInWithEmailAndPassword(auth: any, email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    throw error;
  }
  
  return { user: data.user };
}

/**
 * Sign out (stub - use AuthContext)
 */
export async function signOut(auth: any) {
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    throw error;
  }
}

/**
 * Connect to auth emulator (no-op for Supabase)
 */
export function connectAuthEmulator(auth: any, url: string) {
  console.log('[Auth] Auth emulator not applicable for Supabase');
}
