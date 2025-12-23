/**
 * Google Calendar Integration Service
 * 
 * Enables businesses to:
 * - Connect their Google Calendar
 * - Show real-time availability to customers
 * - Automatically block booked time slots
 * - Send calendar invites to customers
 * - Sync appointment changes
 * 
 * Setup Required:
 * 1. Enable Google Calendar API in Firebase Console
 * 2. Add calendar.events scope to OAuth
 * 3. Business must grant calendar access
 */

import { db } from './AuthContext';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

// ============================================================================
// TYPES
// ============================================================================

export interface CalendarConnection {
  userId: string;
  provider: 'GOOGLE' | 'OUTLOOK' | 'APPLE';
  calendarId: string; // Primary calendar ID
  accessToken: string; // Encrypted in production
  refreshToken: string;
  expiresAt: number;
  connectedAt: Date;
  isActive: boolean;
}

export interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
}

export interface AvailabilitySettings {
  businessId: string;
  
  // Business hours (recurring weekly schedule)
  businessHours: {
    [key: string]: { // 'monday', 'tuesday', etc.
      enabled: boolean;
      slots: Array<{ start: string; end: string }>; // "09:00", "17:00"
    };
  };
  
  // Appointment duration options (in minutes)
  appointmentDurations: number[]; // [30, 60, 90]
  defaultDuration: number; // 60
  
  // Buffer time between appointments (minutes)
  bufferTime: number; // 15
  
  // How far in advance can customers book (days)
  advanceBookingDays: number; // 30
  
  // Minimum notice required (hours)
  minimumNotice: number; // 24
  
  // Time zone
  timezone: string; // "America/New_York"
}

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: Date;
  end: Date;
  attendees?: Array<{ email: string; name?: string }>;
  location?: string;
  meetingLink?: string; // Google Meet link
}

// ============================================================================
// GOOGLE CALENDAR API HELPERS
// ============================================================================

/**
 * Get fresh access token (refresh if expired)
 */
async function getValidAccessToken(userId: string): Promise<string | null> {
  try {
    const connectionRef = doc(db, 'calendarConnections', userId);
    const connectionSnap = await getDoc(connectionRef);
    
    if (!connectionSnap.exists()) {
      return null;
    }
    
    const connection = connectionSnap.data() as CalendarConnection;
    
    // Check if token is expired
    const now = Date.now();
    if (connection.expiresAt <= now) {
      // Need to refresh token
      const newToken = await refreshAccessToken(connection.refreshToken);
      
      if (!newToken) {
        return null;
      }
      
      // Update stored token
      await updateDoc(connectionRef, {
        accessToken: newToken.accessToken,
        expiresAt: newToken.expiresAt
      });
      
      return newToken.accessToken;
    }
    
    return connection.accessToken;
    
  } catch (error) {
    console.error('[GoogleCalendarService] Error getting access token:', error);
    return null;
  }
}

/**
 * Refresh expired access token
 */
async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresAt: number } | null> {
  try {
    // Call your backend endpoint that handles OAuth token refresh
    const response = await fetch('/api/calendar/refresh-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    
    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }
    
    const data = await response.json();
    
    return {
      accessToken: data.access_token,
      expiresAt: Date.now() + (data.expires_in * 1000)
    };
    
  } catch (error) {
    console.error('[GoogleCalendarService] Error refreshing token:', error);
    return null;
  }
}

/**
 * Make authenticated request to Google Calendar API
 */
