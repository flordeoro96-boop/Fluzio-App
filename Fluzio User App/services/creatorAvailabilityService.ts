/**
 * Creator Availability Service
 * 
 * Manages creator availability calendar:
 * - Set available/unavailable dates
 * - Block specific dates
 * - Recurring availability patterns
 * - Check availability for bookings
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy,
  Timestamp,
  writeBatch
} from '../services/firestoreCompat';
import { db } from './apiService';

// ============================================================================
// TYPES
// ============================================================================

export interface AvailabilityBlock {
  id: string;
  creatorId: string;
  date: string; // YYYY-MM-DD format
  status: 'available' | 'unavailable' | 'booked';
  reason?: string; // Optional reason for unavailability
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface RecurringAvailability {
  id: string;
  creatorId: string;
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  isAvailable: boolean;
  startDate: Timestamp;
  endDate?: Timestamp; // Optional end date for pattern
  createdAt: Timestamp;
}

export interface AvailabilitySettings {
  creatorId: string;
  timezone: string;
  defaultAvailable: boolean; // Default to available or unavailable
  leadTimeHours: number; // Minimum hours notice for bookings
  bufferDays: number; // Days buffer between bookings
  maxAdvanceBookingDays: number; // How far in advance can book (e.g., 90 days)
  updatedAt: Timestamp;
}

export interface AvailabilityRange {
  startDate: string;
  endDate: string;
  availableDates: string[];
  unavailableDates: string[];
  bookedDates: string[];
}

// ============================================================================
// AVAILABILITY MANAGEMENT
// ============================================================================

/**
 * Set availability for a specific date
 */
export const setDateAvailability = async (
  creatorId: string,
  date: string,
  status: 'available' | 'unavailable',
  reason?: string,
  notes?: string
): Promise<string> => {
  try {
    // Check if availability block already exists for this date
    const existingQuery = query(
      collection(db, 'creatorAvailability'),
      where('creatorId', '==', creatorId),
      where('date', '==', date)
    );
    
    const existingDocs = await getDocs(existingQuery);
    
    if (!existingDocs.empty) {
      // Update existing
      const docId = existingDocs.docs[0].id;
      await updateDoc(doc(db, 'creatorAvailability', docId), {
        status,
        reason,
        notes,
        updatedAt: Timestamp.now()
      });
      return docId;
    } else {
      // Create new
      const availabilityData: Omit<AvailabilityBlock, 'id'> = {
        creatorId,
        date,
        status,
        reason,
        notes,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      const docRef = await addDoc(collection(db, 'creatorAvailability'), availabilityData);
      return docRef.id;
    }
  } catch (error) {
    console.error('❌ Error setting availability:', error);
    throw error;
  }
};

/**
 * Set availability for multiple dates (bulk operation)
 */
export const setBulkAvailability = async (
  creatorId: string,
  dates: string[],
  status: 'available' | 'unavailable',
  reason?: string
): Promise<void> => {
  try {
    const batch = writeBatch(db);
    
    for (const date of dates) {
      // Check if exists
      const existingQuery = query(
        collection(db, 'creatorAvailability'),
        where('creatorId', '==', creatorId),
        where('date', '==', date)
      );
      
      const existingDocs = await getDocs(existingQuery);
      
      if (!existingDocs.empty) {
        // Update existing
        const docRef = doc(db, 'creatorAvailability', existingDocs.docs[0].id);
        batch.update(docRef, {
          status,
          reason,
          updatedAt: Timestamp.now()
        });
      } else {
        // Create new
        const newDocRef = doc(collection(db, 'creatorAvailability'));
        batch.set(newDocRef, {
          creatorId,
          date,
          status,
          reason,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
      }
    }
    
    await batch.commit();
    console.log(`✅ Set availability for ${dates.length} dates`);
  } catch (error) {
    console.error('❌ Error setting bulk availability:', error);
    throw error;
  }
};

/**
 * Remove availability override (revert to default)
 */
export const removeAvailabilityOverride = async (availabilityId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'creatorAvailability', availabilityId));
    console.log('✅ Removed availability override');
  } catch (error) {
    console.error('❌ Error removing availability override:', error);
    throw error;
  }
};

// ============================================================================
// RECURRING AVAILABILITY
// ============================================================================

/**
 * Set recurring availability for a day of the week
 */
