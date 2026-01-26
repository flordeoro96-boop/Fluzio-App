/**
 * Creator Booking Service
 * 
 * Manages booking flow for creator services
 * - Package selection
 * - Date selection with availability check
 * - Booking creation and status management
 * - Payment deposit handling
 * - Email confirmations
 * - Integration with availability calendar
 */

import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  Timestamp,
  serverTimestamp
} from '../services/firestoreCompat';
import { db } from './apiService';
import { markDateBooked, releaseBookedDate } from './creatorAvailabilityService';

export type BookingStatus = 
  | 'pending'          // Awaiting creator confirmation
  | 'confirmed'        // Creator confirmed, awaiting payment
  | 'paid'             // Payment received, scheduled
  | 'in-progress'      // Work in progress
  | 'completed'        // Delivered and completed
  | 'cancelled'        // Cancelled by either party
  | 'refunded';        // Refunded

export interface Booking {
  id: string;
  
  // Parties
  businessId: string;
  businessName: string;
  creatorId: string;
  creatorName: string;
  
  // Service Details
  packageId: string;
  packageName: string;
  packageTier: 'bronze' | 'silver' | 'gold' | 'custom';
  
  // Schedule
  startDate: Date;
  deliveryDate: Date;  // Calculated from package delivery days
  
  // Pricing
  price: number;
  currency: string;
  depositAmount: number;  // 50% upfront
  remainingAmount: number;
  
  // Status
  status: BookingStatus;
  
  // Details
  requirements: string;  // Business requirements/brief
  deliverables: string[];
  features: string[];
  
  // Payments
  depositPaid: boolean;
  depositPaidAt?: Date;
  finalPaymentPaid: boolean;
  finalPaymentPaidAt?: Date;
  
  // Communication
  notes: string;
  creatorNotes?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  confirmedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
}

export interface BookingRequest {
  businessId: string;
  businessName: string;
  creatorId: string;
  creatorName: string;
  packageId: string;
  startDate: Date;
  requirements: string;
}

/**
 * Create a new booking
 */
