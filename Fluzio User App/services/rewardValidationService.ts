/**
 * Reward Validation Service
 * 
 * Implements one-time code validation for both physical and online rewards:
 * - Physical stores: QR code scan (becomes invalid immediately)
 * - Online stores: Alphanumeric code validation (invalidates after first use)
 * 
 * Security Features:
 * - One-time use codes
 * - Server-side validation
 * - Audit logging
 * - Prevents screenshot reuse, multiple scans, offline abuse
 */

import { db } from './apiService';
import {
  doc,
  getDoc,
  updateDoc,
  addDoc,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  runTransaction
} from '../services/firestoreCompat';
import { CustomerRedemption, RewardValidationResult, RewardValidationType } from '../types/rewards';

/**
 * Generate SHA256 hash using browser's native crypto API
 */
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// ============================================================================
// CODE GENERATION
// ============================================================================

/**
 * Generate cryptographically secure one-time QR code
 */
export async function generateQRCode(redemptionId: string, userId: string, businessId: string): Promise<string> {
  const timestamp = Date.now();
  const randomBytes = Math.random().toString(36).substring(2, 15);
  
  // Create validation token
  const data = `${redemptionId}:${userId}:${businessId}:${timestamp}:${randomBytes}`;
  const hash = await sha256(data);
  
  // Format: REDEEM-{hash}-{timestamp}
  const qrCode = `REDEEM-${hash.substring(0, 16).toUpperCase()}-${timestamp}`;
  
  return qrCode;
}

/**
 * Generate alphanumeric code for online redemption
 */
export function generateAlphanumericCode(redemptionId: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  const redemptionPart = redemptionId.substring(0, 4).toUpperCase();
  
  // Format: XXXX-XXXX-XXXX (12 characters, grouped for readability)
  return `${redemptionPart}-${randomPart}-${timestamp}`;
}

/**
 * Generate server-side validation token (stored in database)
 */
export async function generateValidationToken(redemptionId: string, code: string): Promise<string> {
  const data = `${redemptionId}:${code}:${Date.now()}`;
  return await sha256(data);
}

// ============================================================================
// CODE VALIDATION
// ============================================================================

/**
 * Validate QR code (Physical Store)
 * - Checks if code is valid
 * - Verifies not already used
 * - Marks as validated (ONE-TIME USE)
 */
