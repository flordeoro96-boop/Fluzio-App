// Core TypeScript types for Fluzio Admin
import { Timestamp } from 'firebase/firestore';

// ============ ADMIN ROLES ============
export enum AdminRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  COUNTRY_ADMIN = 'COUNTRY_ADMIN',
  FINANCE = 'FINANCE',
  MODERATOR = 'MODERATOR',
  OPS_SUPPORT = 'OPS_SUPPORT',
  ANALYST_READONLY = 'ANALYST_READONLY',
}

export type AdminStatus = 'ACTIVE' | 'SUSPENDED';

export interface Admin {
  uid: string;
  email: string;
  role: AdminRole;
  countryScopes: string[]; // ["GLOBAL"] or ["DE", "AE"]
  status: AdminStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============ COUNTRY ============
export enum CountryStatus {
  SETUP = 'SETUP',
  PENDING_LAUNCH = 'PENDING_LAUNCH',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}

// ============ CITY ============
export enum CityStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export interface City {
  id: string; // Auto-generated Firestore doc ID
  name: string; // Normalized name: "Munich", "Dubai"
  countryCode: string; // "DE", "AE"
  status: CityStatus;
  
  // Auto-aggregated stats (computed via backend functions)
  stats: {
    totalUsers: number;
    activeBusinesses: number;
    aspiringBusinesses: number;
    verifiedCreators: number;
    customers: number;
    activeMissions: number;
    lastUpdated: Date;
  };
  
  // Normalized address data
  googlePlaceId?: string; // For verification if needed
  coordinates?: {
    lat: number;
    lng: number;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

export interface LaunchChecklistItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  completedAt?: Date;
  completedBy?: string;
  required: boolean;
}

export interface StatusHistoryItem {
  status: CountryStatus | string;
  changedAt: Date;
  changedBy: string; // "system" or admin UID
  reason?: string;
}

export interface Country {
  id: string;
  code: string; // "DE", "AE"
  countryId?: string; // Firestore uses this field - same as code
  name: string;
  flag?: string;
  status: CountryStatus;
  currency: string;
  language: string;
  timezone: string;

  // Auto-creation tracking
  autoCreated?: boolean;
  needsReview?: boolean; // Flag for unknown countries
  firstUserId?: string;
  firstUserName?: string;

  settings?: {
    enableBusinessVerification?: boolean;
    enableCreatorPayouts?: boolean;
    enableEvents?: boolean;
    autoApproveMissions?: boolean;
  };

  stats?: {
    totalUsers: number;
    activeBusinesses: number;
    aspiringBusinesses: number;
    verifiedCreators: number;
    customers: number;
    activeMissions: number;
  };

  launchChecklist: LaunchChecklistItem[];
  statusHistory?: StatusHistoryItem[]; // Track status changes
  launchedAt?: Date;
  suspensionReason?: string;
  suspendedAt?: Date;
  suspendedBy?: string;
  
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;
}

// Legacy country interface for backward compatibility
export interface LegacyCountry {
  countryId: string; // "DE", "AE"
  name: string;
  status: 'PLANNED' | 'PRE_LAUNCH' | 'SOFT_LAUNCH' | 'OFFICIAL' | 'ACTIVE' | 'SCALE' | 'PAUSED';
  currency: string;
  language: string;
  timeZone: string;

  featureFlags: {
    publicSignupEnabled: boolean;
    missionsEnabled: boolean;
    eventsEnabled: boolean;
    payoutAutomationEnabled: boolean;
    marketingToolsEnabled: boolean;
  };

  fees: {
    subscription?: number;
    commissionPct?: number;
    eventTicketFeePct?: number;
  };

  payoutRules: {
    minPayoutAmount: number;
    newCreatorHoldDays: number;
  };

  moderationThresholds: {
    strikeLimit: number;
    autoSuspendDisputeRate: number;
  };

  allowedMissionTypes: string[];
  allowedEventTypes: string[];

  launch: {
    readinessScore: number; // 0-100
    launchDate?: Timestamp;
    checklistByPhase: {
      [phase: string]: {
        items: ChecklistItem[];
      };
    };
  };