export const createBooking = async (
  request: BookingRequest,
  packageData: {
    name: string;
    tier: 'bronze' | 'silver' | 'gold' | 'custom';
    price: number;
    currency: string;
    deliveryDays: number;
    features: string[];
    deliverables: string[];
  }
): Promise<string> => {
  try {
    // Calculate delivery date
    const deliveryDate = new Date(request.startDate);
    deliveryDate.setDate(deliveryDate.getDate() + packageData.deliveryDays);
    
    // Calculate deposit (50%)
    const depositAmount = packageData.price * 0.5;
    const remainingAmount = packageData.price - depositAmount;
    
    const bookingData = {
      businessId: request.businessId,
      businessName: request.businessName,
      creatorId: request.creatorId,
      creatorName: request.creatorName,
      packageId: request.packageId,
      packageName: packageData.name,
      packageTier: packageData.tier,
      startDate: Timestamp.fromDate(request.startDate),
      deliveryDate: Timestamp.fromDate(deliveryDate),
      price: packageData.price,
      currency: packageData.currency,
      depositAmount,
      remainingAmount,
      status: 'pending' as BookingStatus,
      requirements: request.requirements,
      deliverables: packageData.deliverables,
      features: packageData.features,
      depositPaid: false,
      finalPaymentPaid: false,
      notes: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const bookingsRef = collection(db, 'bookings');
    const docRef = await addDoc(bookingsRef, bookingData);
    
    // Mark date as booked in availability calendar
    await markDateBooked(request.creatorId, request.startDate.toISOString().split('T')[0], request.startDate.toISOString().split('T')[0]);
    
    // Send notification to creator
    try {
      await addDoc(collection(db, 'notifications'), {
        userId: request.creatorId,
        type: 'booking_request',
        title: 'New Booking Request',
      message: `${request.businessName || 'A business'} has requested to book your services`,

        read: false,
        data: { bookingId: docRef.id },
        createdAt: serverTimestamp()
      });
    } catch (notifError) {
      console.error('Error sending notification:', notifError);
    }
    
    console.log('Booking created:', docRef.id);
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
};

/**
 * Get booking by ID
 */
export const getBooking = async (bookingId: string): Promise<Booking | null> => {
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    const bookingDoc = await getDoc(bookingRef);
    
    if (!bookingDoc.exists()) {
      return null;
    }
    
    const data = bookingDoc.data();
    return {
      id: bookingDoc.id,
      ...data,
      startDate: data.startDate?.toDate(),
      deliveryDate: data.deliveryDate?.toDate(),
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
      confirmedAt: data.confirmedAt?.toDate(),
      completedAt: data.completedAt?.toDate(),
      cancelledAt: data.cancelledAt?.toDate(),
      depositPaidAt: data.depositPaidAt?.toDate(),
      finalPaymentPaidAt: data.finalPaymentPaidAt?.toDate()
    } as Booking;
  } catch (error) {
    console.error('Error fetching booking:', error);
    return null;
  }
};

/**
 * Get all bookings for a creator
 */
export const getCreatorBookings = async (
  creatorId: string,
  status?: BookingStatus
): Promise<Booking[]> => {
  try {
    let q = query(
      collection(db, 'bookings'),
      where('creatorId', '==', creatorId),
      orderBy('createdAt', 'desc')
    );
    
    if (status) {
      q = query(
        collection(db, 'bookings'),
        where('creatorId', '==', creatorId),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      startDate: doc.data().startDate?.toDate(),
      deliveryDate: doc.data().deliveryDate?.toDate(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
      confirmedAt: doc.data().confirmedAt?.toDate(),
      completedAt: doc.data().completedAt?.toDate(),
      cancelledAt: doc.data().cancelledAt?.toDate(),
      depositPaidAt: doc.data().depositPaidAt?.toDate(),
      finalPaymentPaidAt: doc.data().finalPaymentPaidAt?.toDate()
    })) as Booking[];
  } catch (error) {
    console.error('Error fetching creator bookings:', error);
    return [];
  }
};

/**
 * Get all bookings for a business
 */
export const getBusinessBookings = async (
  businessId: string,
  status?: BookingStatus
): Promise<Booking[]> => {
  try {
    let q = query(
      collection(db, 'bookings'),
      where('businessId', '==', businessId),
      orderBy('createdAt', 'desc')
    );
    
    if (status) {
      q = query(
        collection(db, 'bookings'),
        where('businessId', '==', businessId),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      startDate: doc.data().startDate?.toDate(),
      deliveryDate: doc.data().deliveryDate?.toDate(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
      confirmedAt: doc.data().confirmedAt?.toDate(),
      completedAt: doc.data().completedAt?.toDate(),
      cancelledAt: doc.data().cancelledAt?.toDate(),
      depositPaidAt: doc.data().depositPaidAt?.toDate(),
      finalPaymentPaidAt: doc.data().finalPaymentPaidAt?.toDate()
    })) as Booking[];
  } catch (error) {
    console.error('Error fetching business bookings:', error);
    return [];
  }
};

/**
 * Update booking status
 */
export const updateBookingStatus = async (
  bookingId: string,
  status: BookingStatus,
  notes?: string
): Promise<void> => {
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    const updateData: any = {
      status,
      updatedAt: serverTimestamp()
    };
    
    if (notes) {
      updateData.creatorNotes = notes;
    }
    
    // Add timestamp for specific statuses
    if (status === 'confirmed') {
      updateData.confirmedAt = serverTimestamp();
    } else if (status === 'completed') {
      updateData.completedAt = serverTimestamp();
    } else if (status === 'cancelled') {
      updateData.cancelledAt = serverTimestamp();
      
      // Release the booked date
      const booking = await getBooking(bookingId);
      if (booking) {
        await releaseBookedDate(booking.creatorId, typeof booking.startDate === 'string' ? booking.startDate : booking.startDate.toISOString().split('T')[0]);
      }
    }
    
    await updateDoc(bookingRef, updateData);
    
    // Send notification to business about status change
    try {
      const booking = await getBooking(bookingId);
      if (booking) {
        let notificationMessage = '';
        let notificationTitle = '';
        
        switch (status) {
          case 'confirmed':
            notificationTitle = 'Booking Confirmed';
            notificationMessage = `Your booking request has been confirmed by the creator`;
            break;
          case 'in-progress':
            notificationTitle = 'Work Started';
            notificationMessage = `The creator has started working on your project`;
            break;
          case 'completed':
            notificationTitle = 'Project Completed';
            notificationMessage = `Your project has been completed and is ready for review`;
            break;
          case 'cancelled':
            notificationTitle = 'Booking Cancelled';
            notificationMessage = notes || 'Your booking has been cancelled';
            break;
        }
        
        if (notificationMessage) {
          await addDoc(collection(db, 'notifications'), {
            userId: booking.businessId,
            type: 'booking_update',
            title: notificationTitle,
            message: notificationMessage,
            read: false,
            data: { bookingId, status },
            createdAt: serverTimestamp()
          });
        }
      }
    } catch (notifError) {
      console.error('Error sending status notification:', notifError);
    }
  } catch (error) {
    console.error('Error updating booking status:', error);
    throw error;
  }
};