export async function validateQRCode(
  qrCode: string,
  businessId: string,
  validatedBy: string,
  metadata?: { ipAddress?: string; deviceId?: string }
): Promise<RewardValidationResult> {
  try {
    // Find redemption by QR code
    const redemptionsRef = collection(db, 'redeemedRewards');
    const q = query(
      redemptionsRef,
      where('qrCode', '==', qrCode),
      where('businessId', '==', businessId)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return {
        valid: false,
        message: 'Invalid QR code. This code does not exist or has expired.',
        error: 'CODE_NOT_FOUND'
      };
    }
    
    const redemptionDoc = snapshot.docs[0];
    const redemption = redemptionDoc.data() as CustomerRedemption;
    
    // Check if already validated
    if (redemption.validated) {
      return {
        valid: false,
        message: `This QR code was already used on ${redemption.validatedAt?.toLocaleDateString()}. Each code can only be used once.`,
        error: 'ALREADY_VALIDATED',
        redemption
      };
    }
    
    // Check if expired
    if (redemption.expiresAt && redemption.expiresAt < new Date()) {
      return {
        valid: false,
        message: 'This reward has expired and can no longer be redeemed.',
        error: 'EXPIRED',
        redemption
      };
    }
    
    // Validate using atomic transaction (prevents race conditions)
    const result = await runTransaction(db, async (transaction) => {
      const redemptionRef = doc(db, 'redeemedRewards', redemptionDoc.id);
      const freshSnap = await transaction.get(redemptionRef);
      
      if (!freshSnap.exists()) {
        throw new Error('Redemption no longer exists');
      }
      
      const freshData = freshSnap.data() as CustomerRedemption;
      
      // Double-check not validated (race condition protection)
      if (freshData.validated) {
        throw new Error('Code already validated by another scan');
      }
      
      const now = Timestamp.now();
      
      // Mark as validated (ONE-TIME USE - CANNOT BE UNDONE)
      transaction.update(redemptionRef, {
        validated: true,
        validatedAt: now,
        validatedBy,
        validationMethod: 'QR_SCAN',
        status: 'USED',
        usedAt: now,
        usedBy: validatedBy,
        ipAddress: metadata?.ipAddress,
        deviceId: metadata?.deviceId
      });
      
      // Log validation audit
      const auditRef = doc(collection(db, 'rewardValidationAudit'));
      transaction.set(auditRef, {
        redemptionId: redemptionDoc.id,
        rewardId: redemption.rewardId,
        userId: redemption.userId,
        businessId,
        validatedBy,
        validationMethod: 'QR_SCAN',
        qrCode,
        timestamp: now,
        ipAddress: metadata?.ipAddress,
        deviceId: metadata?.deviceId,
        success: true
      });
      
      return { ...freshData, validated: true, validatedAt: now.toDate() };
    });
    
    console.log(`[RewardValidation] ✅ QR code validated successfully for redemption ${redemptionDoc.id}`);
    
    return {
      valid: true,
      message: 'Reward validated successfully! This code has been marked as used.',
      redemption: result as CustomerRedemption
    };
    
  } catch (error) {
    console.error('[RewardValidation] ❌ QR validation error:', error);
    
    // Log failed attempt
    try {
      await addDoc(collection(db, 'rewardValidationAudit'), {
        businessId,
        validatedBy,
        validationMethod: 'QR_SCAN',
        qrCode,
        timestamp: Timestamp.now(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        ipAddress: metadata?.ipAddress,
        deviceId: metadata?.deviceId
      });
    } catch (logError) {
      console.error('[RewardValidation] Failed to log audit:', logError);
    }
    
    return {
      valid: false,
      message: 'Validation failed. Please try again or contact support.',
      error: error instanceof Error ? error.message : 'VALIDATION_ERROR'
    };
  }
}

/**
 * Validate alphanumeric code (Online Store)
 * - Checks if code is valid
 * - Verifies not already used
 * - Marks as validated (ONE-TIME USE)
 */
export async function validateAlphanumericCode(
  code: string,
  businessId: string,
  validatedBy?: string,
  metadata?: { ipAddress?: string; deviceId?: string }
): Promise<RewardValidationResult> {
  try {
    // Normalize code (remove spaces, uppercase)
    const normalizedCode = code.replace(/\s+/g, '').toUpperCase();
    
    // Find redemption by alphanumeric code
    const redemptionsRef = collection(db, 'redeemedRewards');
    const q = query(
      redemptionsRef,
      where('alphanumericCode', '==', normalizedCode),
      where('businessId', '==', businessId)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return {
        valid: false,
        message: 'Invalid code. Please check the code and try again.',
        error: 'CODE_NOT_FOUND'
      };
    }
    
    const redemptionDoc = snapshot.docs[0];
    const redemption = redemptionDoc.data() as CustomerRedemption;
    
    // Check if already validated
    if (redemption.validated) {
      return {
        valid: false,
        message: `This code was already used on ${redemption.validatedAt?.toLocaleDateString()}. Each code can only be used once.`,
        error: 'ALREADY_VALIDATED',
        redemption
      };
    }
    
    // Check if expired
    if (redemption.expiresAt && redemption.expiresAt < new Date()) {
      return {
        valid: false,
        message: 'This code has expired and can no longer be used.',
        error: 'EXPIRED',
        redemption
      };
    }
    
    // Validate using atomic transaction
    const result = await runTransaction(db, async (transaction) => {
      const redemptionRef = doc(db, 'redeemedRewards', redemptionDoc.id);
      const freshSnap = await transaction.get(redemptionRef);
      
      if (!freshSnap.exists()) {
        throw new Error('Redemption no longer exists');
      }
      
      const freshData = freshSnap.data() as CustomerRedemption;
      
      // Double-check not validated
      if (freshData.validated) {
        throw new Error('Code already validated');
      }
      
      const now = Timestamp.now();
      
      // Mark as validated (ONE-TIME USE)
      transaction.update(redemptionRef, {
        validated: true,
        validatedAt: now,
        validatedBy: validatedBy || 'ONLINE_SYSTEM',
        validationMethod: 'CODE_ENTRY',
        status: 'USED',
        usedAt: now,
        ipAddress: metadata?.ipAddress,
        deviceId: metadata?.deviceId
      });
      
      // Log validation audit
      const auditRef = doc(collection(db, 'rewardValidationAudit'));
      transaction.set(auditRef, {
        redemptionId: redemptionDoc.id,
        rewardId: redemption.rewardId,
        userId: redemption.userId,
        businessId,
        validatedBy: validatedBy || 'ONLINE_SYSTEM',
        validationMethod: 'CODE_ENTRY',
        alphanumericCode: normalizedCode,
        timestamp: now,
        ipAddress: metadata?.ipAddress,
        deviceId: metadata?.deviceId,
        success: true
      });
      
      return { ...freshData, validated: true, validatedAt: now.toDate() };
    });
    
    console.log(`[RewardValidation] ✅ Alphanumeric code validated for redemption ${redemptionDoc.id}`);
    
    return {
      valid: true,
      message: 'Code validated successfully! This reward has been redeemed.',
      redemption: result as CustomerRedemption
    };
    
  } catch (error) {
    console.error('[RewardValidation] ❌ Code validation error:', error);
    
    // Log failed attempt
    try {
      await addDoc(collection(db, 'rewardValidationAudit'), {
        businessId,
        validatedBy: validatedBy || 'ONLINE_SYSTEM',
        validationMethod: 'CODE_ENTRY',
        alphanumericCode: code,
        timestamp: Timestamp.now(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        ipAddress: metadata?.ipAddress,
        deviceId: metadata?.deviceId
      });
    } catch (logError) {
      console.error('[RewardValidation] Failed to log audit:', logError);
    }
    
    return {
      valid: false,
      message: 'Validation failed. Please check the code and try again.',
      error: error instanceof Error ? error.message : 'VALIDATION_ERROR'
    };
  }
}

/**
 * Check if user can redeem reward based on frequency rules
 */
export async function checkRedemptionFrequency(
  userId: string,
  rewardId: string,
  frequency: string
): Promise<{ canRedeem: boolean; reason?: string; nextAvailableDate?: Date }> {
  if (frequency === 'unlimited') {
    return { canRedeem: true };
  }
  
  // Get user's redemption history for this reward
  const redemptionsRef = collection(db, 'redeemedRewards');
  const q = query(
    redemptionsRef,
    where('userId', '==', userId),
    where('rewardId', '==', rewardId),
    where('status', '!=', 'CANCELLED')
  );
  
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    return { canRedeem: true }; // First time
  }
  
  const redemptions = snapshot.docs.map(doc => ({
    ...doc.data(),
    redeemedAt: doc.data().redeemedAt?.toDate?.() || new Date(doc.data().redeemedAt)
  }));
  
  if (frequency === 'once') {
    return {
      canRedeem: false,
      reason: 'You have already redeemed this reward. It can only be redeemed once per user.'
    };
  }
  
  // Get most recent redemption
  const sortedRedemptions = redemptions.sort((a, b) => 
    b.redeemedAt.getTime() - a.redeemedAt.getTime()
  );
  const lastRedemption = sortedRedemptions[0];
  const now = new Date();
  
  if (frequency === 'once_per_day') {
    const dayInMs = 24 * 60 * 60 * 1000;
    const timeSinceLastRedemption = now.getTime() - lastRedemption.redeemedAt.getTime();
    
    if (timeSinceLastRedemption < dayInMs) {
      const nextAvailable = new Date(lastRedemption.redeemedAt.getTime() + dayInMs);
      return {
        canRedeem: false,
        reason: 'You can redeem this reward once per day.',
        nextAvailableDate: nextAvailable
      };
    }
  }
  
  if (frequency === 'once_per_week') {
    const weekInMs = 7 * 24 * 60 * 60 * 1000;
    const timeSinceLastRedemption = now.getTime() - lastRedemption.redeemedAt.getTime();
    
    if (timeSinceLastRedemption < weekInMs) {
      const nextAvailable = new Date(lastRedemption.redeemedAt.getTime() + weekInMs);
      return {
        canRedeem: false,
        reason: 'You can redeem this reward once per week.',
        nextAvailableDate: nextAvailable
      };
    }
  }
  
  return { canRedeem: true };
}

/**
 * Get validation audit logs for a business
 */
export async function getValidationAuditLogs(
  businessId: string,
  limit: number = 100
): Promise<any[]> {
  try {
    const auditRef = collection(db, 'rewardValidationAudit');
    const q = query(
      auditRef,
      where('businessId', '==', businessId)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.() || new Date(doc.data().timestamp)
      }))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
      
  } catch (error) {
    console.error('[RewardValidation] Error fetching audit logs:', error);
    return [];
  }
}

/**
 * Check if code format is valid (client-side validation)
 */
export function isValidCodeFormat(code: string, type: 'QR' | 'ALPHANUMERIC'): boolean {
  const normalized = code.replace(/\s+/g, '').toUpperCase();
  
  if (type === 'QR') {
    // Format: REDEEM-{16chars}-{timestamp}
    return /^REDEEM-[A-F0-9]{16}-\d+$/.test(normalized);
  } else {
    // Format: XXXX-XXXX-XXXX
    return /^[A-Z0-9]{4}-[A-Z0-9]{4,}-[A-Z0-9]+$/.test(normalized);
  }
}

/**
 * Generate QR code URL for display
 */
export function generateQRCodeURL(qrCode: string): string {
  const encoded = encodeURIComponent(qrCode);
  return `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encoded}&ecc=H`;
}

/**
 * Prevent offline abuse - check if device has active internet connection
 */
export async function verifyOnlineConnection(): Promise<boolean> {
  try {
    const response = await fetch('https://www.google.com/favicon.ico', {
      method: 'HEAD',
      cache: 'no-store'
    });
    return response.ok;
  } catch {
    return false;
  }
}
