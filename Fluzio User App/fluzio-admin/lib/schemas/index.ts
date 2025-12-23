// Zod validation schemas for all Firestore collections
import { z } from 'zod';

// ============ ADMIN ============
export const AdminRoleSchema = z.enum([
  'SUPER_ADMIN',
  'COUNTRY_ADMIN',
  'FINANCE',
  'MODERATOR',
  'OPS_SUPPORT',
  'ANALYST_READONLY',
]);

export const AdminSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  role: AdminRoleSchema,
  countryScopes: z.array(z.string()).min(1),
  status: z.enum(['ACTIVE', 'SUSPENDED']),
  createdAt: z.any(),
  updatedAt: z.any(),
});

export const CreateAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: AdminRoleSchema,
  countryScopes: z.array(z.string()).min(1),
});

// ============ COUNTRY ============
export const CountryStatusSchema = z.enum([
  'PLANNED',
  'PRE_LAUNCH',
  'SOFT_LAUNCH',
  'OFFICIAL',
  'ACTIVE',
  'SCALE',
  'PAUSED',
]);

export const ChecklistItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  ownerAdminId: z.string().optional(),
  completed: z.boolean(),
  completedAt: z.any().optional(),
});

export const CountrySchema = z.object({
  countryId: z.string().length(2),
  name: z.string(),
  status: CountryStatusSchema,
  currency: z.string(),
  language: z.string(),
  timeZone: z.string(),
  featureFlags: z.object({
    publicSignupEnabled: z.boolean(),
    missionsEnabled: z.boolean(),
    eventsEnabled: z.boolean(),
    payoutAutomationEnabled: z.boolean(),
    marketingToolsEnabled: z.boolean(),
  }),
  fees: z.object({
    subscription: z.number().optional(),
    commissionPct: z.number().optional(),
    eventTicketFeePct: z.number().optional(),
  }),
  payoutRules: z.object({
    minPayoutAmount: z.number(),
    newCreatorHoldDays: z.number(),
  }),
  moderationThresholds: z.object({
    strikeLimit: z.number(),
    autoSuspendDisputeRate: z.number(),
  }),
  allowedMissionTypes: z.array(z.string()),
  allowedEventTypes: z.array(z.string()),
  launch: z.object({
    readinessScore: z.number().min(0).max(100),
    launchDate: z.any().optional(),
    checklistByPhase: z.record(z.string(), z.object({
      items: z.array(ChecklistItemSchema),
    })),
  }),
  admins: z.array(z.string()),
  createdAt: z.any(),
  updatedAt: z.any(),
});

export const CreateCountrySchema = CountrySchema.omit({ createdAt: true, updatedAt: true });

// ============ BUSINESS ============
export const BusinessTierSchema = z.enum(['FREE', 'SILVER', 'GOLD', 'PLATINUM']);

export const BusinessSchema = z.object({
  id: z.string(),
  countryId: z.string(),
  name: z.string(),
  industry: z.string(),
  tier: BusinessTierSchema,
  verified: z.boolean(),
  status: z.enum(['ACTIVE', 'SUSPENDED']),
  riskScore: z.number().min(0).max(100),
  disputeCount: z.number(),
  createdAt: z.any(),
  updatedAt: z.any(),
});

export const CreateBusinessSchema = BusinessSchema.omit({ id: true, createdAt: true, updatedAt: true });

// ============ CREATOR ============
export const CreatorSchema = z.object({
  id: z.string(),
  countryId: z.string(),
  displayName: z.string(),
  verified: z.boolean(),
  status: z.enum(['ACTIVE', 'SUSPENDED']),
  trustScore: z.number().min(0).max(100),
  riskScore: z.number().min(0).max(100),
  disputeCount: z.number(),
  payoutFrozen: z.boolean(),
  createdAt: z.any(),
  updatedAt: z.any(),
});

export const CreateCreatorSchema = CreatorSchema.omit({ id: true, createdAt: true, updatedAt: true });

// ============ MISSION ============
export const MissionStatusSchema = z.enum(['DRAFT', 'LIVE', 'COMPLETED', 'DISPUTED', 'CANCELLED']);

