import { NextResponse } from 'next/server';

export async function GET() {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    envVarsPresent: {
      NEXT_PUBLIC_FIREBASE_API_KEY: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      FIREBASE_ADMIN_PROJECT_ID: !!process.env.FIREBASE_ADMIN_PROJECT_ID,
      FIREBASE_ADMIN_CLIENT_EMAIL: !!process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      FIREBASE_ADMIN_PRIVATE_KEY: !!process.env.FIREBASE_ADMIN_PRIVATE_KEY,
    },
    envVarsValues: {
      FIREBASE_ADMIN_PROJECT_ID: process.env.FIREBASE_ADMIN_PROJECT_ID,
      FIREBASE_ADMIN_CLIENT_EMAIL: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      FIREBASE_ADMIN_PRIVATE_KEY_LENGTH: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.length || 0,
      FIREBASE_ADMIN_PRIVATE_KEY_STARTS_WITH: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.substring(0, 30),
    },
  };

  try {
    // Try to initialize Firebase Admin
    const { getAdminAuth } = await import('@/lib/firebase/admin');
    const auth = getAdminAuth();
    diagnostics.firebaseAdmin = {
      initialized: true,
      authExists: !!auth,
    };
  } catch (error: any) {
    diagnostics.firebaseAdmin = {
      initialized: false,
      error: error.message,
      stack: error.stack,
    };
  }

  return NextResponse.json(diagnostics);
}
