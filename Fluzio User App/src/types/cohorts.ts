/**
 * City Cohort Types
 * 
 * Implements city-based scarcity model where each city has limited slots
 * for Level 2+ businesses. Founding partners get special badges and pricing locks.
 */

export type CohortStatus = 'OPEN' | 'CLOSED' | 'PENDING' | 'ARCHIVED';

export interface CityCohort {
  id: string;
  cityId: string;
  cityName: string;
  countryId: string;
  cohortName: string; // e.g., "Munich Founding 100", "Berlin Wave 1"
  
  // Scarcity settings
  maxSlots: number; // Total slots available (e.g., 100 for Munich, 40 for others)
  usedSlots: number; // Current number of businesses in cohort
  
  // Status
  status: CohortStatus;
  
  // Timeline
  startAt: Date | string;
  endAt?: Date | string; // Optional - cohort can be open-ended
  
  // Benefits
  foundingBadgeLabel: string; // e.g., "Founding Partner", "Early Adopter"
  pricingLockMonths: number; // Number of months to lock pricing (e.g., 12, 24, 36)
  
  // Metadata
  createdAt: Date | string;
  createdBy: string; // Admin ID
  updatedAt?: Date | string;
  updatedBy?: string;
  
  // Admin notes
  description?: string;
  notes?: string;
}

export interface CohortMembership {
  id: string;
  cohortId: string;
  businessId: string;
  businessName: string;
  
  // Membership details
  joinedAt: Date | string;
  slotNumber: number; // Position in cohort (1-100 for Munich, etc.)
  
  // Benefits tracking
  foundingBadgeActive: boolean;
  pricingLockedUntil: Date | string;
  lockedPricingPlan?: string; // The plan they locked in
  
  // Status
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  
  // Metadata
  createdAt: Date | string;
  revokedAt?: Date | string;
  revokedBy?: string;
  revokedReason?: string;
}

export interface CohortStats {
  cohortId: string;
  totalSlots: number;
  usedSlots: number;
  availableSlots: number;
  percentFilled: number;
  
  // Business breakdown
  activeBusinesses: number;
  activeMembersCount: number; // Alias for activeBusinesses
  revokedBusinesses: number;
  averageLevel: number; // Average business level in cohort
  
  // Timeline
  daysRemaining?: number;
  isOpen: boolean;
  isFull: boolean;
}

export interface CreateCohortRequest {
  cityId: string;
  cityName: string;
  countryId: string;
  cohortName: string;
  maxSlots: number;
  foundingBadgeLabel: string;
  pricingLockMonths: number;
  startAt: string;
  endAt?: string;
  description?: string;
  notes?: string;
}

export interface UpdateCohortRequest {
  cohortId: string;
  cohortName?: string;
  maxSlots?: number;
  foundingBadgeLabel?: string;
  pricingLockMonths?: number;
  endAt?: string;
  description?: string;
  notes?: string;
  status?: CohortStatus;
}