/**
 * Confirm booking (by creator)
 */
export const confirmBooking = async (
  bookingId: string,
  creatorNotes?: string
): Promise<void> => {
  await updateBookingStatus(bookingId, 'confirmed', creatorNotes);
};

/**
 * Mark deposit as paid
 */
export const markDepositPaid = async (bookingId: string): Promise<void> => {
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    await updateDoc(bookingRef, {
      depositPaid: true,
      depositPaidAt: serverTimestamp(),
      status: 'paid',
      updatedAt: serverTimestamp()
    });
    
    // Send confirmation notification
    try {
      const booking = await getBooking(bookingId);
      if (booking) {
        await addDoc(collection(db, 'notifications'), {
          userId: booking.creatorId,
          type: 'payment_received',
          title: 'Deposit Received',
          message: `Deposit payment has been received for your booking`,
          read: false,
          data: { bookingId },
          createdAt: serverTimestamp()
        });
        
        await addDoc(collection(db, 'notifications'), {
          userId: booking.businessId,
          type: 'payment_confirmed',
          title: 'Payment Confirmed',
          message: 'Your deposit payment has been confirmed. The creator will begin work soon.',
          read: false,
          data: { bookingId },
          createdAt: serverTimestamp()
        });
      }
    } catch (notifError) {
      console.error('Error sending payment confirmation:', notifError);
    }
  } catch (error) {
    console.error('Error marking deposit paid:', error);
    throw error;
  }
};

/**
 * Mark final payment as paid
 */
export const markFinalPaymentPaid = async (bookingId: string): Promise<void> => {
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    await updateDoc(bookingRef, {
      finalPaymentPaid: true,
      finalPaymentPaidAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error marking final payment paid:', error);
    throw error;
  }
};

/**
 * Start work on booking
 */
export const startBooking = async (bookingId: string): Promise<void> => {
  await updateBookingStatus(bookingId, 'in-progress');
};

/**
 * Complete booking
 */
export const completeBooking = async (
  bookingId: string,
  deliveryNotes?: string
): Promise<void> => {
  await updateBookingStatus(bookingId, 'completed', deliveryNotes);
};

/**
 * Cancel booking
 */
export const cancelBooking = async (
  bookingId: string,
  reason: string,
  refund: boolean = false
): Promise<void> => {
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    const updateData: any = {
      status: refund ? 'refunded' : 'cancelled',
      cancelledAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      creatorNotes: reason
    };
    
    await updateDoc(bookingRef, updateData);
    
    // Release the booked date
    const booking = await getBooking(bookingId);
    if (booking) {
      await releaseBookedDate(booking.creatorId, booking.startDate.toISOString().split('T')[0]);
      
      // Send cancellation notification
      try {
        const recipientId = booking.businessId; // Notify the business
        await addDoc(collection(db, 'notifications'), {
          userId: recipientId,
          type: 'booking_cancelled',
          title: refund ? 'Booking Cancelled - Refund Processed' : 'Booking Cancelled',
          message: reason,
          read: false,
          data: { bookingId, refund },
          createdAt: serverTimestamp()
        });
      } catch (notifError) {
        console.error('Error sending cancellation notification:', notifError);
      }
    }
  } catch (error) {
    console.error('Error cancelling booking:', error);
    throw error;
  }
};

/**
 * Get booking statistics for creator
 */