  admins: string[]; // adminIds
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ChecklistItem {
  id: string;
  label: string;
  ownerAdminId?: string;
  completed: boolean;
  completedAt?: Timestamp;
}

// ============ BUSINESS ============
export enum BusinessTier {
  FREE = 'FREE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface Business {
  id: string;
  countryCode: string;
  name: string;
  industry: string;
  description?: string;
  
  // Tier & Status
  tier: BusinessTier;
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
  verified: boolean;
  verificationStatus: VerificationStatus;
  verificationNotes?: string;
  
  // Contact
  email: string;
  phoneNumber?: string;
  website?: string;
  address?: string;
  
  // Owner
  ownerName: string;
  ownerEmail: string;
  
  // Metrics
  stats: {
    totalMissions: number;
    activeMissions: number;
    totalRedemptions: number;
    totalSpent: number;
  };
  
  // Moderation
  riskScore: number; // 0-100
  disputeCount: number;
  suspensionReason?: string;
  suspendedAt?: Date;
  suspendedBy?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  verifiedAt?: Date;
  verifiedBy?: string;
}

// ============ CREATOR ============
export interface Creator {
  id: string;
  userId: string; // Reference to User document
  countryCode: string;
  
  // Profile
  displayName: string;
  bio?: string;
  profilePhoto?: string;
  
  // Status
  verified: boolean;
  verificationStatus: VerificationStatus;
  verificationNotes?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
  
  // Social Media
  instagramHandle?: string;
  instagramFollowers?: number;
  instagramVerified?: boolean;
  tiktokHandle?: string;
  tiktokFollowers?: number;
  youtubeHandle?: string;
  youtubeSubscribers?: number;
  
  // Performance
  trustScore: number; // 0-100
  riskScore: number; // 0-100
  
  // Stats
  stats: {
    totalMissions: number;
    completedMissions: number;
    totalEarnings: number;
    pendingPayout: number;
    averageRating: number;
    totalReviews: number;
  };
  
  // Payouts
  payoutFrozen: boolean;
  payoutFrozenReason?: string;
  
