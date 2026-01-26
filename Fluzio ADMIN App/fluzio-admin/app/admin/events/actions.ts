'use server';

import { getAdminAuth, db } from '@/lib/firebase/admin';
import { collection, query, where, orderBy, limit, getDocs, getDoc, doc, setDoc, updateDoc, deleteDoc, addDoc } from '@/lib/firebase/firestoreCompat';
import { getAdminById } from '@/lib/repositories/admins';
import { writeAuditLog } from '@/lib/repositories/audit';
import { Event, EventStatus } from '@/lib/types';
import { cookies } from 'next/headers';

async function getAuthenticatedAdmin() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  if (!sessionCookie) {
    throw new Error('No session cookie found');
  }

  const auth = getAdminAuth();
  const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
  const admin = await getAdminById(decodedClaims.uid);

  if (!admin) {
    throw new Error('Admin not found');
  }

  return admin;
}

export async function getEventsAction(
  filters?: {
    status?: EventStatus;
    type?: string;
    countryId?: string;
    search?: string;
  }
) {
  try {
    console.log('[getEventsAction] Starting with filters:', filters);
    
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      throw new Error('Unauthorized');
    }

    console.log('[getEventsAction] Admin authenticated:', admin.uid, 'role:', admin.role);
    console.log('[getEventsAction] Country scopes:', admin.countryScopes);

    // Using db from imports
    let conditions: any[] = [orderBy('createdAt', 'desc')];

    // Apply country scope if not super admin
    const countryScopes = admin.countryScopes || [];
    console.log('[getEventsAction] Using country scopes:', countryScopes);
    
    if (!countryScopes.includes('GLOBAL') && countryScopes.length > 0) {
      console.log('[getEventsAction] Filtering by country scopes:', countryScopes);
      conditions.push(where('countryId', 'in', countryScopes));
    }

    // Apply filters
    if (filters?.countryId && countryScopes.includes('GLOBAL')) {
      conditions.push(where('countryId', '==', filters.countryId));
    }

    if (filters?.status) {
      conditions.push(where('status', '==', filters.status));
    }

    if (filters?.type) {
      conditions.push(where('type', '==', filters.type));
    }

    const q = query(collection(db, 'events'), ...conditions);
    const snapshot = await getDocs(q);
    let events: Event[] = [];

    snapshot.docs.forEach((doc: any) => {
      try {
        const data = doc.data();
        events.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toMillis?.() || data.createdAt,
          updatedAt: data.updatedAt?.toMillis?.() || data.updatedAt,
        } as Event);
      } catch (docError) {
        console.error('[getEventsAction] Error processing event doc:', doc.id, docError);
        // Skip this document but continue processing others
      }
    });

    // Apply search filter client-side
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      events = events.filter(
        (event) =>
          event.title?.toLowerCase().includes(searchLower) ||
          event.id.toLowerCase().includes(searchLower)
      );
    }

    console.log('[getEventsAction] Returning', events.length, 'events');
    return { success: true, events };
  } catch (error: any) {
    console.error('[getEventsAction] Error:', error);
    console.error('[getEventsAction] Error stack:', error.stack);
    // Return empty array instead of throwing to prevent 500 errors
    return { success: false, events: [], error: error.message || 'Failed to fetch events' };
  }
}