export const getCreatorBookingStats = async (creatorId: string) => {
  try {
    const bookings = await getCreatorBookings(creatorId);
    
    const stats = {
      total: bookings.length,
      pending: bookings.filter(b => b.status === 'pending').length,
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      paid: bookings.filter(b => b.status === 'paid').length,
      inProgress: bookings.filter(b => b.status === 'in-progress').length,
      completed: bookings.filter(b => b.status === 'completed').length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length,
      totalEarnings: bookings
        .filter(b => b.status === 'completed' || b.status === 'in-progress')
        .reduce((sum, b) => sum + b.price, 0),
      pendingPayments: bookings
        .filter(b => b.status === 'paid' || b.status === 'in-progress')
        .reduce((sum, b) => sum + (b.depositPaid ? b.remainingAmount : b.depositAmount), 0),
      upcomingBookings: bookings
        .filter(b => 
          (b.status === 'paid' || b.status === 'confirmed') &&
          b.startDate > new Date()
        )
        .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
        .slice(0, 5)
    };
    
    return stats;
  } catch (error) {
    console.error('Error calculating booking stats:', error);
    return null;
  }
};

/**
 * Get booking statistics for business
 */
export const getBusinessBookingStats = async (businessId: string) => {
  try {
    const bookings = await getBusinessBookings(businessId);
    
    const stats = {
      total: bookings.length,
      pending: bookings.filter(b => b.status === 'pending').length,
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      active: bookings.filter(b => 
        b.status === 'paid' || b.status === 'in-progress'
      ).length,
      completed: bookings.filter(b => b.status === 'completed').length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length,
      totalSpent: bookings
        .filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + b.price, 0),
      pendingPayments: bookings
        .filter(b => b.status === 'confirmed' || b.status === 'paid')
        .reduce((sum, b) => {
          if (!b.depositPaid) return sum + b.depositAmount;
          if (!b.finalPaymentPaid) return sum + b.remainingAmount;
          return sum;
        }, 0),
      upcomingDeliveries: bookings
        .filter(b => 
          (b.status === 'paid' || b.status === 'in-progress') &&
          b.deliveryDate > new Date()
        )
        .sort((a, b) => a.deliveryDate.getTime() - b.deliveryDate.getTime())
        .slice(0, 5)
    };
    
    return stats;
  } catch (error) {
    console.error('Error calculating business booking stats:', error);
    return null;
  }
};

/**
 * Check if a date is available for booking
 * (Used before creating booking)
 */
export const isDateAvailable = async (
  creatorId: string,
  date: Date
): Promise<boolean> => {
  try {
    // Check availability calendar using isDateAvailable instead
    const { isDateAvailable } = await import('./creatorAvailabilityService');
    const dateString = date.toISOString().split('T')[0];
    const available = await isDateAvailable(creatorId, dateString);
    
    if (!available) {
      return false;
    }
    
    // Double-check no existing bookings for this date
    const bookings = await getCreatorBookings(creatorId);
    const hasConflict = bookings.some(booking => {
      if (booking.status === 'cancelled' || booking.status === 'refunded') {
        return false;
      }
      
      const bookingDate = new Date(booking.startDate);
      return (
        bookingDate.getFullYear() === date.getFullYear() &&
        bookingDate.getMonth() === date.getMonth() &&
        bookingDate.getDate() === date.getDate()
      );
    });
    
    return !hasConflict;
  } catch (error) {
    console.error('Error checking date availability:', error);
    return false;
  }
};

/**
 * Get creator's booking calendar
 * Returns dates with booking information
 */
export const getCreatorBookingCalendar = async (
  creatorId: string,
  startDate: Date,
  endDate: Date
): Promise<Array<{
  date: Date;
  booking: Booking | null;
  status: 'available' | 'booked' | 'unavailable';
}>> => {
  try {
    const bookings = await getCreatorBookings(creatorId);
    const calendar: Array<{
      date: Date;
      booking: Booking | null;
      status: 'available' | 'booked' | 'unavailable';
    }> = [];
    
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateBooking = bookings.find(b => {
        if (b.status === 'cancelled' || b.status === 'refunded') {
          return false;
        }
        const bookingDate = new Date(b.startDate);
        return (
          bookingDate.getFullYear() === currentDate.getFullYear() &&
          bookingDate.getMonth() === currentDate.getMonth() &&
          bookingDate.getDate() === currentDate.getDate()
        );
      });
      
      calendar.push({
        date: new Date(currentDate),
        booking: dateBooking || null,
        status: dateBooking ? 'booked' : 'available'
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return calendar;
  } catch (error) {
    console.error('Error getting booking calendar:', error);
    return [];
  }
};
