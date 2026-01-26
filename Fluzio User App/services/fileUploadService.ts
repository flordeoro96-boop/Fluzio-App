import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from '../services/storageCompat';
import { db } from './apiService';

/**
 * File Upload Service for Firebase Storage
 * Handles image and file uploads for messages
 */

interface UploadResult {
  url: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

// Upload file to Firebase Storage
export const uploadMessageFile = async (
  file: File,
  conversationId: string,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<UploadResult> => {
  try {
    const storage = getStorage();
    
    // Create a unique filename
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `messages/${conversationId}/${userId}/${timestamp}_${sanitizedFileName}`;
    
    // Create storage reference
    const storageRef = ref(storage, filePath);
    
    // Upload file
    console.log('[FileUploadService] Uploading file:', filePath);
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        uploadedBy: userId,
        conversationId,
        originalName: file.name
      }
    });
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    console.log('[FileUploadService] ✅ File uploaded successfully:', downloadURL);
    
    return {
      url: downloadURL,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size
    };
  } catch (error) {
    console.error('[FileUploadService] Error uploading file:', error);
    throw new Error('Failed to upload file');
  }
};

// Delete file from Firebase Storage
export const deleteMessageFile = async (fileUrl: string): Promise<void> => {
  try {
    const storage = getStorage();
    const fileRef = ref(storage, fileUrl);
    await deleteObject(fileRef);
    console.log('[FileUploadService] File deleted:', fileUrl);
  } catch (error) {
    console.error('[FileUploadService] Error deleting file:', error);
    throw error;
  }
};

// Validate file before upload
export const validateFile = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'video/mp4',
    'video/quicktime',
    'audio/mpeg',
    'audio/mp4'
  ];
  
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 10MB' };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'File type not supported' };
  }
  
  return { valid: true };
};

// Generate thumbnail for image (client-side)
export const generateImageThumbnail = (file: File, maxWidth = 300): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('File is not an image'));
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ratio = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * ratio;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

// Get file icon based on type
export const getFileIcon = (fileType: string): string => {
  if (fileType.startsWith('image/')) return '🖼️';
  if (fileType.startsWith('video/')) return '🎥';
  if (fileType.startsWith('audio/')) return '🎵';
  if (fileType === 'application/pdf') return '📄';
  return '📎';
};

// Format file size for display
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Upload project image to Firebase Storage
export const uploadProjectImage = async (
  file: File,
  projectId: string,
  userId: string
): Promise<string> => {
  try {
    const storage = getStorage();
    
    // Validate image file
    const validation = validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    
    if (!file.type.startsWith('image/')) {
      throw new Error('Only image files are allowed for projects');
    }
    
    // Create a unique filename
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `projects/${projectId}/${timestamp}_${sanitizedFileName}`;
    
    // Create storage reference
    const storageRef = ref(storage, filePath);
    
    // Upload file
    console.log('[FileUploadService] Uploading project image:', filePath);
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        uploadedBy: userId,
        projectId,
        originalName: file.name
      }
    });
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    console.log('[FileUploadService] ✅ Project image uploaded successfully:', downloadURL);
    
    return downloadURL;
  } catch (error) {
    console.error('[FileUploadService] Error uploading project image:', error);
    throw new Error('Failed to upload project image');
  }
};

// Delete project image from Firebase Storage
export const deleteProjectImage = async (imageUrl: string): Promise<void> => {
  try {
    const storage = getStorage();
    const fileRef = ref(storage, imageUrl);
    await deleteObject(fileRef);
    console.log('[FileUploadService] Project image deleted:', imageUrl);
  } catch (error) {
    console.error('[FileUploadService] Error deleting project image:', error);
    throw error;
  }
};

// Upload feed media (image or video) to Firebase Storage
export const uploadFeedMedia = async (
  file: File,
  userId: string,
  postId?: string
): Promise<string> => {
  try {
    const storage = getStorage();
    
    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    
    // Check if it's image or video
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      throw new Error('Only image and video files are allowed for feed posts');
    }
    
    // Create a unique filename
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const mediaType = file.type.startsWith('image/') ? 'images' : 'videos';
    const filePath = `feed/${mediaType}/${userId}/${postId || timestamp}_${sanitizedFileName}`;
    
    // Create storage reference
    const storageRef = ref(storage, filePath);
    
    // Upload file
    console.log('[FileUploadService] Uploading feed media:', filePath);
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        uploadedBy: userId,
        postId: postId || 'draft',
        originalName: file.name
      }
    });
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    console.log('[FileUploadService] ✅ Feed media uploaded successfully:', downloadURL);
    
    return downloadURL;
  } catch (error) {
    console.error('[FileUploadService] Error uploading feed media:', error);
    throw new Error('Failed to upload feed media');
  }
};
