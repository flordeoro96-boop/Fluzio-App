'use server';

import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
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

    const adminDb = getAdminDb();
    let query = adminDb.collection('events').orderBy('createdAt', 'desc');

    // Apply country scope if not super admin
    const countryScopes = admin.countryScopes || [];
    console.log('[getEventsAction] Using country scopes:', countryScopes);
    
    if (!countryScopes.includes('GLOBAL') && countryScopes.length > 0) {
      console.log('[getEventsAction] Filtering by country scopes:', countryScopes);
      query = query.where('countryId', 'in', countryScopes) as any;
    }

    // Apply filters
    if (filters?.countryId && countryScopes.includes('GLOBAL')) {
      query = query.where('countryId', '==', filters.countryId) as any;
    }

    if (filters?.status) {
      query = query.where('status', '==', filters.status) as any;
    }

    if (filters?.type) {
      query = query.where('type', '==', filters.type) as any;
    }

    const snapshot = await query.get();
    let events: Event[] = [];

    snapshot.forEach((doc) => {
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

    const adminDb = getAdminDb();
    const eventRef = adminDb.collection('events').doc(eventId);
    const eventDoc = await eventRef.get();

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
    await eventRef.update({
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

    const adminDb = getAdminDb();
    const eventRef = adminDb.collection('events').doc(eventId);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      throw new Error('Event not found');
    }

    const event = { id: eventDoc.id, ...eventDoc.data() } as Event;

    // Check country scope
    if (!admin.countryScopes.includes('GLOBAL') && !admin.countryScopes.includes(event.countryId)) {
      throw new Error('Cannot delete events outside your country scope');
    }

    // Delete the event
    await eventRef.delete();

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