export async function updateEventStatusAction(
  eventId: string,
  newStatus: EventStatus
) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      throw new Error('Unauthorized');
    }

    // Check permission
    if (!['SUPER_ADMIN', 'COUNTRY_ADMIN', 'CONTENT_MODERATOR'].includes(admin.role)) {
      throw new Error('Insufficient permissions');
    }

    // Using db from imports
    const eventRef = doc(db, 'events', eventId);
    const eventDoc = await getDoc(eventRef);

    if (!eventDoc.exists) {
      throw new Error('Event not found');
    }

    const event = { id: eventDoc.id, ...eventDoc.data() } as Event;

    // Check country scope
    if (!admin.countryScopes.includes('GLOBAL') && !admin.countryScopes.includes(event.countryId)) {
      throw new Error('Cannot modify events outside your country scope');
    }

    const oldStatus = event.status;

    // Update event status
    await updateDoc(eventRef, {
      status: newStatus,
      updatedAt: new Date(),
    });

    // Write audit log
    await writeAuditLog({
      adminId: admin.uid,
      action: 'UPDATE_EVENT_STATUS',
      resource: 'EVENT',
      resourceId: eventId,
      details: {
        actorRole: admin.role,
        countryScopeUsed: event.countryId,
        before: { status: oldStatus },
        after: { status: newStatus },
      },
      ipAddress: 'server',
      userAgent: 'admin-app',
    });

    return { success: true };
  } catch (error: any) {
    console.error('[updateEventStatusAction] Error:', error);
    throw new Error(error.message || 'Failed to update event status');
  }
}

export async function deleteEventAction(eventId: string) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      throw new Error('Unauthorized');
    }

    // Only super admin and country admin can delete
    if (!['SUPER_ADMIN', 'COUNTRY_ADMIN'].includes(admin.role)) {
      throw new Error('Insufficient permissions');
    }

    // Using db from imports
    const eventRef = doc(db, 'events', eventId);
    const eventDoc = await getDoc(eventRef);

    if (!eventDoc.exists) {
      throw new Error('Event not found');
    }

    const event = { id: eventDoc.id, ...eventDoc.data() } as Event;

    // Check country scope
    if (!admin.countryScopes.includes('GLOBAL') && !admin.countryScopes.includes(event.countryId)) {
      throw new Error('Cannot delete events outside your country scope');
    }

    // Delete the event
    await deleteDoc(eventRef);

    // Write audit log
    await writeAuditLog({
      adminId: admin.uid,
      action: 'DELETE_EVENT',
      resource: 'EVENT',
      resourceId: eventId,
      details: {
        actorRole: admin.role,
        countryScopeUsed: event.countryId,
        deletedEvent: {
          title: event.title,
          type: event.type,
          status: event.status,
        },
      },
      ipAddress: 'server',
      userAgent: 'admin-app',
    });

    return { success: true };
  } catch (error: any) {
    console.error('[deleteEventAction] Error:', error);
    throw new Error(error.message || 'Failed to delete event');
  }
}

export async function createEventAction(eventData: {
  title: string;
  description?: string;
  type: string;
  category?: string;
  categories?: string[];
  location?: string;
  city?: string;
  venue?: string;
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  duration?: number;
  capacity: number;
  countryId: string;
  imageUrl?: string;
  targetAudience?: string[];
  ticketing: {
    mode: 'FREE' | 'PAID';
    price?: number;
    paymentOptions?: {
      acceptMoney?: boolean;
      acceptPoints?: boolean;
      pointsPrice?: number;
    };
  };
  highlights?: string[];
  requirements?: string;
  benefits?: string;
}) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      throw new Error('Unauthorized');
    }

    // Check permission
    if (!['SUPER_ADMIN', 'COUNTRY_ADMIN', 'CONTENT_MODERATOR'].includes(admin.role)) {
      throw new Error('Insufficient permissions');
    }

    // Validate country scope
    if (!admin.countryScopes.includes('GLOBAL') && !admin.countryScopes.includes(eventData.countryId)) {
      throw new Error('Cannot create events in this country');
    }

    // Using db from imports
    const eventId = crypto.randomUUID();
    const eventRef = doc(db, 'events', eventId);

    const event: any = {
      id: eventId,
      title: eventData.title,
      description: eventData.description || '',
      type: eventData.type,
      category: eventData.category || eventData.categories?.[0] || 'OTHER',
      categories: eventData.categories || [eventData.category || 'OTHER'],
      location: eventData.location || '',
      city: eventData.city || '',
      venue: eventData.venue || '',
      startDate: eventData.startDate || '',
      startTime: eventData.startTime || '',
      endDate: eventData.endDate || '',
      endTime: eventData.endTime || '',
      duration: eventData.duration || 1,
      capacity: eventData.capacity,
      attendanceCount: 0,
      countryId: eventData.countryId,
      imageUrl: eventData.imageUrl || '',
      targetAudience: eventData.targetAudience || ['CUSTOMERS'],
      ticketing: {
        mode: eventData.ticketing.mode,
        price: eventData.ticketing.price || 0,
        tierGate: [],
      },
      highlights: eventData.highlights || [],
      status: 'DRAFT' as EventStatus,
      organizerBusinessId: admin.uid,
      budget: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await setDoc(eventRef, event);

    // Write audit log
    await writeAuditLog({
      adminId: admin.uid,
      action: 'CREATE_EVENT',
      resource: 'EVENT',
      resourceId: eventId,
      details: {
        actorRole: admin.role,
        countryScopeUsed: eventData.countryId,
        eventTitle: eventData.title,
        eventType: eventData.type,
      },
      ipAddress: 'server',
      userAgent: 'admin-app',
    });

    return { success: true, eventId: eventId };
  } catch (error: any) {
    console.error('[createEventAction] Error:', error);
    throw new Error(error.message || 'Failed to create event');
  }
}

