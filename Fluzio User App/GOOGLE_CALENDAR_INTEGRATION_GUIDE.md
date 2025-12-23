# Google Calendar Integration Guide

## Overview
The Google Calendar integration allows businesses to connect their calendar and show real-time availability to customers booking appointments. This prevents double-booking and provides automatic calendar invites.

## Features Implemented

### 1. Calendar Connection (`googleCalendarService.ts`)
- Connect/disconnect Google Calendar via OAuth
- Automatic token refresh
- Check connection status

### 2. Availability Management
- Set business hours (recurring weekly schedule)
- Define appointment durations (30, 60, 90 minutes)
- Set buffer time between appointments
- Configure advance booking period
- Set minimum notice required

### 3. Real-Time Availability
- `getAvailableSlots()` - Get available time slots for a specific date
- `getWeekAvailability()` - Get next 7 days of availability
- Checks both business hours AND calendar conflicts
- Respects minimum notice requirement

### 4. Automatic Calendar Sync
- `createAppointmentEvent()` - Add appointment to calendar
- `updateAppointmentEvent()` - Update existing appointment
- `deleteAppointmentEvent()` - Remove cancelled appointments
- Sends calendar invites to customers automatically
- Optional Google Meet video conference links

## Setup Required

### 1. Enable Google Calendar API
In Firebase Console:
```
1. Go to Google Cloud Console
2. Select your project
3. Enable "Google Calendar API"
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs
```

### 2. Add OAuth Scopes
Update your OAuth configuration to include:
```javascript
scopes: [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events'
]
```

### 3. Backend Token Refresh Endpoint
Create Cloud Function to refresh tokens:
```javascript
// functions/index.js
exports.refreshCalendarToken = onRequest(async (req, res) => {
  const { refreshToken } = req.body;
  
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    })
  });
  
  const data = await response.json();
  res.json(data);
});
```

## Usage Examples

### Connect Calendar
```typescript
import { connectGoogleCalendar } from './services/googleCalendarService';

// After OAuth flow completes
const result = await connectGoogleCalendar(
  businessId,
  accessToken,
  refreshToken,
  expiresIn
);

if (result.success) {
  console.log('Calendar connected!');
}
```

### Set Business Hours
```typescript
import { saveAvailabilitySettings } from './services/googleCalendarService';

const settings = {
  businessId: 'business123',
  businessHours: {
    monday: {
      enabled: true,
      slots: [
        { start: '09:00', end: '12:00' },
        { start: '13:00', end: '17:00' }
      ]
    },
    tuesday: {
      enabled: true,
      slots: [{ start: '09:00', end: '17:00' }]
    },
    // ... other days
    sunday: {
      enabled: false,
      slots: []
    }
  },
  appointmentDurations: [30, 60, 90],
  defaultDuration: 60,
  bufferTime: 15,
  advanceBookingDays: 30,
  minimumNotice: 24,
  timezone: 'America/New_York'
};

await saveAvailabilitySettings(businessId, settings);
```

### Get Available Slots
```typescript
import { getAvailableSlots, formatTimeSlot } from './services/googleCalendarService';

// Get slots for specific date
const date = new Date('2025-12-20');
const slots = await getAvailableSlots(businessId, date, 60); // 60 min appointments

// Display available times
slots
  .filter(slot => slot.available)
  .forEach(slot => {
    console.log(formatTimeSlot(slot)); // "9:00 AM - 10:00 AM"
  });
```

### Book Appointment with Calendar Event
```typescript
import { createAppointmentEvent } from './services/googleCalendarService';

const result = await createAppointmentEvent(businessId, {
  title: 'Hair Cut - John Doe',
  description: 'Standard haircut appointment booked via Fluzio',
  start: new Date('2025-12-20T10:00:00'),
  end: new Date('2025-12-20T11:00:00'),
  customerEmail: 'john@example.com',
  customerName: 'John Doe',
  location: '123 Main St, City, State',
  includeVideoConference: false // Set true for Google Meet link
});

if (result.success) {
  console.log('Calendar event created:', result.eventId);
  // Save eventId to appointment record for later updates
}
```

## Enhanced Appointment Booking Flow

### Current Flow (Without Calendar):
1. User fills appointment form
2. Business receives notification
3. Business manually confirms
4. User attends appointment

### New Flow (With Calendar):
1. User selects date
2. **System shows only available time slots from calendar**
3. User selects available slot
4. **Appointment automatically added to business calendar**
5. **Customer receives calendar invite via email**
6. **Google Calendar sends automatic reminders**
7. User attends appointment

## Integration with Existing Appointment Service

Update `appointmentBookingService.ts` to include calendar sync:

```typescript
import { 
  createAppointmentEvent, 
  deleteAppointmentEvent,
  isCalendarConnected 
} from './googleCalendarService';

export async function confirmAppointment(
  appointmentId: string,
  confirmedDate: Date,
  confirmedTime: string,
  confirmationNotes?: string
): Promise<{ success: boolean; error?: string }> {
  
  // ... existing code ...
  
  // NEW: Create calendar event if calendar is connected
  const hasCalendar = await isCalendarConnected(appointment.businessId);
  
  if (hasCalendar) {
    const duration = 60; // minutes
    const endDate = new Date(confirmedDate.getTime() + (duration * 60000));
    
    const calendarResult = await createAppointmentEvent(appointment.businessId, {
      title: `${appointment.serviceRequested} - ${appointment.userName}`,
      description: `Appointment booked via Fluzio\n\nService: ${appointment.serviceRequested}\nNotes: ${appointment.notes || 'None'}`,
      start: confirmedDate,
      end: endDate,
      customerEmail: appointment.userEmail,
      customerName: appointment.userName,
      includeVideoConference: appointment.appointmentType === 'VIDEO'
    });
    
    if (calendarResult.success) {
      // Save calendar event ID to appointment
      await updateDoc(appointmentRef, {
        calendarEventId: calendarResult.eventId,
        meetingLink: calendarResult.meetingLink
      });
    }
  }
  
  // ... rest of existing code ...
}

export async function cancelAppointment(
  appointmentId: string,
  cancelledBy: 'USER' | 'BUSINESS',
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  
  // ... existing code ...
  
  // NEW: Delete calendar event
  if (appointment.calendarEventId) {
    await deleteAppointmentEvent(
      appointment.businessId,
      appointment.calendarEventId
    );
  }
  
  // ... rest of existing code ...
}
```

