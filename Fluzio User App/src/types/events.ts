/**
 * Events Module Types
 * 
 * Implements event system with tiered entitlements based on Business Level and Subscription Tier
 * 
 * Level 1: NO missions/rewards, only Squad + Events
 * Level 2 FREE: No events
 * Level 2 SILVER: Pay-per-use only
 * Level 2 GOLD: Pay-per-use + 1 free per quarter
 * Level 2 PLATINUM: 1 free per month + 1 bonus premium per quarter
 */

export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'OPEN' | 'CLOSED' | 'CANCELLED' | 'COMPLETED';
export type EventType = 'NETWORKING' | 'WORKSHOP' | 'CONFERENCE' | 'SOCIAL' | 'TRAINING' | 'OTHER';
export type EventScope = 'GLOBAL' | 'COUNTRY' | 'CITY' | 'CUSTOM';
export type TicketStatus = 'RESERVED' | 'CONFIRMED' | 'CHECKED_IN' | 'NO_SHOW' | 'CANCELLED' | 'REFUNDED';
export type PaymentType = 'FREE_CREDIT' | 'MONEY' | 'POINTS' | 'COMPLIMENTARY' | 'ADMIN_GRANTED';

export interface Event {
  id: string;
  title: string;
  description: string;
  
  // Event details
  eventType: EventType;
  isPremium: boolean; // Premium events count differently for PLATINUM tier
  
  // Location & Scope
  scope: EventScope;
  countryId?: string;
  cityId?: string;
  venue?: string;
  address?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  
  // Capacity
  maxCapacity: number;
  currentAttendees: number;
  waitlistEnabled: boolean;
  waitlistCount?: number;
  
  // Pricing
  price?: number; // Alias for pricePerTicket (backward compatibility)
  pricePerTicket: number; // Cost in $ for pay-per-use
  currency: string; // 'USD', 'EUR', etc.
  
  // Timeline
  startDateTime: Date | string;
  endDateTime: Date | string;
  registrationDeadline?: Date | string;
  
  // Status
  status: EventStatus;
  
  // Eligibility
  allowedLevels: number[]; // [1, 2, 3, etc.] - which business levels can attend
  allowedTiers?: string[]; // ['SILVER', 'GOLD', 'PLATINUM'] - which subscription tiers
  
  // Media
  imageUrl?: string;
  galleryUrls?: string[];
  
  // Organizer
  organizerId: string; // Admin who created the event
  organizerName: string;
  organizerEmail?: string;
  
  // Metadata
  createdAt: Date | string;
  updatedAt?: Date | string;
  publishedAt?: Date | string;
  tags?: string[];
  
  // Admin notes
  internalNotes?: string;
}

export interface EventTicket {
  id: string;
  eventId: string;
  businessId: string;
  businessName: string;
  
  // Ticket details
  ticketNumber: string; // Unique ticket identifier
  status: TicketStatus;
  paymentType: PaymentType;
  
  // Payment tracking
  amountPaid: number;
  currency: string;
  pointsUsed?: number; // Points spent if paymentType is POINTS
  paymentIntentId?: string; // Stripe payment intent
  
  // Credits tracking (if used)
  creditType?: 'MONTHLY' | 'QUARTERLY_STANDARD' | 'QUARTERLY_PREMIUM';
  creditLedgerId?: string; // Reference to EntitlementLedger entry
  
  // Check-in tracking
  checkedInAt?: Date | string;
  checkedInBy?: string; // Admin who checked them in
  qrCode?: string; // QR code for check-in
  
  // Metadata
  registeredAt: Date | string;
  cancelledAt?: Date | string;
  cancelledReason?: string;
  refundedAt?: Date | string;
  refundAmount?: number;
  
  // Additional attendees (if business brings guests)
  additionalAttendees?: number;
  attendeeNames?: string[];
}

export interface EventAttendance {
  id: string;
  eventId: string;
  ticketId: string;
  businessId: string;
  
