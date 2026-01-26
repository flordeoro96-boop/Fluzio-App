/**
 * Appointment Booking Service for Consultation/Appointment Request Mission
 * 
 * Flow:
 * 1. User views "Book a Consultation" mission
 * 2. User fills out appointment request form (name, phone, email, preferred date/time, service type)
 * 3. System creates appointment request in Firestore (status: PENDING)
 * 4. Business receives notification to review appointment request
 * 5. Business confirms appointment (updates status to CONFIRMED)
 * 6. User receives confirmation notification
 * 7. After appointment date passes, business marks as COMPLETED
 * 8. System releases points to user after verification period (3 days after completion)
 * 
 * Anti-Cheat:
 * - Rate limit: 5 requests per month per user per business
 * - First-time verification: Ensure user hasn't already completed this mission
 * - Time validation: Preferred date must be in future
 * - Contact info validation: Require valid phone and email
 * - Reward delay: 3-day verification period after appointment completion
 */

import { db } from './apiService';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  Timestamp,
  getDoc
} from '../services/firestoreCompat';
import { createNotification } from './notificationService';
import { logPointsTransaction } from './pointsMarketplaceService';
import { api } from './apiService';

// ============================================================================
// TYPES
// ============================================================================

export type AppointmentStatus = 
  | 'PENDING'      // Waiting for business confirmation
  | 'CONFIRMED'    // Business confirmed appointment
  | 'COMPLETED'    // Appointment has occurred
  | 'CANCELLED'    // User or business cancelled
  | 'NO_SHOW'      // User didn't show up
  | 'REWARD_UNLOCKED'; // Points have been awarded

export type AppointmentType = 
  | 'IN_PERSON'    // Physical location appointment
  | 'VIRTUAL'      // Video call, phone, or chat
  | 'PHONE'        // Phone consultation
  | 'VIDEO';       // Video consultation

export interface AppointmentRequest {
  id?: string;
  missionId: string;
  businessId: string;
  businessName: string;
  userId: string;
  userName: string;
  
  // Contact Information
  userPhone: string;
  userEmail: string;
  
  // Appointment Details
  preferredDate: Timestamp;
  preferredTime: string; // "9:00 AM", "2:30 PM", etc.
  alternativeDate?: Timestamp;
  alternativeTime?: string;
  appointmentType: AppointmentType;
  serviceRequested: string; // e.g., "Hair cut", "Legal consultation", "Financial planning"
  notes?: string; // Additional notes from user
  
  // Confirmation Details (filled when business confirms)
  confirmedDate?: Timestamp;
  confirmedTime?: string;
  confirmationNotes?: string;
  
  // Status & Tracking
  status: AppointmentStatus;
  createdAt: Timestamp;
  confirmedAt?: Timestamp;
  completedAt?: Timestamp;
  rewardUnlockDate?: Timestamp; // 3 days after completion
  
  // Points
  rewardPoints: number;
  pointsAwarded: boolean;
  
  // Participation ID (links to mission participation)
  participationId?: string;
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone format (basic validation)
 */
function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
  return phoneRegex.test(phone);
}

/**
 * Check if date is in the future
 */
function isDateInFuture(date: Timestamp): boolean {
  const now = Timestamp.now();
  return date.seconds > now.seconds;
}

/**
 * Check rate limit: Max 5 appointments per month per user per business
 */
async function checkRateLimit(userId: string, businessId: string): Promise<{ allowed: boolean; count: number }> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const q = query(
    collection(db, 'appointmentRequests'),
    where('userId', '==', userId),
    where('businessId', '==', businessId),
    where('createdAt', '>', Timestamp.fromDate(thirtyDaysAgo)),
    where('status', 'in', ['PENDING', 'CONFIRMED', 'COMPLETED'])
  );
  
  const snapshot = await getDocs(q);
  const count = snapshot.size;
  
  return {
    allowed: count < 5,
    count
  };
}

/**
 * Check if user has already completed this mission at this business
 */
async function hasCompletedBefore(userId: string, missionId: string, businessId: string): Promise<boolean> {
  const q = query(
    collection(db, 'appointmentRequests'),
    where('userId', '==', userId),
    where('missionId', '==', missionId),
    where('businessId', '==', businessId),
    where('status', 'in', ['COMPLETED', 'REWARD_UNLOCKED'])
  );
  
  const snapshot = await getDocs(q);
  return snapshot.size > 0;
}

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Create appointment request
 * Called when user submits the booking form
 */