## UI Components Needed

### 1. Calendar Connection Button (Business Settings)
```tsx
import { connectGoogleCalendar, isCalendarConnected } from '../services/googleCalendarService';

function CalendarSettings({ businessId }) {
  const [connected, setConnected] = useState(false);
  
  useEffect(() => {
    checkConnection();
  }, []);
  
  async function checkConnection() {
    const isConnected = await isCalendarConnected(businessId);
    setConnected(isConnected);
  }
  
  async function handleConnect() {
    // Initiate OAuth flow
    window.location.href = '/api/calendar/auth';
  }
  
  return (
    <div>
      {connected ? (
        <div className="flex items-center gap-2">
          <CheckCircle className="text-green-600" />
          <span>Google Calendar Connected</span>
        </div>
      ) : (
        <button onClick={handleConnect}>
          Connect Google Calendar
        </button>
      )}
    </div>
  );
}
```

### 2. Availability Slot Picker (Appointment Booking)
```tsx
import { getAvailableSlots, formatTimeSlot } from '../services/googleCalendarService';

function TimeSlotPicker({ businessId, selectedDate, onSelectSlot }) {
  const [slots, setSlots] = useState([]);
  
  useEffect(() => {
    loadSlots();
  }, [selectedDate]);
  
  async function loadSlots() {
    const availableSlots = await getAvailableSlots(businessId, selectedDate, 60);
    setSlots(availableSlots.filter(slot => slot.available));
  }
  
  return (
    <div className="grid grid-cols-3 gap-2">
      {slots.map((slot, i) => (
        <button
          key={i}
          onClick={() => onSelectSlot(slot)}
          className="p-3 border rounded-lg hover:bg-blue-50"
        >
          {formatTimeSlot(slot)}
        </button>
      ))}
      {slots.length === 0 && (
        <div className="col-span-3 text-center text-gray-500">
          No available slots for this date
        </div>
      )}
    </div>
  );
}
```

### 3. Business Hours Editor
```tsx
function BusinessHoursEditor({ businessId }) {
  const [hours, setHours] = useState({
    monday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
    // ... other days
  });
  
  async function handleSave() {
    await saveAvailabilitySettings(businessId, {
      businessId,
      businessHours: hours,
      appointmentDurations: [30, 60, 90],
      defaultDuration: 60,
      bufferTime: 15,
      advanceBookingDays: 30,
      minimumNotice: 24,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  }
  
  return (
    <div>
      {/* Day-by-day time slot editor */}
    </div>
  );
}
```

## Benefits

### For Businesses:
- ✅ No double-booking
- ✅ Automatic calendar sync
- ✅ Less manual work
- ✅ All appointments in one place
- ✅ Automatic reminders handled by Google

### For Customers:
- ✅ See real-time availability
- ✅ Can't book unavailable times
- ✅ Receive proper calendar invites
- ✅ Get automatic reminders
- ✅ Easy to reschedule (syncs everywhere)

## Advanced Features (Future)

### 1. Multiple Calendars
- Check availability across multiple staff calendars
- Round-robin appointment assignment

### 2. Recurring Appointments
- Book weekly/monthly recurring appointments
- Automatic series creation in calendar

### 3. Waitlist
- Join waitlist if no slots available
- Automatic notification when slot opens

### 4. Smart Scheduling
- AI suggests best times based on customer preferences
- Optimize calendar to minimize gaps

### 5. Other Calendar Providers
- Microsoft Outlook integration
- Apple Calendar integration
- iCal feed support

## Security Considerations

### Token Storage
- Store access/refresh tokens encrypted
- Use Firebase Functions to handle sensitive operations
- Never expose tokens in client-side code

### Scopes
- Request minimum necessary scopes
- Allow users to revoke access anytime

### Data Privacy
- Only access calendar for appointment times
- Don't read private event details
- GDPR compliant data handling

## Implementation Priority

### Phase 1 (MVP):
1. ✅ Calendar connection OAuth flow
2. ✅ Basic availability checking
3. ✅ Create calendar events on booking
4. ⏳ Simple time slot picker UI

### Phase 2 (Enhanced):
1. Business hours configuration UI
2. Week-view availability display
3. Calendar event updates/cancellations
4. Google Meet link generation

### Phase 3 (Advanced):
1. Multiple staff calendar support
2. Recurring appointments
3. Waitlist system
4. Other calendar providers

## Status

✅ **Service Created** - `googleCalendarService.ts` with all core functions
⏳ **Backend Setup** - OAuth flow and token refresh endpoint needed
⏳ **UI Components** - Calendar connection, slot picker, hours editor
⏳ **Integration** - Update appointment booking flow
⏳ **Testing** - End-to-end calendar sync testing

The foundation is ready - now it's about connecting the OAuth flow and building the UI!