  // Attendance tracking
  checkedIn: boolean;
  checkInTime?: Date | string;
  checkInMethod?: 'QR_SCAN' | 'MANUAL' | 'ADMIN';
  checkInAdminId?: string;
  
  // Engagement
  rating?: number; // 1-5 stars
  feedback?: string;
  
  // Metadata
  createdAt: Date | string;
}

export interface EntitlementLedger {
  id: string;
  businessId: string;
  businessLevel: number;
  subscriptionTier: string; // 'FREE', 'SILVER', 'GOLD', 'PLATINUM'
  
  // Period tracking
  periodType: 'MONTHLY' | 'QUARTERLY'; // Monthly for PLATINUM, Quarterly for GOLD
  periodStart: Date | string;
  periodEnd: Date | string;
  
  // Credit allocation
  standardEventsAllowed: number; // Regular events quota
  premiumEventsAllowed: number; // Premium events quota (PLATINUM only)
  
  standardEventsUsed: number;
  premiumEventsUsed: number;
  
  // Status
  isActive: boolean;
  
  // Metadata
  createdAt: Date | string;
  updatedAt?: Date | string;
  
  // Usage history (array of event IDs used)
  standardEventsConsumed?: string[];
  premiumEventsConsumed?: string[];
}

export interface EventRegistrationRequest {
  eventId: string;
  businessId: string;
  useCredit: boolean; // Try to use free credit if available
  additionalAttendees?: number;
  attendeeNames?: string[];
}

export interface EventRegistrationResponse {
  success: boolean;
  ticket?: EventTicket;
  paymentRequired: boolean;
  paymentAmount?: number;
  paymentIntentId?: string;
  creditUsed?: boolean;
  creditType?: string;
  remainingCredits?: {
    standard: number;
    premium: number;
  };
  error?: string;
}

export interface EventEntitlement {
  businessId: string;
  level: number;
  tier: string;
  
  // Current period
  currentPeriod: {
    start: Date | string;
    end: Date | string;
  };
  
  // Credits
  standardCredits: {
    total: number;
    used: number;
    remaining: number;
  };
  
  premiumCredits: {
    total: number;
    used: number;
    remaining: number;
  };
  
  // Next reset
  nextResetDate: Date | string;
  
  // Eligibility
  canAttendEvents: boolean;
  requiresPayment: boolean;
}

export interface CreateEventRequest {
  title: string;
  description: string;
  eventType: EventType;
  isPremium: boolean;
  
  scope: EventScope;
  countryId?: string;
  cityId?: string;
  venue?: string;
  address?: string;
  
  maxCapacity: number;
  pricePerTicket: number;
  currency: string;
  
  startDateTime: string;
  endDateTime: string;
  registrationDeadline?: string;
  
  allowedLevels: number[];
  allowedTiers?: string[];
  
  imageUrl?: string;
  tags?: string[];
  internalNotes?: string;
}

export interface UpdateEventRequest {
  eventId: string;
  title?: string;
  description?: string;
  eventType?: EventType;
  isPremium?: boolean;
  
  venue?: string;
  address?: string;
  
  maxCapacity?: number;
  pricePerTicket?: number;
  
  startDateTime?: string;
  endDateTime?: string;
  registrationDeadline?: string;
  
  status?: EventStatus;
  
  allowedLevels?: number[];
  allowedTiers?: string[];
  
  imageUrl?: string;
  tags?: string[];
  internalNotes?: string;
}

export interface EventStats {
  eventId: string;
  totalCapacity: number;
  confirmedAttendees: number;
  checkedInAttendees: number;
  noShows: number;
  waitlistCount: number;
  
  // Revenue
  totalRevenue: number;
  paidTickets: number;
  freeTickets: number;
  creditTickets: number;
  
  // Breakdown by payment type
  paymentBreakdown: {
    freeCredit: number;
    payPerUse: number;
    complimentary: number;
  };
  
  // Breakdown by tier
  tierBreakdown: {
    [tier: string]: number;
  };
}