  // Moderation
  disputeCount: number;
  suspensionReason?: string;
  suspendedAt?: Date;
  suspendedBy?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  verifiedAt?: Date;
  verifiedBy?: string;
}

// ============ CUSTOMER ============
export interface Customer {
  id: string;
  countryId: string;
  displayName?: string;
  consent: {
    marketing: boolean;
  };
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============ MISSION ============
export type MissionStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'FLAGGED'
  | 'LIVE'
  | 'COMPLETED'
  | 'DISPUTED'
  | 'CANCELLED';

export interface Mission {
  id: string;
  countryId: string;
  businessId: string;
  businessName?: string;
  creatorIds: string[];
  status: MissionStatus;
  title?: string;
  description?: string;
  missionType: string;
  location?: string;
  budget: number;
  pointsReward?: number;
  dispute: {
    isDisputed: boolean;
    reason?: string;
    resolution?: {
      refundPercent?: number;
      payoutAction?: 'HOLD' | 'RELEASE' | 'PARTIAL';
      adminReason?: string;
      resolvedAt?: Timestamp;
    };
  };
  rejectionReason?: string;
  rejectedAt?: Date;
  rejectedBy?: string;
  approvedAt?: Date;
  approvedBy?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============ EVENT ============
export type EventType = 'FUN_MEETUP' | 'BUSINESS_EVENT' | 'HYBRID';
export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'COMPLETED' | 'CANCELLED';
export type TicketMode = 'FREE' | 'PAID';

export interface Event {
  id: string;
  countryId: string;
  type: EventType;
  title: string;
  description?: string;
  organizerBusinessId?: string;
  location?: string;
  city?: string;
  venue?: string;
  address?: string;
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  duration?: number;
  capacity: number;
  budget?: number;
  imageUrl?: string;
  categories?: string[];
  targetAudience?: string[];
  ticketing: {
    mode: TicketMode;
    price?: number;
    tierGate?: string[];
  };
  attendanceCount: number;
  status: EventStatus;
  highlights?: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============ TRANSACTION ============
export type TransactionType =
  | 'SUBSCRIPTION'
  | 'MISSION_PAYMENT'
  | 'EVENT_TICKET'
  | 'PAYOUT'
  | 'REFUND'
  | 'FEE';

export type EntityType = 'BUSINESS' | 'CUSTOMER' | 'PLATFORM' | 'CREATOR';

export interface Transaction {
  id: string;
  countryId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  sourceEntityType: EntityType;
  sourceEntityId: string;
  destEntityType: EntityType;
  destEntityId: string;
  meta?: Record<string, any>;
  createdAt: Timestamp;
}

// ============ PAYOUT ============
export type PayoutStatus = 'PENDING' | 'HELD' | 'FAILED' | 'PAID';

export interface Payout {
  id: string;
  countryId: string;
  creatorId: string;
  amount: number;
  currency: string;
  status: PayoutStatus;
  failReason?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============ MODERATION ============
export type ModerationReportStatus = 'OPEN' | 'IN_REVIEW' | 'RESOLVED';
export type ModerationEntityType = 'BUSINESS' | 'CREATOR' | 'MISSION' | 'EVENT';

export interface ModerationReport {
  id: string;
  countryId: string;
  entityType: ModerationEntityType;
  entityId: string;
  reason: string;
  status: ModerationReportStatus;
  strikesAdded?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============ POLICY (Governance) ============
export interface Policy {
  id: string;
  version: number;
  thresholds: {
    eventApprovalLimit: number; // e.g., 20000
    payoutReleaseTrustMin: number; // e.g., 70
    highRiskScore: number; // e.g., 80
  };
  updatedAt: Timestamp;
  updatedByAdminId: string;
}

// ============ AUDIT LOG ============
export interface AuditLog {
  id: string;
  actorAdminId: string;
  actorRole: string;
  countryScopeUsed?: string;
  action: string;
  entityType: string;
  entityId: string;
  before?: Record<string, any>;
  after?: Record<string, any>;
  reason?: string;
  createdAt: Timestamp;
}

// ============ USER ============
export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  MEMBER = 'MEMBER', // Legacy role from User App, treat as customer
  CREATOR = 'CREATOR',
  BUSINESS = 'BUSINESS',
}

export interface User {
  id: string;
  email: string;
  phoneNumber?: string;
  displayName: string;
  profilePhoto?: string;
  role: UserRole;
  countryCode: string;
  
  // Account status
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
  emailVerified: boolean;
  phoneVerified: boolean;
  kycVerified: boolean;
  
  // Points & Activity
  totalPoints: number;
  lifetimePoints: number;
  currentStreak: number;
  longestStreak: number;
  
  // Stats
  stats: {
    missionsCompleted: number;
    eventsAttended: number;
    rewardsRedeemed: number;
    referralsCount: number;
  };
  
  // Creator-specific (if role is CREATOR)
  creatorProfile?: {
    verified: boolean;
    trustScore: number;
    instagramHandle?: string;
    instagramFollowers?: number;
    tiktokHandle?: string;
    youtubeHandle?: string;
    totalEarnings: number;
    pendingPayout: number;
  };
  
  // Moderation
  strikes: number;
  lastStrikeAt?: Date;
  suspensionReason?: string;
  suspendedAt?: Date;
  suspendedBy?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

// ============ NOTIFICATIONS ============
export type NotificationType = 
  | 'NEW_COUNTRY' 
  | 'STATUS_CHANGE' 
  | 'NEW_BUSINESS' 
  | 'VERIFICATION_REQUEST'
  | 'SYSTEM_ALERT';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  read: boolean;
  
  // Context data
  countryCode?: string;
  countryName?: string;
  firstUserId?: string;
  firstUserName?: string;
  needsReview?: boolean;
  
  // Metadata
  createdAt: Date;
  readAt?: Date;
  actionUrl?: string;
}

// ============ POLICY ENGINE ============
export interface PolicyContext {
  entity?: any;
  admin?: Admin;
  thresholds?: Policy['thresholds'];
  [key: string]: any;
}

export interface PolicyDecision {
  allowed: boolean;
  reason?: string;
}
