// Supabase Storage compatibility layer for Firebase Storage API
import { supabase } from './supabaseClient';

/**
 * Creates a storage reference (similar to Firebase ref())
 */
export function ref(storage: any, path: string) {
  return {
    _path: path,
    _storage: storage,
    fullPath: path,
    name: path.split('/').pop() || '',
    bucket: 'uploads', // Default bucket name
  };
}

/**
 * Upload bytes to Supabase Storage (similar to Firebase uploadBytes())
 */
export async function uploadBytes(storageRef: any, data: Blob | Uint8Array | ArrayBuffer, metadata?: any) {
  try {
    const path = storageRef._path || storageRef.fullPath;
    
    // Convert data to File if it's a Blob
    let fileData: File | Blob;
    if (data instanceof Blob) {
      fileData = data;
    } else {
      fileData = new Blob([data]);
    }
    
    const { data: uploadData, error } = await supabase.storage
      .from(storageRef.bucket || 'uploads')
      .upload(path, fileData, {
        contentType: metadata?.contentType,
        cacheControl: metadata?.cacheControl || '3600',
        upsert: true,
      });

    if (error) {
      throw error;
    }

    return {
      ref: storageRef,
      metadata: {
        fullPath: path,
        name: path.split('/').pop(),
        bucket: storageRef.bucket,
        ...metadata,
      },
    };
  } catch (error) {
    console.error('[Storage] Upload error:', error);
    throw error;
  }
}

/**
 * Get download URL from Supabase Storage (similar to Firebase getDownloadURL())
 */
export async function getDownloadURL(storageRef: any) {
  try {
    const path = storageRef._path || storageRef.fullPath;
    
    const { data } = supabase.storage
      .from(storageRef.bucket || 'uploads')
      .getPublicUrl(path);

    if (!data || !data.publicUrl) {
      throw new Error('Failed to get public URL');
    }

    return data.publicUrl;
  } catch (error) {
    console.error('[Storage] Get download URL error:', error);
    throw error;
  }
}

/**
 * Delete object from Supabase Storage (similar to Firebase deleteObject())
 */
export async function deleteObject(storageRef: any) {
  try {
    const path = storageRef._path || storageRef.fullPath;
    
    const { error } = await supabase.storage
      .from(storageRef.bucket || 'uploads')
      .remove([path]);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('[Storage] Delete error:', error);
    throw error;
  }
}

/**
 * List all files in a directory (similar to Firebase listAll())
 */
export async function listAll(storageRef: any) {
  try {
    const path = storageRef._path || storageRef.fullPath;
    
    const { data, error } = await supabase.storage
      .from(storageRef.bucket || 'uploads')
      .list(path);

    if (error) {
      throw error;
    }

    // Convert to Firebase-like format
    const items = (data || []).map((file: any) => ({
      _path: `${path}/${file.name}`,
      fullPath: `${path}/${file.name}`,
      name: file.name,
      bucket: storageRef.bucket,
    }));

    return {
      items,
      prefixes: [], // Supabase doesn't separate folders
    };
  } catch (error) {
    console.error('[Storage] List all error:', error);
    throw error;
  }
}

/**
 * Get storage instance (stub for compatibility)
 */
export function getStorage() {
  return {
    _type: 'SupabaseStorage',
    maxUploadRetryTime: 120000,
  };
}

/**
 * Export storage instance for compatibility
 */
export const storage = getStorage();
