/**
 * Firestore compatibility layer for Supabase
 * Provides Firestore-like API using Supabase
 */

import { supabase } from './supabaseClient';

// Export types for compatibility
export type QueryConstraint = any;
export type TimestampType = Date | { toDate: () => Date; toMillis: () => number };

// Re-export Timestamp as a type using typeof
export type { TimestampType as Timestamp };

// Firestore timestamp compatibility
export const Timestamp = {
  now: () => new Date(),
  fromDate: (date: Date) => date,
  fromMillis: (ms: number) => new Date(ms),
};

// Convert camelCase to snake_case for Supabase columns
function toSnakeCase(str: string): string {
  // Special cases for common column names
  const specialCases: Record<string, string> = {
    'businessId': 'business_id',
    'userId': 'user_id',
    'missionId': 'mission_id',
    'createdAt': 'created_at',
    'updatedAt': 'updated_at',
    'appliedAt': 'applied_at',
    'approvedAt': 'approved_at',
    'completedAt': 'completed_at',
    'checkIns': 'check_ins',
    'photoURL': 'photo_url',
    'photoUrl': 'photo_url',
    'proofUrl': 'proof_url',
    'proofText': 'proof_text',
    'proofSubmittedAt': 'proof_submitted_at',
    'isActive': 'is_active',
    'isStandard': 'is_standard',
    'lifecycleStatus': 'lifecycle_status',
    'maxParticipants': 'max_participants',
    'currentParticipants': 'current_participants',
    'proofType': 'proof_type',
    'validUntil': 'valid_until',
    'businessName': 'business_name',
    'businessLogo': 'business_logo',
    'displayName': 'display_name',
    'planTier': 'plan_tier',
    'referralCode': 'referral_code',
    'referredBy': 'referred_by',
    'checkInMethod': 'check_in_method',
    'qrCodeSecret': 'qr_code_secret',
    'triggerType': 'trigger_type',
  };
  
  if (specialCases[str]) {
    return specialCases[str];
  }
  
  // Generic camelCase to snake_case conversion
  return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

// Collection reference helper
export function collection(db: any, ...pathSegments: string[]) {
  // Convert table names to snake_case
  let tableName = pathSegments[0];
  if (tableName === 'checkIns') tableName = 'check_ins';
  
  return {
    _tableName: tableName,
    _type: 'collection',
  };
}

// Document reference helper
export function doc(dbOrCollection: any, ...pathSegments: string[]) {
  if (dbOrCollection._type === 'collection') {
    // doc(collection(...), 'id')
    return {
      _tableName: dbOrCollection._tableName,
      _id: pathSegments[0],
      _type: 'document',
    };
  } else {
    // doc(db, 'table', 'id')
    return {
      _tableName: pathSegments[0],
      _id: pathSegments[1],
      _type: 'document',
    };
  }
}

// Query helper
export function query(collectionRef: any, ...queryConstraints: any[]) {
  return {
    _tableName: collectionRef._tableName,
    _constraints: queryConstraints,
    _type: 'query',
  };
}

// Query constraints
export function where(field: string, operator: string, value: any) {
  return { type: 'where', field, operator, value };
}

export function orderBy(field: string, direction: 'asc' | 'desc' = 'asc') {
  return { type: 'orderBy', field, direction };
}

export function limit(count: number) {
  return { type: 'limit', count };
}

export function startAfter(...values: any[]) {
  return { type: 'startAfter', values };
}

// Get documents from query
export async function getDocs(queryOrCollection: any) {
  const tableName = queryOrCollection._tableName;
  let query = supabase.from(tableName).select('*');

  if (queryOrCollection._constraints) {
    for (const constraint of queryOrCollection._constraints) {
      switch (constraint.type) {
        case 'where':
          // Convert field name to snake_case for Supabase
          let field = constraint.field === '__name__' ? 'id' : toSnakeCase(constraint.field);
          switch (constraint.operator) {
            case '==':
              query = query.eq(field, constraint.value);
              break;
            case '!=':
              query = query.neq(field, constraint.value);
              break;
            case '<':
              query = query.lt(field, constraint.value);
              break;
            case '<=':
              query = query.lte(field, constraint.value);
              break;
            case '>':
              query = query.gt(field, constraint.value);
              break;
            case '>=':
              query = query.gte(field, constraint.value);
              break;
            case 'in':
              query = query.in(field, constraint.value);
              break;
            case 'array-contains':
              query = query.contains(field, [constraint.value]);
              break;
          }
          break;
        case 'orderBy':
          // Convert field name to snake_case for Supabase
          query = query.order(toSnakeCase(constraint.field), { ascending: constraint.direction === 'asc' });
          break;
        case 'limit':
          query = query.limit(constraint.count);
          break;
      }
    }
  }

  const { data, error } = await query;
  
  if (error) throw error;
  
  const docs = (data || []).map((item: any) => {
    const docRef = {
      _tableName: tableName,
      _id: item.id,
      _type: 'document',
    };
    
    return {
      id: item.id,
      ref: docRef,
      data: () => item,
      exists: true,
    };
  });
  
  // Return in Firestore format with forEach method
  return {
    docs,
    forEach: (callback: (doc: any) => void) => docs.forEach(callback),
    empty: !data || data.length === 0,
    size: data?.length || 0,
  };
}

// Get single document
export async function getDoc(docRef: any) {
  const { data, error } = await supabase
    .from(docRef._tableName)
    .select('*')
    .eq('id', docRef._id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;

  const docExists = !!data;
  
  // Create callable exists function
  const existsFunc: any = () => docExists;
  Object.defineProperty(existsFunc, 'valueOf', { value: () => docExists });
  
  return {
    id: docRef._id,
    ref: docRef,
    data: () => data,
    exists: existsFunc,
  };
}

// Add document
export async function addDoc(collectionRef: any, data: any) {
  const preparedData = prepareDataForSupabase(data);
  
  const { data: inserted, error } = await supabase
    .from(collectionRef._tableName)
    .insert(preparedData)
    .select()
    .single();

  if (error) throw error;

  return {
    id: inserted.id,
    _tableName: collectionRef._tableName,
  };
}

// Set document (upsert)
export async function setDoc(docRef: any, data: any, options?: any) {
  const preparedData = prepareDataForSupabase(data);
  
  if (options?.merge) {
    // Update existing
    const { error } = await supabase
      .from(docRef._tableName)
      .update(preparedData)
      .eq('id', docRef._id);
    
    if (error) throw error;
  } else {
    // Insert or replace
    const { error } = await supabase
      .from(docRef._tableName)
      .upsert({ ...preparedData, id: docRef._id });
    
    if (error) throw error;
  }
}

// Update document
export async function updateDoc(docRef: any, data: any) {
  const preparedData = prepareDataForSupabase(data);
  
  const { error } = await supabase
    .from(docRef._tableName)
    .update(preparedData)
    .eq('id', docRef._id);

  if (error) throw error;
}

// Delete document
export async function deleteDoc(docRef: any) {
  const { error } = await supabase
    .from(docRef._tableName)
    .delete()
    .eq('id', docRef._id);

  if (error) throw error;
}

// Helper to prepare data for Supabase
function prepareDataForSupabase(data: any): any {
  const prepared: any = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (value instanceof Date) {
      prepared[key] = value.toISOString();
    } else if (value && typeof value === 'object' && 'toDate' in value) {
      // Firebase Timestamp
      prepared[key] = value.toDate().toISOString();
    } else if (value === undefined) {
      // Skip undefined values
      continue;
    } else {
      prepared[key] = value;
    }
  }
  
  return prepared;
}

// On snapshot (real-time) - simplified version
export function onSnapshot(
  queryOrDoc: any,
  callback: (snapshot: any) => void,
  errorCallback?: (error: any) => void
) {
  const tableName = queryOrDoc._tableName;
  
  // Subscribe to changes
  const channel = supabase
    .channel(`${tableName}_changes`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: tableName,
      },
      (payload) => {
        // Simulate Firestore snapshot
        callback({
          docs: [{ id: payload.new?.id || payload.old?.id, data: () => payload.new || payload.old }],
        });
      }
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel);
  };
}