export async function updateEventAction(
  eventId: string,
  eventData: {
    title?: string;
    description?: string;
    type?: string;
    category?: string;
    location?: string;
    city?: string;
    startDate?: string;
    startTime?: string;
    endDate?: string;
    endTime?: string;
    capacity?: number;
    imageUrl?: string;
    ticketing?: {
      mode: 'FREE' | 'PAID';
      price?: number;
      paymentOptions?: {
        acceptMoney?: boolean;
        acceptPoints?: boolean;
        pointsPrice?: number;
      };
    };
  }
) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      throw new Error('Unauthorized');
    }

    // Check permission
    if (!['SUPER_ADMIN', 'COUNTRY_ADMIN', 'CONTENT_MODERATOR'].includes(admin.role)) {
      throw new Error('Insufficient permissions');
    }

    // Using db from imports
    const eventRef = doc(db, 'events', eventId);
    const eventDoc = await getDoc(eventRef);

    if (!eventDoc.exists) {
      throw new Error('Event not found');
    }

    const event = { id: eventDoc.id, ...eventDoc.data() } as Event;

    // Validate country scope
    if (!admin.countryScopes.includes('GLOBAL') && !admin.countryScopes.includes(event.countryId)) {
      throw new Error('Cannot edit events outside your country scope');
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (eventData.title !== undefined) updateData.title = eventData.title;
    if (eventData.description !== undefined) updateData.description = eventData.description;
    if (eventData.type !== undefined) updateData.type = eventData.type;
    if (eventData.category !== undefined) updateData.category = eventData.category;
    if (eventData.location !== undefined) updateData.location = eventData.location;
    if (eventData.city !== undefined) updateData.city = eventData.city;
    if (eventData.startDate !== undefined) updateData.startDate = eventData.startDate;
    if (eventData.startTime !== undefined) updateData.startTime = eventData.startTime;
    if (eventData.endDate !== undefined) updateData.endDate = eventData.endDate;
    if (eventData.endTime !== undefined) updateData.endTime = eventData.endTime;
    if (eventData.capacity !== undefined) updateData.capacity = eventData.capacity;
    if (eventData.imageUrl !== undefined) updateData.imageUrl = eventData.imageUrl;
    if (eventData.ticketing !== undefined) updateData.ticketing = eventData.ticketing;

    await updateDoc(eventRef, updateData);

    // Write audit log
    await writeAuditLog({
      adminId: admin.uid,
      action: 'UPDATE_EVENT',
      resource: 'EVENT',
      resourceId: eventId,
      details: {
        actorRole: admin.role,
        countryScopeUsed: event.countryId,
        updatedFields: Object.keys(updateData),
      },
      ipAddress: 'server',
      userAgent: 'admin-app',
    });

    return { success: true };
  } catch (error: any) {
    console.error('[updateEventAction] Error:', error);
    throw new Error(error.message || 'Failed to update event');
  }
}