export async function createAppointmentRequest(
  missionId: string,
  businessId: string,
  businessName: string,
  userId: string,
  userName: string,
  contactInfo: {
    phone: string;
    email: string;
  },
  appointmentDetails: {
    preferredDate: Date;
    preferredTime: string;
    alternativeDate?: Date;
    alternativeTime?: string;
    appointmentType: AppointmentType;
    serviceRequested: string;
    notes?: string;
  },
  rewardPoints: number
): Promise<{ success: boolean; appointmentId?: string; error?: string }> {
  
  try {
    // Validation
    if (!isValidEmail(contactInfo.email)) {
      return { success: false, error: 'Invalid email address' };
    }
    
    if (!isValidPhone(contactInfo.phone)) {
      return { success: false, error: 'Invalid phone number' };
    }
    
    const preferredDateTimestamp = Timestamp.fromDate(appointmentDetails.preferredDate);
    if (!isDateInFuture(preferredDateTimestamp)) {
      return { success: false, error: 'Preferred date must be in the future' };
    }
    
    // Check rate limit
    const rateLimitCheck = await checkRateLimit(userId, businessId);
    if (!rateLimitCheck.allowed) {
      return { 
        success: false, 
        error: `Rate limit exceeded: You can only book ${5} appointments per month at this business. You've made ${rateLimitCheck.count} requests.` 
      };
    }
    
    // Check if already completed
    const alreadyCompleted = await hasCompletedBefore(userId, missionId, businessId);
    if (alreadyCompleted) {
      return { 
        success: false, 
        error: 'You have already completed this mission at this business' 
      };
    }
    
    // Create appointment request
    const appointmentData: AppointmentRequest = {
      missionId,
      businessId,
      businessName,
      userId,
      userName,
      userPhone: contactInfo.phone,
      userEmail: contactInfo.email,
      preferredDate: preferredDateTimestamp,
      preferredTime: appointmentDetails.preferredTime,
      alternativeDate: appointmentDetails.alternativeDate ? Timestamp.fromDate(appointmentDetails.alternativeDate) : undefined,
      alternativeTime: appointmentDetails.alternativeTime,
      appointmentType: appointmentDetails.appointmentType,
      serviceRequested: appointmentDetails.serviceRequested,
      notes: appointmentDetails.notes,
      status: 'PENDING',
      createdAt: Timestamp.now(),
      rewardPoints,
      pointsAwarded: false
    };
    
    // Remove undefined fields
    const cleanedData = Object.fromEntries(
      Object.entries(appointmentData).filter(([_, v]) => v !== undefined)
    );
    
    const docRef = await addDoc(collection(db, 'appointmentRequests'), cleanedData);
    
    console.log('[AppointmentService] Created appointment request:', docRef.id);
    
    // Send notification to business
    await createNotification(
      businessId, // Business owner ID
      {
        type: 'MISSION_APPLICATION',
        title: '📅 New Appointment Request',
        message: `${userName} has requested a ${appointmentDetails.appointmentType.toLowerCase().replace('_', ' ')} appointment for ${appointmentDetails.serviceRequested}`,
        actionLink: `/business/appointments/${docRef.id}`
      }
    );
    
    // Send confirmation to user
    await createNotification(
      userId,
      {
        type: 'POINTS_ACTIVITY',
        title: '✅ Appointment Request Sent',
        message: `Your appointment request for ${businessName} has been sent. You'll be notified when the business confirms.`,
        actionLink: `/missions/${missionId}`
      }
    );
    
    return { success: true, appointmentId: docRef.id };
    
  } catch (error: any) {
    console.error('[AppointmentService] Error creating appointment:', error);
    return { success: false, error: error.message || 'Failed to create appointment request' };
  }
}

/**
 * Business confirms appointment
 * Called when business reviews and accepts the appointment request
 */
export async function confirmAppointment(
  appointmentId: string,
  confirmedDate: Date,
  confirmedTime: string,
  confirmationNotes?: string
): Promise<{ success: boolean; error?: string }> {
  
  try {
    const appointmentRef = doc(db, 'appointmentRequests', appointmentId);
    const appointmentSnap = await getDoc(appointmentRef);
    
    if (!appointmentSnap.exists()) {
      return { success: false, error: 'Appointment not found' };
    }
    
    const appointment = appointmentSnap.data() as AppointmentRequest;
    
    if (appointment.status !== 'PENDING') {
      return { success: false, error: `Cannot confirm appointment with status: ${appointment.status}` };
    }
    
    // Update appointment
    await updateDoc(appointmentRef, {
      status: 'CONFIRMED',
      confirmedDate: Timestamp.fromDate(confirmedDate),
      confirmedTime,
      confirmationNotes: confirmationNotes || '',
      confirmedAt: Timestamp.now()
    });
    
    console.log('[AppointmentService] Appointment confirmed:', appointmentId);
    
    // Notify user
    await createNotification(
      appointment.userId,
      {
        type: 'MISSION_APPROVED',
        title: '✅ Appointment Confirmed!',
        message: `Your appointment at ${appointment.businessName} is confirmed for ${confirmedTime} on ${confirmedDate.toLocaleDateString()}. ${confirmationNotes || ''}`,
        actionLink: `/appointments/${appointmentId}`
      }
    );
    
    return { success: true };
    
  } catch (error: any) {
    console.error('[AppointmentService] Error confirming appointment:', error);
    return { success: false, error: error.message || 'Failed to confirm appointment' };
  }
}