// Server timestamp (returns ISO string for Supabase)
export function serverTimestamp() {
  return new Date().toISOString();
}

// Increment helper (for Firestore-style increments)
export function increment(value: number) {
  return { _increment: value };
}

// Array helpers
export function arrayUnion(...elements: any[]) {
  return { _arrayUnion: elements };
}

export function arrayRemove(...elements: any[]) {
  return { _arrayRemove: elements };
}

// Delete field helper
export function deleteField() {
  return { _deleteField: true };
}

// Run transaction (simplified - Supabase doesn't have multi-document transactions like Firestore)
export async function runTransaction(db: any, updateFunction: (transaction: any) => Promise<any>) {
  // Simplified transaction mock - execute the function directly
  // In production, this would need proper transaction handling via Supabase RPC
  const transaction = {
    get: async (docRef: any) => {
      const doc = await getDoc(docRef);
      return doc;
    },
    set: async (docRef: any, data: any) => {
      await setDoc(docRef, data);
    },
    update: async (docRef: any, data: any) => {
      await updateDoc(docRef, data);
    },
    delete: async (docRef: any) => {
      await deleteDoc(docRef);
    }
  };
  
  return await updateFunction(transaction);
}

// GeoPoint class for compatibility
export class GeoPoint {
  latitude: number;
  longitude: number;
  
  constructor(latitude: number, longitude: number) {
    this.latitude = latitude;
    this.longitude = longitude;
  }
  
  isEqual(other: GeoPoint): boolean {
    return this.latitude === other.latitude && this.longitude === other.longitude;
  }
}

// WriteBatch for compatibility
export function writeBatch(db: any) {
  const operations: Array<() => Promise<any>> = [];
  
  return {
    set: (docRef: any, data: any) => {
      operations.push(async () => {
        await setDoc(docRef, data);
      });
      return this;
    },
    update: (docRef: any, data: any) => {
      operations.push(async () => {
        await updateDoc(docRef, data);
      });
      return this;
    },
    delete: (docRef: any) => {
      operations.push(async () => {
        await deleteDoc(docRef);
      });
      return this;
    },
    commit: async () => {
      // Execute all operations sequentially
      for (const operation of operations) {
        await operation();
      }
    }
  };
}