export const MissionSchema = z.object({
  id: z.string(),
  countryId: z.string(),
  businessId: z.string(),
  creatorIds: z.array(z.string()),
  status: MissionStatusSchema,
  missionType: z.string(),
  budget: z.number(),
  dispute: z.object({
    isDisputed: z.boolean(),
    reason: z.string().optional(),
    resolution: z.object({
      refundPercent: z.number().optional(),
      payoutAction: z.enum(['HOLD', 'RELEASE', 'PARTIAL']).optional(),
      adminReason: z.string().optional(),
      resolvedAt: z.any().optional(),
    }).optional(),
  }),
  createdAt: z.any(),
  updatedAt: z.any(),
});

export const CreateMissionSchema = MissionSchema.omit({ id: true, createdAt: true, updatedAt: true });

// ============ EVENT ============
export const EventTypeSchema = z.enum(['FUN_MEETUP', 'BUSINESS_EVENT', 'HYBRID']);
export const EventStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'COMPLETED', 'CANCELLED']);

export const EventSchema = z.object({
  id: z.string(),
  countryId: z.string(),
  type: EventTypeSchema,
  title: z.string(),
  organizerBusinessId: z.string().optional(),
  capacity: z.number(),
  budget: z.number().optional(),
  ticketing: z.object({
    mode: z.enum(['FREE', 'PAID']),
    price: z.number().optional(),
    tierGate: z.array(z.string()).optional(),
  }),
  attendanceCount: z.number(),
  status: EventStatusSchema,
  createdAt: z.any(),
  updatedAt: z.any(),
});

export const CreateEventSchema = EventSchema.omit({ id: true, createdAt: true, updatedAt: true });

// ============ TRANSACTION ============
export const TransactionTypeSchema = z.enum([
  'SUBSCRIPTION',
  'MISSION_PAYMENT',
  'EVENT_TICKET',
  'PAYOUT',
  'REFUND',
  'FEE',
]);

export const TransactionSchema = z.object({
  id: z.string(),
  countryId: z.string(),
  type: TransactionTypeSchema,
  amount: z.number(),
  currency: z.string(),
  sourceEntityType: z.enum(['BUSINESS', 'CUSTOMER', 'PLATFORM', 'CREATOR']),
  sourceEntityId: z.string(),
  destEntityType: z.enum(['BUSINESS', 'CUSTOMER', 'PLATFORM', 'CREATOR']),
  destEntityId: z.string(),
  meta: z.record(z.string(), z.any()).optional(),
  createdAt: z.any(),
});

export const CreateTransactionSchema = TransactionSchema.omit({ id: true, createdAt: true });

// ============ PAYOUT ============
export const PayoutStatusSchema = z.enum(['PENDING', 'HELD', 'FAILED', 'PAID']);

export const PayoutSchema = z.object({
  id: z.string(),
  countryId: z.string(),
  creatorId: z.string(),
  amount: z.number(),
  currency: z.string(),
  status: PayoutStatusSchema,
  failReason: z.string().optional(),
  createdAt: z.any(),
  updatedAt: z.any(),
});

export const CreatePayoutSchema = PayoutSchema.omit({ id: true, createdAt: true, updatedAt: true });

// ============ MODERATION ============
export const ModerationReportStatusSchema = z.enum(['OPEN', 'IN_REVIEW', 'RESOLVED']);

export const ModerationReportSchema = z.object({
  id: z.string(),
  countryId: z.string(),
  entityType: z.enum(['BUSINESS', 'CREATOR', 'MISSION', 'EVENT']),
  entityId: z.string(),
  reason: z.string(),
  status: ModerationReportStatusSchema,
  strikesAdded: z.number().optional(),
  createdAt: z.any(),
  updatedAt: z.any(),
});

export const CreateModerationReportSchema = ModerationReportSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ============ POLICY ============
export const PolicySchema = z.object({
  id: z.string(),
  version: z.number(),
  thresholds: z.object({
    eventApprovalLimit: z.number(),
    payoutReleaseTrustMin: z.number(),
    highRiskScore: z.number(),
  }),
  updatedAt: z.any(),
  updatedByAdminId: z.string(),
});

export const UpdatePolicySchema = PolicySchema.omit({ id: true, updatedAt: true });

// ============ AUDIT LOG ============
export const AuditLogSchema = z.object({
  id: z.string(),
  actorAdminId: z.string(),
  actorRole: z.string(),
  countryScopeUsed: z.string().optional(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string(),
  before: z.record(z.string(), z.any()).optional(),
  after: z.record(z.string(), z.any()).optional(),
  reason: z.string().optional(),
  createdAt: z.any(),
});