/**
 * Mark appointment as completed
 * Called by business after appointment has occurred
 */
export async function completeAppointment(
  appointmentId: string
): Promise<{ success: boolean; error?: string }> {
  
  try {
    const appointmentRef = doc(db, 'appointmentRequests', appointmentId);
    const appointmentSnap = await getDoc(appointmentRef);
    
    if (!appointmentSnap.exists()) {
      return { success: false, error: 'Appointment not found' };
    }
    
    const appointment = appointmentSnap.data() as AppointmentRequest;
    
    if (appointment.status !== 'CONFIRMED') {
      return { success: false, error: `Cannot complete appointment with status: ${appointment.status}` };
    }
    
    // Calculate reward unlock date (3 days from now)
    const rewardUnlockDate = new Date();
    rewardUnlockDate.setDate(rewardUnlockDate.getDate() + 3);
    
    // Update appointment
    await updateDoc(appointmentRef, {
      status: 'COMPLETED',
      completedAt: Timestamp.now(),
      rewardUnlockDate: Timestamp.fromDate(rewardUnlockDate)
    });
    
    console.log('[AppointmentService] Appointment completed:', appointmentId);
    
    // Notify user
    await createNotification(
      appointment.userId,
      {
        type: 'POINTS_ACTIVITY',
        title: '🎉 Appointment Completed!',
        message: `Thank you for visiting ${appointment.businessName}! Your ${appointment.rewardPoints} points will unlock in 3 days.`,
        actionLink: `/missions/${appointment.missionId}`
      }
    );
    
    return { success: true };
    
  } catch (error: any) {
    console.error('[AppointmentService] Error completing appointment:', error);
    return { success: false, error: error.message || 'Failed to complete appointment' };
  }
}

/**
 * Cancel appointment
 * Can be called by user or business
 */
export async function cancelAppointment(
  appointmentId: string,
  cancelledBy: 'USER' | 'BUSINESS',
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  
  try {
    const appointmentRef = doc(db, 'appointmentRequests', appointmentId);
    const appointmentSnap = await getDoc(appointmentRef);
    
    if (!appointmentSnap.exists()) {
      return { success: false, error: 'Appointment not found' };
    }
    
    const appointment = appointmentSnap.data() as AppointmentRequest;
    
    if (!['PENDING', 'CONFIRMED'].includes(appointment.status)) {
      return { success: false, error: `Cannot cancel appointment with status: ${appointment.status}` };
    }
    
    // Update appointment
    await updateDoc(appointmentRef, {
      status: 'CANCELLED'
    });
    
    console.log('[AppointmentService] Appointment cancelled:', appointmentId, 'by', cancelledBy);
    
    // Notify the other party
    const notifyUserId = cancelledBy === 'USER' ? appointment.businessId : appointment.userId;
    const notifyMessage = cancelledBy === 'USER' 
      ? `${appointment.userName} has cancelled their appointment${reason ? `: ${reason}` : '.'}`
      : `${appointment.businessName} has cancelled your appointment${reason ? `: ${reason}` : '.'}`;
    
    await createNotification(
      notifyUserId,
      {
        type: 'POINTS_ACTIVITY',
        title: '❌ Appointment Cancelled',
        message: notifyMessage,
        actionLink: `/appointments/${appointmentId}`
      }
    );
    
    return { success: true };
    
  } catch (error: any) {
    console.error('[AppointmentService] Error cancelling appointment:', error);
    return { success: false, error: error.message || 'Failed to cancel appointment' };
  }
}

/**
 * Mark user as no-show
 * Called by business if user doesn't show up
 */
export async function markNoShow(
  appointmentId: string
): Promise<{ success: boolean; error?: string }> {
  
  try {
    const appointmentRef = doc(db, 'appointmentRequests', appointmentId);
    const appointmentSnap = await getDoc(appointmentRef);
    
    if (!appointmentSnap.exists()) {
      return { success: false, error: 'Appointment not found' };
    }
    
    const appointment = appointmentSnap.data() as AppointmentRequest;
    
    if (appointment.status !== 'CONFIRMED') {
      return { success: false, error: `Cannot mark as no-show with status: ${appointment.status}` };
    }
    
    // Update appointment
    await updateDoc(appointmentRef, {
      status: 'NO_SHOW'
    });
    
    console.log('[AppointmentService] Appointment marked as no-show:', appointmentId);
    
    // Notify user (this could affect their reputation)
    await createNotification(
      appointment.userId,
      {
        type: 'POINTS_ACTIVITY',
        title: '⚠️ Missed Appointment',
        message: `You were marked as a no-show for your appointment at ${appointment.businessName}. Please contact them if this was a mistake.`,
        actionLink: `/appointments/${appointmentId}`
      }
    );
    
    return { success: true };
    
  } catch (error: any) {
    console.error('[AppointmentService] Error marking no-show:', error);
    return { success: false, error: error.message || 'Failed to mark as no-show' };
  }
}