async function calendarApiRequest(
  accessToken: string,
  endpoint: string,
  method: string = 'GET',
  body?: any
): Promise<any> {
  const response = await fetch(`https://www.googleapis.com/calendar/v3/${endpoint}`, {
    method,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Calendar API error: ${error}`);
  }
  
  return response.json();
}

// ============================================================================
// CALENDAR CONNECTION MANAGEMENT
// ============================================================================

/**
 * Connect Google Calendar
 * Called after OAuth flow completes
 */
export async function connectGoogleCalendar(
  userId: string,
  accessToken: string,
  refreshToken: string,
  expiresIn: number
): Promise<{ success: boolean; error?: string }> {
  
  try {
    // Get user's primary calendar
    const calendar = await calendarApiRequest(accessToken, 'calendars/primary');
    
    const connection: CalendarConnection = {
      userId,
      provider: 'GOOGLE',
      calendarId: calendar.id,
      accessToken,
      refreshToken,
      expiresAt: Date.now() + (expiresIn * 1000),
      connectedAt: new Date(),
      isActive: true
    };
    
    await setDoc(doc(db, 'calendarConnections', userId), connection);
    
    console.log('[GoogleCalendarService] Calendar connected:', calendar.id);
    
    return { success: true };
    
  } catch (error: any) {
    console.error('[GoogleCalendarService] Error connecting calendar:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Disconnect calendar
 */
export async function disconnectCalendar(userId: string): Promise<{ success: boolean }> {
  try {
    await updateDoc(doc(db, 'calendarConnections', userId), {
      isActive: false
    });
    
    return { success: true };
  } catch (error) {
    console.error('[GoogleCalendarService] Error disconnecting calendar:', error);
    return { success: false };
  }
}

/**
 * Check if user has calendar connected
 */
export async function isCalendarConnected(userId: string): Promise<boolean> {
  try {
    const connectionRef = doc(db, 'calendarConnections', userId);
    const connectionSnap = await getDoc(connectionRef);
    
    if (!connectionSnap.exists()) {
      return false;
    }
    
    const connection = connectionSnap.data() as CalendarConnection;
    return connection.isActive;
    
  } catch (error) {
    console.error('[GoogleCalendarService] Error checking connection:', error);
    return false;
  }
}

// ============================================================================
// AVAILABILITY MANAGEMENT
// ============================================================================

/**
 * Save business availability settings
 */
export async function saveAvailabilitySettings(
  businessId: string,
  settings: AvailabilitySettings
): Promise<{ success: boolean; error?: string }> {
  
  try {
    await setDoc(doc(db, 'availabilitySettings', businessId), settings);
    return { success: true };
  } catch (error: any) {
    console.error('[GoogleCalendarService] Error saving settings:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get business availability settings
 */
export async function getAvailabilitySettings(businessId: string): Promise<AvailabilitySettings | null> {
  try {
    const settingsRef = doc(db, 'availabilitySettings', businessId);
    const settingsSnap = await getDoc(settingsRef);
    
    if (!settingsSnap.exists()) {
      return null;
    }
    
    return settingsSnap.data() as AvailabilitySettings;
    
  } catch (error) {
    console.error('[GoogleCalendarService] Error getting settings:', error);
    return null;
  }
}

/**
 * Get available time slots for a specific date
 * Combines business hours + calendar availability
 */
export async function getAvailableSlots(
  businessId: string,
  date: Date,
  durationMinutes: number = 60
): Promise<TimeSlot[]> {
  
  try {
    // Get availability settings
    const settings = await getAvailabilitySettings(businessId);
    if (!settings) {
      console.warn('[GoogleCalendarService] No availability settings found');
      return [];
    }
    
    // Get day of week
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[date.getDay()];
    const daySettings = settings.businessHours[dayName];
    
    if (!daySettings || !daySettings.enabled) {
      return []; // Business closed on this day
    }
    
    // Generate potential time slots from business hours
    const potentialSlots: TimeSlot[] = [];
    
    for (const slot of daySettings.slots) {
      const [startHour, startMin] = slot.start.split(':').map(Number);
      const [endHour, endMin] = slot.end.split(':').map(Number);
      
      let currentTime = new Date(date);
      currentTime.setHours(startHour, startMin, 0, 0);
      
      const endTime = new Date(date);
      endTime.setHours(endHour, endMin, 0, 0);
      
      while (currentTime.getTime() + (durationMinutes * 60000) <= endTime.getTime()) {
        const slotEnd = new Date(currentTime.getTime() + (durationMinutes * 60000));
        
        potentialSlots.push({
          start: new Date(currentTime),
          end: slotEnd,
          available: true // Will check against calendar
        });
        
        // Move to next slot (duration + buffer time)
        currentTime = new Date(currentTime.getTime() + ((durationMinutes + settings.bufferTime) * 60000));
      }
    }
    
    // Check calendar for conflicts
    const accessToken = await getValidAccessToken(businessId);
    if (accessToken) {
      const busySlots = await getBusyTimes(accessToken, date, date);
      
      // Mark slots as unavailable if they conflict with busy times
      for (const slot of potentialSlots) {
        for (const busy of busySlots) {
          if (isOverlapping(slot.start, slot.end, busy.start, busy.end)) {
            slot.available = false;
            break;
          }
        }
      }
    }
    
    // Check minimum notice requirement
    const now = new Date();
    const minimumNoticeTime = new Date(now.getTime() + (settings.minimumNotice * 60 * 60000));
    
    for (const slot of potentialSlots) {
      if (slot.start < minimumNoticeTime) {
        slot.available = false;
      }
    }
    
    return potentialSlots;
    
  } catch (error) {
    console.error('[GoogleCalendarService] Error getting available slots:', error);
    return [];
  }
}

/**
 * Get busy times from Google Calendar
 */
async function getBusyTimes(
  accessToken: string,
  startDate: Date,
  endDate: Date
): Promise<Array<{ start: Date; end: Date }>> {
  
  try {
    const response = await calendarApiRequest(
      accessToken,
      'freeBusy',
      'POST',
      {
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        items: [{ id: 'primary' }]
      }
    );
    
    const busyTimes = response.calendars.primary.busy || [];
    
    return busyTimes.map((busy: any) => ({
      start: new Date(busy.start),
      end: new Date(busy.end)
    }));
    
  } catch (error) {
    console.error('[GoogleCalendarService] Error getting busy times:', error);
    return [];
  }
}

/**
 * Check if two time ranges overlap
 */
function isOverlapping(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  return start1 < end2 && end1 > start2;
}

// ============================================================================
// APPOINTMENT CALENDAR SYNC
// ============================================================================

/**
 * Create calendar event for appointment
 */
export async function createAppointmentEvent(
  businessId: string,
  appointment: {
    title: string;
    description: string;
    start: Date;
    end: Date;
    customerEmail: string;
    customerName: string;
    location?: string;
    includeVideoConference?: boolean;
  }
): Promise<{ success: boolean; eventId?: string; meetingLink?: string; error?: string }> {
  
  try {
    const accessToken = await getValidAccessToken(businessId);
    if (!accessToken) {
      return { success: false, error: 'Calendar not connected' };
    }
    
    const event = {
      summary: appointment.title,
      description: appointment.description,
      start: {
        dateTime: appointment.start.toISOString(),
        timeZone: 'America/New_York' // Should come from settings
      },
      end: {
        dateTime: appointment.end.toISOString(),
        timeZone: 'America/New_York'
      },
      attendees: [
        {
          email: appointment.customerEmail,
          displayName: appointment.customerName,
          responseStatus: 'needsAction'
        }
      ],
      location: appointment.location || '',
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 60 } // 1 hour before
        ]
      },
      conferenceData: appointment.includeVideoConference ? {
        createRequest: {
          requestId: `fluzio-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' }
        }
      } : undefined
    };
    
    const response = await calendarApiRequest(
      accessToken,
      `calendars/primary/events?conferenceDataVersion=1&sendUpdates=all`,
      'POST',
      event
    );
    
    console.log('[GoogleCalendarService] Event created:', response.id);
    
    return {
      success: true,
      eventId: response.id,
      meetingLink: response.hangoutLink || response.conferenceData?.entryPoints?.[0]?.uri
    };
    
  } catch (error: any) {
    console.error('[GoogleCalendarService] Error creating event:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update calendar event
 */
export async function updateAppointmentEvent(
  businessId: string,
  eventId: string,
  updates: {
    title?: string;
    description?: string;
    start?: Date;
    end?: Date;
  }
): Promise<{ success: boolean; error?: string }> {
  
  try {
    const accessToken = await getValidAccessToken(businessId);
    if (!accessToken) {
      return { success: false, error: 'Calendar not connected' };
    }
    
    const updateData: any = {};
    
    if (updates.title) updateData.summary = updates.title;
    if (updates.description) updateData.description = updates.description;
    if (updates.start) updateData.start = {
      dateTime: updates.start.toISOString(),
      timeZone: 'America/New_York'
    };
    if (updates.end) updateData.end = {
      dateTime: updates.end.toISOString(),
      timeZone: 'America/New_York'
    };
    
    await calendarApiRequest(
      accessToken,
      `calendars/primary/events/${eventId}?sendUpdates=all`,
      'PATCH',
      updateData
    );
    
    console.log('[GoogleCalendarService] Event updated:', eventId);
    
    return { success: true };
    
  } catch (error: any) {
    console.error('[GoogleCalendarService] Error updating event:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete calendar event
 */
export async function deleteAppointmentEvent(
  businessId: string,
  eventId: string
): Promise<{ success: boolean; error?: string }> {
  
  try {
    const accessToken = await getValidAccessToken(businessId);
    if (!accessToken) {
      return { success: false, error: 'Calendar not connected' };
    }
    
    await calendarApiRequest(
      accessToken,
      `calendars/primary/events/${eventId}?sendUpdates=all`,
      'DELETE'
    );
    
    console.log('[GoogleCalendarService] Event deleted:', eventId);
    
    return { success: true };
    
  } catch (error: any) {
    console.error('[GoogleCalendarService] Error deleting event:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get next 7 days of available slots
 */
export async function getWeekAvailability(
  businessId: string,
  durationMinutes: number = 60
): Promise<Map<string, TimeSlot[]>> {
  
  const availability = new Map<string, TimeSlot[]>();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    const dateKey = date.toISOString().split('T')[0];
    const slots = await getAvailableSlots(businessId, date, durationMinutes);
    
    availability.set(dateKey, slots);
  }
  
  return availability;
}

/**
 * Format time slot for display
 */
export function formatTimeSlot(slot: TimeSlot): string {
  const start = slot.start.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  
  const end = slot.end.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  
  return `${start} - ${end}`;
}

/**
 * Check if a specific time slot is available
 */
export async function isTimeSlotAvailable(
  businessId: string,
  start: Date,
  end: Date
): Promise<boolean> {
  
  try {
    const accessToken = await getValidAccessToken(businessId);
    if (!accessToken) {
      return false;
    }
    
    const busyTimes = await getBusyTimes(accessToken, start, end);
    
    for (const busy of busyTimes) {
      if (isOverlapping(start, end, busy.start, busy.end)) {
        return false;
      }
    }
    
    return true;
    
  } catch (error) {
    console.error('[GoogleCalendarService] Error checking availability:', error);
    return false;
  }
}
