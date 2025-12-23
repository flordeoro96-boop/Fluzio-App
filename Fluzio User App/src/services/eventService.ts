/**
 * Event Service - Firestore Integration
 * 
 * Handles all event-related database operations.
 */

import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  getDoc,
  doc,
  addDoc, 
  updateDoc,
  deleteDoc,
  Timestamp,
  DocumentData,
  arrayUnion,
  arrayRemove,
  increment
} from 'firebase/firestore';
import { db } from '../../services/AuthContext';
import { Event } from '../types/models';
import { canAttendBusinessEvent as canJoinEventLevel1, recordBusinessEventAttendance as recordEventLevel1 } from '../../services/level1SubscriptionService';
import { canJoinEvent as canJoinEventLevel2, recordEventAttendance as recordEventLevel2 } from '../../services/level2SubscriptionService';

// ============================================================================
// COLLECTION REFERENCE
// ============================================================================

const eventsCol = collection(db, 'events');
const adminEventsCol = collection(db, 'adminEvents');

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert Firestore document to Event object
 */
const docToEvent = (docData: DocumentData, docId: string): Event => {
  return {
    id: docId,
    businessId: docData.businessId,
    businessName: docData.businessName,
    title: docData.title,
    description: docData.description,
    city: docData.city,
    district: docData.district,
    date: docData.date?.toDate?.()?.toISOString() || new Date().toISOString(),
    endDate: docData.endDate?.toDate?.()?.toISOString(),
    location: docData.location,
    locationName: docData.locationName,
    type: docData.type,
    isCreatorEvent: docData.isCreatorEvent || false,
    imageUrl: docData.imageUrl,
    gallery: docData.gallery,
    maxAttendees: docData.maxAttendees,
    attendeeCount: docData.attendeeCount || 0,
    attendees: docData.attendees || [],
    entryFeePoints: docData.entryFeePoints,
    tags: docData.tags,
    status: docData.status,
    createdAt: docData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    updatedAt: docData.updatedAt?.toDate?.()?.toISOString()
  };
};

// ============================================================================
// PUBLIC FUNCTIONS
// ============================================================================

/**
 * Get all events from all collections
 * Business events are typically open to businesses from any city
 * 
 * @returns Array of all events
 */
export const getAllEvents = async (): Promise<Event[]> => {
  try {
    console.log('[EventService] Fetching all events');
    
    // Fetch from BOTH collections (events and adminEvents)
    const [eventsSnapshot, adminEventsSnapshot] = await Promise.all([
      getDocs(eventsCol),
      getDocs(adminEventsCol)
    ]);
    
    const totalEvents = eventsSnapshot.size + adminEventsSnapshot.size;
    console.log('[EventService] TOTAL events in database:', totalEvents);
    console.log('[EventService] - events collection:', eventsSnapshot.size);
    console.log('[EventService] - adminEvents collection:', adminEventsSnapshot.size);
    
    // Combine all events from both collections
    const allDocs = [...eventsSnapshot.docs, ...adminEventsSnapshot.docs];
    
    const events = allDocs.map(doc => docToEvent(doc.data(), doc.id));
    console.log('[EventService] Returning', events.length, 'events');
    return events;
  } catch (error) {
    console.error('[EventService] Error fetching events:', error);
    return [];
  }
};

/**
 * Get all events for a specific city
 * 
 * @param city - City name
 * @returns Array of events
 */
export const getEventsForCity = async (city: string): Promise<Event[]> => {
  try {
    console.log('[EventService] Fetching events for city:', city);
    
    // Fetch from BOTH collections (events and adminEvents)
    const [eventsSnapshot, adminEventsSnapshot] = await Promise.all([
      getDocs(eventsCol),
      getDocs(adminEventsCol)
    ]);
    
    const totalEvents = eventsSnapshot.size + adminEventsSnapshot.size;
    console.log('[EventService] TOTAL events in database:', totalEvents);
    console.log('[EventService] - events collection:', eventsSnapshot.size);
    console.log('[EventService] - adminEvents collection:', adminEventsSnapshot.size);
    
    // Combine all events from both collections
    const allDocs = [...eventsSnapshot.docs, ...adminEventsSnapshot.docs];
    
    if (allDocs.length > 0) {
      allDocs.forEach(doc => {
        const data = doc.data();
        console.log('[EventService] Event:', doc.id, {
          title: data.title,
          city: data.city,
          location: data.location,
          locationName: data.locationName,
          status: data.status,
          date: data.date
        });
      });
    }
    
    // Try to match events by city (case-insensitive)
    const events = allDocs
      .map(doc => docToEvent(doc.data(), doc.id))
      .filter(event => {
        const eventCity = event.city?.toLowerCase() || '';
        const searchCity = city.toLowerCase();
        const matches = eventCity.includes(searchCity) || searchCity.includes(eventCity);
        if (matches) {
          console.log('[EventService] ✅ Match found:', event.title, '- city:', event.city);
        }
        return matches;
      });
    
    console.log('[EventService] Returning', events.length, 'events for city:', city);
    return events;
  } catch (error) {
    console.error('[EventService] Error fetching events:', error);
    return [];
  }
};

