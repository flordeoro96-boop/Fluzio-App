'use server';

import { getAdminAuth, db } from '@/lib/firebase/admin';
import { collection, getDocs } from '@/lib/firebase/firestoreCompat';
import { cookies } from 'next/headers';

interface EventPaymentStats {
  eventId: string;
  eventTitle: string;
  businessName: string;
  totalRegistrations: number;
  moneyPayments: number;
  pointsPayments: number;
  freeCredits: number;
  complimentary: number;
  totalMoneyCollected: number;
  totalPointsCollected: number;
  currency: string;
  eventDate: string;
}

export async function getEventPaymentStatsAction(): Promise<{
  success: boolean;
  stats?: EventPaymentStats[];
  error?: string;
}> {
  try {
    // Verify admin authentication
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    if (!sessionCookie) {
      return { success: false, error: 'Unauthorized' };
    }

    const auth = getAdminAuth();
    await auth.verifySessionCookie(sessionCookie, true);

    // Using db from imports

    // Fetch all event tickets
    const ticketsSnap = await getDocs(collection(db, 'eventTickets'));
    console.log('[EventAnalytics] Total tickets:', ticketsSnap.size);

    // Fetch all events for names
    const eventsSnap = await getDocs(collection(db, 'adminEvents'));
    const eventsMap = new Map();
    eventsSnap.forEach((doc: any) => {
      const data = doc.data();
      eventsMap.set(doc.id, {
        title: data.title || 'Unknown Event',
        businessName: data.business?.name || 'Unknown Business',
        currency: data.ticketing?.currency || 'EUR',
        startDate: data.startDate
      });
    });

    // Group tickets by event
    const eventStatsMap = new Map<string, EventPaymentStats>();

    ticketsSnap.forEach((doc: any) => {
      const ticket = doc.data();
      const eventId = ticket.eventId;
      if (!eventId) return;

      const eventInfo = eventsMap.get(eventId);
      if (!eventInfo) return;

      if (!eventStatsMap.has(eventId)) {
        eventStatsMap.set(eventId, {
          eventId,
          eventTitle: eventInfo.title,
          businessName: eventInfo.businessName,
          totalRegistrations: 0,
          moneyPayments: 0,
          pointsPayments: 0,
          freeCredits: 0,
          complimentary: 0,
          totalMoneyCollected: 0,
          totalPointsCollected: 0,
          currency: eventInfo.currency,
          eventDate: eventInfo.startDate || 'Unknown'
        });
      }

      const stats = eventStatsMap.get(eventId)!;
      stats.totalRegistrations++;

      // Count payment types
      const paymentType = ticket.paymentType;
      switch (paymentType) {
        case 'MONEY':
          stats.moneyPayments++;
          stats.totalMoneyCollected += ticket.amountPaid || 0;
          break;
        case 'POINTS':
          stats.pointsPayments++;
          stats.totalPointsCollected += ticket.pointsUsed || 0;
          break;
        case 'FREE_CREDIT':
          stats.freeCredits++;
          break;
        case 'COMPLIMENTARY':
        case 'ADMIN_GRANTED':
          stats.complimentary++;
          break;
        // Legacy support for PAY_PER_USE
        case 'PAY_PER_USE':
          // Check if points were used
          if (ticket.pointsUsed && ticket.pointsUsed > 0) {
            stats.pointsPayments++;
            stats.totalPointsCollected += ticket.pointsUsed;
          } else if (ticket.amountPaid && ticket.amountPaid > 0) {
            stats.moneyPayments++;
            stats.totalMoneyCollected += ticket.amountPaid;
          }
          break;
      }
    });

    // Convert to array and sort by total registrations
    const sortedStats = Array.from(eventStatsMap.values())
      .sort((a, b) => b.totalRegistrations - a.totalRegistrations);

    return {
      success: true,
      stats: sortedStats
    };
  } catch (error: any) {
    console.error('[getEventPaymentStatsAction] Error:', error);
    return { success: false, error: error.message || 'Failed to fetch event payment stats' };
  }
}
