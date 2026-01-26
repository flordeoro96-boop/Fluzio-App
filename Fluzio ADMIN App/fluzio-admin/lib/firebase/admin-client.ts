// Client-side Supabase SDK for admin app
import { supabase } from './supabaseClient';
import { getAuth } from './authCompat';

// Initialize services
export const db = supabase;
export const auth = getAuth();

// Export helper functions for backward compatibility
export function getAdminClientApp() {
  return { db, auth };
}

export function getAdminClientDb() {
  return db;
}

export function getAdminClientAuth() {
  return auth;
}