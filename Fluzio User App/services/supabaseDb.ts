/**
 * Supabase Database Compatibility Layer
 * Provides Firestore-like API using Supabase
 */

import { supabase } from './supabaseClient';

// Export db object for compatibility with existing code
export const db = {
  // This is a placeholder - actual database operations should go through the API
  // or use Supabase directly via supabase.from('table_name')
};

// Export auth for compatibility
export const auth = {
  get currentUser() {
    // This will be populated by AuthContext
    return null;
  }
};

// Export storage for compatibility
export const storage = {
  // Placeholder for storage operations
  // Use supabase.storage.from('bucket_name') for actual operations
};

/**
 * Helper functions for common database operations
 */

// Get a document by ID
export async function getDoc(table: string, id: string) {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return { data, exists: !!data };
}

// Update a document
export async function updateDoc(table: string, id: string, updates: any) {
  const { data, error } = await supabase
    .from(table)
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Create a document
export async function createDoc(table: string, doc: any) {
  const { data, error } = await supabase
    .from(table)
    .insert(doc)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Delete a document
export async function deleteDoc(table: string, id: string) {
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// Query documents
export async function queryDocs(
  table: string,
  filters?: { field: string; operator: string; value: any }[]
) {
  let query = supabase.from(table).select('*');
  
  if (filters) {
    filters.forEach(({ field, operator, value }) => {
      switch (operator) {
        case '==':
          query = query.eq(field, value);
          break;
        case '>':
          query = query.gt(field, value);
          break;
        case '<':
          query = query.lt(field, value);
          break;
        case '>=':
          query = query.gte(field, value);
          break;
        case '<=':
          query = query.lte(field, value);
          break;
        case '!=':
          query = query.neq(field, value);
          break;
        default:
          break;
      }
    });
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data || [];
}