export const setRecurringAvailability = async (
  creatorId: string,
  dayOfWeek: number,
  isAvailable: boolean,
  startDate: Date,
  endDate?: Date
): Promise<string> => {
  try {
    const recurringData: Omit<RecurringAvailability, 'id'> = {
      creatorId,
      dayOfWeek,
      isAvailable,
      startDate: Timestamp.fromDate(startDate),
      endDate: endDate ? Timestamp.fromDate(endDate) : undefined,
      createdAt: Timestamp.now()
    };
    
    const docRef = await addDoc(collection(db, 'recurringAvailability'), recurringData);
    console.log('✅ Set recurring availability');
    return docRef.id;
  } catch (error) {
    console.error('❌ Error setting recurring availability:', error);
    throw error;
  }
};

/**
 * Get recurring availability patterns for a creator
 */
export const getRecurringAvailability = async (creatorId: string): Promise<RecurringAvailability[]> => {
  try {
    const recurringQuery = query(
      collection(db, 'recurringAvailability'),
      where('creatorId', '==', creatorId)
    );
    
    const snapshot = await getDocs(recurringQuery);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as RecurringAvailability));
  } catch (error) {
    console.error('❌ Error fetching recurring availability:', error);
    return [];
  }
};

/**
 * Delete recurring availability pattern
 */
export const deleteRecurringAvailability = async (recurringId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'recurringAvailability', recurringId));
    console.log('✅ Deleted recurring availability');
  } catch (error) {
    console.error('❌ Error deleting recurring availability:', error);
    throw error;
  }
};

// ============================================================================
// AVAILABILITY QUERIES
// ============================================================================

/**
 * Get availability for a date range
 */
export const getAvailabilityRange = async (
  creatorId: string,
  startDate: string,
  endDate: string
): Promise<AvailabilityRange> => {
  try {
    // Fetch specific availability blocks
    const availabilityQuery = query(
      collection(db, 'creatorAvailability'),
      where('creatorId', '==', creatorId),
      where('date', '>=', startDate),
      where('date', '<=', endDate)
    );
    
    const snapshot = await getDocs(availabilityQuery);
    const blocks = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AvailabilityBlock));
    
    // Get recurring patterns
    const recurringPatterns = await getRecurringAvailability(creatorId);
    
    // Get settings
    const settings = await getAvailabilitySettings(creatorId);
    
    // Generate date list
    const availableDates: string[] = [];
    const unavailableDates: string[] = [];
    const bookedDates: string[] = [];
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      
      // Check specific blocks first
      const block = blocks.find(b => b.date === dateStr);
      
      if (block) {
        if (block.status === 'available') {
          availableDates.push(dateStr);
        } else if (block.status === 'booked') {
          bookedDates.push(dateStr);
        } else {
          unavailableDates.push(dateStr);
        }
      } else {
        // Check recurring patterns
        const dayOfWeek = d.getDay();
        const recurringPattern = recurringPatterns.find(
          p => p.dayOfWeek === dayOfWeek &&
          d >= p.startDate.toDate() &&
          (!p.endDate || d <= p.endDate.toDate())
        );
        
        if (recurringPattern) {
          if (recurringPattern.isAvailable) {
            availableDates.push(dateStr);
          } else {
            unavailableDates.push(dateStr);
          }
        } else {
          // Use default setting
          if (settings.defaultAvailable) {
            availableDates.push(dateStr);
          } else {
            unavailableDates.push(dateStr);
          }
        }
      }
    }
    
    return {
      startDate,
      endDate,
      availableDates,
      unavailableDates,
      bookedDates
    };
  } catch (error) {
    console.error('❌ Error fetching availability range:', error);
    throw error;
  }
};

/**
 * Check if creator is available on a specific date
 */
export const isDateAvailable = async (creatorId: string, date: string): Promise<boolean> => {
  try {
    const range = await getAvailabilityRange(creatorId, date, date);
    return range.availableDates.includes(date);
  } catch (error) {
    console.error('❌ Error checking date availability:', error);
    return false;
  }
};

/**
 * Get all availability blocks for a creator
 */
export const getCreatorAvailability = async (creatorId: string): Promise<AvailabilityBlock[]> => {
  try {
    const availabilityQuery = query(
      collection(db, 'creatorAvailability'),
      where('creatorId', '==', creatorId),
      orderBy('date', 'asc')
    );
    
    const snapshot = await getDocs(availabilityQuery);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AvailabilityBlock));
  } catch (error) {
    console.error('❌ Error fetching creator availability:', error);
    return [];
  }
};

// ============================================================================
// SETTINGS
// ============================================================================

/**
 * Get availability settings for a creator
 */