/**
 * Get upcoming events for a city
 * 
 * @param city - City name
 * @returns Array of upcoming events
 */
export const getUpcomingEvents = async (city: string): Promise<Event[]> => {
  try {
    const now = Timestamp.now();
    
    const q = query(
      eventsCol,
      where('city', '==', city),
      where('status', '==', 'UPCOMING'),
      where('date', '>=', now),
      orderBy('date', 'asc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => docToEvent(doc.data(), doc.id));
  } catch (error) {
    console.error('[EventService] Error fetching upcoming events:', error);
    throw error;
  }
};

/**
 * Get creator-only events
 * 
 * @param city - City name
 * @returns Array of creator events
 */
export const getCreatorEvents = async (city: string): Promise<Event[]> => {
  try {
    const q = query(
      eventsCol,
      where('city', '==', city),
      where('isCreatorEvent', '==', true),
      where('status', 'in', ['UPCOMING', 'ONGOING']),
      orderBy('date', 'asc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => docToEvent(doc.data(), doc.id));
  } catch (error) {
    console.error('[EventService] Error fetching creator events:', error);
    throw error;
  }
};

/**
 * Get a single event by ID
 * 
 * @param eventId - Event document ID
 * @returns Event object or null if not found
 */
export const getEventById = async (eventId: string): Promise<Event | null> => {
  try {
    const docRef = doc(eventsCol, eventId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return docToEvent(docSnap.data(), docSnap.id);
  } catch (error) {
    console.error('[EventService] Error fetching event by ID:', error);
    throw error;
  }
};

/**
 * Get events created by a specific business
 * 
 * @param businessId - Business document ID
 * @returns Array of events
 */
export const getEventsByBusiness = async (businessId: string): Promise<Event[]> => {
  try {
    const q = query(
      eventsCol,
      where('businessId', '==', businessId),
      orderBy('date', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => docToEvent(doc.data(), doc.id));
  } catch (error) {
    console.error('[EventService] Error fetching events by business:', error);
    throw error;
  }
};

/**
 * Get events a user is attending
 * 
 * @param userId - User document ID
 * @returns Array of events
 */
export const getEventsByAttendee = async (userId: string): Promise<Event[]> => {
  try {
    const q = query(
      eventsCol,
      where('attendees', 'array-contains', userId),
      orderBy('date', 'asc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => docToEvent(doc.data(), doc.id));
  } catch (error) {
    console.error('[EventService] Error fetching events by attendee:', error);
    throw error;
  }
};

/**
 * Create a new event
 * 
 * @param data - Event data without ID
 * @returns New event document ID
 */
export const createEvent = async (data: Omit<Event, 'id'>): Promise<string> => {
  try {
    const eventData = {
      businessId: data.businessId,
      businessName: data.businessName,
      title: data.title,
      description: data.description,
      city: data.city,
      district: data.district,
      date: Timestamp.fromDate(new Date(data.date)),
      endDate: data.endDate ? Timestamp.fromDate(new Date(data.endDate)) : null,
      location: data.location,
      locationName: data.locationName,
      type: data.type,
      isCreatorEvent: data.isCreatorEvent,
      imageUrl: data.imageUrl,
      gallery: data.gallery || [],
      maxAttendees: data.maxAttendees,
      attendeeCount: 0,
      attendees: [],
      entryFeePoints: data.entryFeePoints || 0,
      tags: data.tags || [],
      status: data.status || 'UPCOMING',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const docRef = await addDoc(eventsCol, eventData);
    return docRef.id;
  } catch (error) {
    console.error('[EventService] Error creating event:', error);
    throw error;
  }
};

/**
 * Update an existing event
 * 
 * @param eventId - Event document ID
 * @param updates - Partial event data to update
 */
export const updateEvent = async (
  eventId: string, 
  updates: Partial<Omit<Event, 'id'>>
): Promise<void> => {
  try {
    const docRef = doc(eventsCol, eventId);
    
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.now()
    };

    // Convert date strings to Timestamps if present
    if (updates.date) {
      updateData.date = Timestamp.fromDate(new Date(updates.date));
    }
    if (updates.endDate) {
      updateData.endDate = Timestamp.fromDate(new Date(updates.endDate));
    }

    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('[EventService] Error updating event:', error);
    throw error;
  }
};

/**
 * Delete an event
 * 
 * @param eventId - Event document ID
 */
export const deleteEvent = async (eventId: string): Promise<void> => {
  try {
    const docRef = doc(eventsCol, eventId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('[EventService] Error deleting event:', error);
    throw error;
  }
};

/**
 * Add user as event attendee
 * 
 * @param eventId - Event document ID
 * @param userId - User document ID
 * @returns Success boolean
 */
export const joinEvent = async (
  eventId: string, 
  userId: string,
  userLevel: number = 2,
  userSubscriptionTier: 'FREE' | 'SILVER' | 'GOLD' | 'PLATINUM' = 'FREE'
): Promise<boolean> => {
  try {
    const event = await getEventById(eventId);
    
    if (!event) {
      throw new Error('Event not found');
    }

    // Check eligibility (level and subscription requirements)
    const eligibility = checkEventEligibility(event, userLevel, userSubscriptionTier);
    if (!eligibility.canJoin) {
      throw new Error(eligibility.reason || 'You are not eligible to join this event');
    }
    
    // Check subscription-level event access and quotas
    const isFreeEvent = event.isFreeEvent || (event.entryFeePoints === 0 || !event.entryFeePoints);
    let subscriptionCheck;
    
    if (userLevel === 1) {
      subscriptionCheck = await canJoinEventLevel1(userId, isFreeEvent);
    } else {
      subscriptionCheck = await canJoinEventLevel2(userId, isFreeEvent);
    }
    
    if (!subscriptionCheck.allowed) {
      throw new Error(subscriptionCheck.reason || 'You cannot join this event with your current subscription');
    }

    // Check if already attending
    if (event.attendees?.includes(userId)) {
      return false;
    }

    // Check if event is full
    if (event.maxAttendees && event.attendeeCount >= event.maxAttendees) {
      throw new Error('Event is full');
    }

    const docRef = doc(eventsCol, eventId);
    await updateDoc(docRef, {
      attendees: arrayUnion(userId),
      attendeeCount: increment(1),
      updatedAt: Timestamp.now()
    });
    
    // Record attendance for subscription tracking
    if (userLevel === 1) {
      await recordEventLevel1(userId, isFreeEvent);
    } else {
      await recordEventLevel2(userId, isFreeEvent);
    }

    return true;
  } catch (error) {
    console.error('[EventService] Error joining event:', error);
    throw error;
  }
};

/**
 * Check if user is eligible to join an event
 * 
 * @param event - Event object
 * @param userLevel - User's business level (1-6)
 * @param userSubscriptionTier - User's subscription tier
 * @returns Object with eligibility status and reason
 */
export const checkEventEligibility = (
  event: Event,
  userLevel: number,
  userSubscriptionTier: 'FREE' | 'SILVER' | 'GOLD' | 'PLATINUM'
): { canJoin: boolean; reason?: string; requiresUpgrade?: boolean } => {
  // Check business level requirement
  if (event.minBusinessLevel && userLevel < event.minBusinessLevel) {
    return {
      canJoin: false,
      reason: `Requires Level ${event.minBusinessLevel}+ business`,
      requiresUpgrade: true
    };
  }

  // Check subscription tier requirement
  if (event.minSubscriptionTier) {
    const tierHierarchy = { FREE: 0, SILVER: 1, GOLD: 2, PLATINUM: 3 };
    const userTierLevel = tierHierarchy[userSubscriptionTier];
    const requiredTierLevel = tierHierarchy[event.minSubscriptionTier];

    if (userTierLevel < requiredTierLevel) {
      return {
        canJoin: false,
        reason: `Requires ${event.minSubscriptionTier}+ subscription`,
        requiresUpgrade: true
      };
    }
  }

  return { canJoin: true };
};

/**
 * Remove user from event attendees
 * 
 * @param eventId - Event document ID
 * @param userId - User document ID
 * @returns Success boolean
 */
export const leaveEvent = async (eventId: string, userId: string): Promise<boolean> => {
  try {
    const event = await getEventById(eventId);
    
    if (!event) {
      throw new Error('Event not found');
    }

    // Check if actually attending
    if (!event.attendees?.includes(userId)) {
      return false;
    }

    const docRef = doc(eventsCol, eventId);
    await updateDoc(docRef, {
      attendees: arrayRemove(userId),
      attendeeCount: increment(-1),
      updatedAt: Timestamp.now()
    });

    return true;
  } catch (error) {
    console.error('[EventService] Error leaving event:', error);
    throw error;
  }
};