/**
 * Unlock pending rewards
 * Called by scheduled Cloud Function after 3-day verification period
 * Similar to Bring a Friend reward distribution
 */
export async function unlockPendingAppointmentRewards(): Promise<{ 
  success: boolean; 
  processed: number; 
  errors: string[] 
}> {
  
  try {
    const now = Timestamp.now();
    
    // Query completed appointments where reward unlock date has passed
    const q = query(
      collection(db, 'appointmentRequests'),
      where('status', '==', 'COMPLETED'),
      where('pointsAwarded', '==', false),
      where('rewardUnlockDate', '<=', now)
    );
    
    const snapshot = await getDocs(q);
    let processed = 0;
    const errors: string[] = [];
    
    console.log(`[AppointmentService] Found ${snapshot.size} appointments ready for reward unlock`);
    
    for (const docSnap of snapshot.docs) {
      try {
        const appointment = docSnap.data() as AppointmentRequest;
        const appointmentId = docSnap.id;
        
        // Get current user points
        const userRef = doc(db, 'users', appointment.userId);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          errors.push(`User not found: ${appointment.userId}`);
          continue;
        }
        
        const userData = userSnap.data();
        const currentPoints = userData.points || 0;
        const newPoints = currentPoints + appointment.rewardPoints;
        
        // Award points
        await updateDoc(userRef, {
          points: newPoints
        });
        
        // Log transaction
        await logPointsTransaction(
          appointment.userId,
          'EARN',
          appointment.rewardPoints,
          'MISSION',
          `Consultation at ${appointment.businessName}`,
          currentPoints,
          newPoints
        );
        
        // Update appointment
        await updateDoc(doc(db, 'appointmentRequests', appointmentId), {
          status: 'REWARD_UNLOCKED',
          pointsAwarded: true
        });
        
        // Notify user
        await createNotification(
          appointment.userId,
          {
            type: 'POINTS_ACTIVITY',
            title: '💰 Appointment Reward Unlocked!',
            message: `You've earned ${appointment.rewardPoints} points for your consultation at ${appointment.businessName}!`,
            actionLink: '/wallet'
          }
        );
        
        processed++;
        console.log(`[AppointmentService] Unlocked reward for appointment ${appointmentId}`);
        
      } catch (error: any) {
        errors.push(`Error processing ${docSnap.id}: ${error.message}`);
      }
    }
    
    return { success: true, processed, errors };
    
  } catch (error: any) {
    console.error('[AppointmentService] Error unlocking rewards:', error);
    return { success: false, processed: 0, errors: [error.message] };
  }
}

/**
 * Get user's appointments
 */
export async function getUserAppointments(
  userId: string,
  statuses?: AppointmentStatus[]
): Promise<AppointmentRequest[]> {
  
  try {
    let q = query(
      collection(db, 'appointmentRequests'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const appointments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AppointmentRequest));
    
    // Filter by status if provided
    if (statuses && statuses.length > 0) {
      return appointments.filter(apt => statuses.includes(apt.status));
    }
    
    return appointments;
    
  } catch (error: any) {
    console.error('[AppointmentService] Error getting user appointments:', error);
    return [];
  }
}

/**
 * Get business's appointments
 */
export async function getBusinessAppointments(
  businessId: string,
  statuses?: AppointmentStatus[]
): Promise<AppointmentRequest[]> {
  
  try {
    let q = query(
      collection(db, 'appointmentRequests'),
      where('businessId', '==', businessId),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const appointments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AppointmentRequest));
    
    // Filter by status if provided
    if (statuses && statuses.length > 0) {
      return appointments.filter(apt => statuses.includes(apt.status));
    }
    
    return appointments;
    
  } catch (error: any) {
    console.error('[AppointmentService] Error getting business appointments:', error);
    return [];
  }
}

/**
 * Get specific appointment by ID
 */
export async function getAppointment(appointmentId: string): Promise<AppointmentRequest | null> {
  try {
    const appointmentRef = doc(db, 'appointmentRequests', appointmentId);
    const appointmentSnap = await getDoc(appointmentRef);
    
    if (!appointmentSnap.exists()) {
      return null;
    }
    
    return {
      id: appointmentSnap.id,
      ...appointmentSnap.data()
    } as AppointmentRequest;
    
  } catch (error: any) {
    console.error('[AppointmentService] Error getting appointment:', error);
    return null;
  }
}