export const getAvailabilitySettings = async (creatorId: string): Promise<AvailabilitySettings> => {
  try {
    const settingsDoc = await getDoc(doc(db, 'availabilitySettings', creatorId));
    
    if (settingsDoc.exists()) {
      return settingsDoc.data() as AvailabilitySettings;
    } else {
      // Return defaults
      return {
        creatorId,
        timezone: 'America/New_York',
        defaultAvailable: true,
        leadTimeHours: 24,
        bufferDays: 0,
        maxAdvanceBookingDays: 90,
        updatedAt: Timestamp.now()
      };
    }
  } catch (error) {
    console.error('❌ Error fetching availability settings:', error);
    // Return defaults on error
    return {
      creatorId,
      timezone: 'America/New_York',
      defaultAvailable: true,
      leadTimeHours: 24,
      bufferDays: 0,
      maxAdvanceBookingDays: 90,
      updatedAt: Timestamp.now()
    };
  }
};

/**
 * Update availability settings
 */
export const updateAvailabilitySettings = async (
  creatorId: string,
  settings: Partial<Omit<AvailabilitySettings, 'creatorId' | 'updatedAt'>>
): Promise<void> => {
  try {
    const settingsRef = doc(db, 'availabilitySettings', creatorId);
    
    await updateDoc(settingsRef, {
      ...settings,
      updatedAt: Timestamp.now()
    }).catch(async () => {
      // If document doesn't exist, create it
      await addDoc(collection(db, 'availabilitySettings'), {
        creatorId,
        ...settings,
        updatedAt: Timestamp.now()
      });
    });
    
    console.log('✅ Updated availability settings');
  } catch (error) {
    console.error('❌ Error updating availability settings:', error);
    throw error;
  }
};

// ============================================================================
// BOOKING INTEGRATION
// ============================================================================

/**
 * Mark a date as booked (called when a booking is confirmed)
 */
export const markDateBooked = async (
  creatorId: string,
  date: string,
  bookingId: string,
  notes?: string
): Promise<void> => {
  try {
    await setDateAvailability(creatorId, date, 'unavailable', `Booked: ${bookingId}`, notes);
    
    // Update the availability block to show booked status
    const availabilityQuery = query(
      collection(db, 'creatorAvailability'),
      where('creatorId', '==', creatorId),
      where('date', '==', date)
    );
    
    const snapshot = await getDocs(availabilityQuery);
    
    if (!snapshot.empty) {
      await updateDoc(doc(db, 'creatorAvailability', snapshot.docs[0].id), {
        status: 'booked',
        updatedAt: Timestamp.now()
      });
    }
    
    console.log('✅ Marked date as booked');
  } catch (error) {
    console.error('❌ Error marking date as booked:', error);
    throw error;
  }
};

/**
 * Release a booked date (called when booking is cancelled)
 */
export const releaseBookedDate = async (creatorId: string, date: string): Promise<void> => {
  try {
    const availabilityQuery = query(
      collection(db, 'creatorAvailability'),
      where('creatorId', '==', creatorId),
      where('date', '==', date),
      where('status', '==', 'booked')
    );
    
    const snapshot = await getDocs(availabilityQuery);
    
    if (!snapshot.empty) {
      // Remove the booking override - revert to default/recurring pattern
      await deleteDoc(doc(db, 'creatorAvailability', snapshot.docs[0].id));
    }
    
    console.log('✅ Released booked date');
  } catch (error) {
    console.error('❌ Error releasing booked date:', error);
    throw error;
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get next N available dates for a creator
 */
export const getNextAvailableDates = async (
  creatorId: string,
  count: number = 5
): Promise<string[]> => {
  try {
    const today = new Date();
    const settings = await getAvailabilitySettings(creatorId);
    
    // Add lead time
    const minDate = new Date(today);
    minDate.setHours(minDate.getHours() + settings.leadTimeHours);
    
    // Max booking date
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + settings.maxAdvanceBookingDays);
    
    const startDateStr = minDate.toISOString().split('T')[0];
    const endDateStr = maxDate.toISOString().split('T')[0];
    
    const range = await getAvailabilityRange(creatorId, startDateStr, endDateStr);
    
    return range.availableDates.slice(0, count);
  } catch (error) {
    console.error('❌ Error getting next available dates:', error);
    return [];
  }
};

/**
 * Calculate availability percentage for a date range
 */
export const calculateAvailabilityPercentage = async (
  creatorId: string,
  startDate: string,
  endDate: string
): Promise<number> => {
  try {
    const range = await getAvailabilityRange(creatorId, startDate, endDate);
    const totalDays = range.availableDates.length + range.unavailableDates.length + range.bookedDates.length;
    
    if (totalDays === 0) return 0;
    
    return (range.availableDates.length / totalDays) * 100;
  } catch (error) {
    console.error('❌ Error calculating availability percentage:', error);
    return 0;
  }
};
