// Server-side Firebase Admin SDK configuration
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let adminApp: App;

// Initialize Firebase Admin (singleton)
function getAdminApp(): App {
  if (adminApp) return adminApp;

  if (getApps().length === 0) {
    try {
      // Parse private key (handles escaped newlines from .env)
      const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
      
      // Validate required environment variables
      if (!process.env.FIREBASE_ADMIN_PROJECT_ID) {
        throw new Error('FIREBASE_ADMIN_PROJECT_ID environment variable is required');
      }
      if (!process.env.FIREBASE_ADMIN_CLIENT_EMAIL) {
        throw new Error('FIREBASE_ADMIN_CLIENT_EMAIL environment variable is required');
      }
      if (!privateKey || privateKey === 'undefined') {
        throw new Error('FIREBASE_ADMIN_PRIVATE_KEY environment variable is required');
      }

      console.log('Initializing Firebase Admin SDK...');
      console.log('Project ID:', process.env.FIREBASE_ADMIN_PROJECT_ID);
      console.log('Client Email:', process.env.FIREBASE_ADMIN_CLIENT_EMAIL);
      console.log('Private Key length:', privateKey.length);

      adminApp = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
      });

      console.log('✅ Firebase Admin SDK initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Firebase Admin SDK:', error);
      throw error;
    }
  } else {
    adminApp = getApps()[0];
  }

  return adminApp;
}

// Lazy initialization helpers
export function getAdminAuth() {
  return getAuth(getAdminApp());
}

export function getAdminDb() {
  return getFirestore(getAdminApp());
}

// Export commonly used instances
export const auth = getAdminAuth();
export const db = getAdminDb();

export default getAdminApp;
