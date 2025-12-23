/**
 * Core Data Models for Fluzio
 * 
 * Centralized type definitions for all main entities.
 * Uses ISO string dates for consistency and Firestore compatibility.
 */

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

/**
 * User roles in the platform
 */
export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  CREATOR = 'CREATOR', // Customer with Creator Mode enabled
  BUSINESS = 'BUSINESS',
  ADMIN = 'ADMIN'
}

/**
 * Creator skills/specializations
 */
export enum Skill {
  MODEL = 'MODEL',
  PHOTOGRAPHER = 'PHOTOGRAPHER',
  VIDEOGRAPHER = 'VIDEOGRAPHER',
  GRAPHIC_DESIGNER = 'GRAPHIC_DESIGNER',
  MAKEUP_ARTIST = 'MAKEUP_ARTIST',
  HAIRSTYLIST = 'HAIRSTYLIST',
  STYLIST = 'STYLIST',
  CONTENT_CREATOR = 'CONTENT_CREATOR',
  VOICE_OVER = 'VOICE_OVER',
  EVENT_HOST = 'EVENT_HOST',
  DJ = 'DJ',
  DANCER = 'DANCER',
  MUSICIAN = 'MUSICIAN',
  WRITER = 'WRITER',
  INFLUENCER = 'INFLUENCER'
}

/**
 * Business categories
 */
export enum BusinessCategory {
  GASTRONOMY = 'GASTRONOMY',
  RETAIL = 'RETAIL',
  SERVICES = 'SERVICES',
  FITNESS = 'FITNESS',
  BEAUTY = 'BEAUTY',
  ENTERTAINMENT = 'ENTERTAINMENT',
  EDUCATION = 'EDUCATION',
  HEALTH = 'HEALTH',
  TECH = 'TECH',
  OTHER = 'OTHER'
}

/**
 * Mission types
 */
export enum MissionType {
  VISIT = 'VISIT', // Visit location
  PURCHASE = 'PURCHASE', // Make a purchase
  REVIEW = 'REVIEW', // Leave a review
  SOCIAL_POST = 'SOCIAL_POST', // Post on social media
  STORY = 'STORY', // Instagram/TikTok story
  REEL = 'REEL', // Short video
  PHOTO = 'PHOTO', // Photo content
  EVENT_ATTENDANCE = 'EVENT_ATTENDANCE', // Attend an event
  REFERRAL = 'REFERRAL', // Bring friends
  SURVEY = 'SURVEY', // Complete survey
  UGC = 'UGC' // User generated content
}

/**
 * Conversation types
 */
export enum ConversationType {
  CUSTOMER_BUSINESS = 'CUSTOMER_BUSINESS',
  CREATOR_BUSINESS = 'CREATOR_BUSINESS',
  CUSTOMER_CUSTOMER = 'CUSTOMER_CUSTOMER',
  SQUAD_GROUP = 'SQUAD_GROUP',
  SUPPORT = 'SUPPORT'
}

/**
 * Event types
 */
export enum EventType {
  PUBLIC = 'PUBLIC', // Open to all customers
  CREATOR_ONLY = 'CREATOR_ONLY', // Only for creators
  INVITE_ONLY = 'INVITE_ONLY', // Invitation required
  BUSINESS_HOSTED = 'BUSINESS_HOSTED', // Business event
  COMMUNITY = 'COMMUNITY' // Community organized
}

// ============================================================================
// SHARED INTERFACES
// ============================================================================

/**
 * Geographic location data
 */
interface GeoLocation {
  latitude: number;
  longitude: number;
  address?: string;
  city: string;
  district?: string;
  country?: string;
  zipCode?: string;
}

/**
 * Social media links
 */
interface SocialLinks {
  instagram?: {
    handle: string;
    connected: boolean;
    url?: string;
  };
  tiktok?: {
    handle: string;
    connected: boolean;
    url?: string;
  };
  facebook?: {
    handle: string;
    url?: string;
  };
  linkedin?: {
    handle: string;
    url?: string;
  };
  youtube?: {
    handle: string;
    url?: string;
  };
  website?: string;
}

/**
 * Portfolio item for creators
 */
interface PortfolioItem {
  id: string;
  type: 'IMAGE' | 'VIDEO' | 'LINK';
  url: string;
  thumbnailUrl?: string;
  title?: string;
  description?: string;
  createdAt: string; // ISO date
}

// ============================================================================
// USER PROFILE
// ============================================================================

/**
 * Customer/Creator Profile
 * 
 * Represents a customer in the platform. When creatorMode is enabled,
 * they become a creator with additional skills and portfolio.
 */
interface UserProfile {
  /** Firestore document ID */
  id: string;
  
  /** Firebase Auth UID */
  uid: string;
  
  /** Display name */
  name: string;
  
  /** Unique handle/username (e.g., @john_doe) */
  handle: string;
  
  /** Email address */
  email: string;
  
  /** User role */
  role: UserRole;
  
  /** City where user is based */
  city: string;
  
  /** District/neighborhood within city */
  district?: string;
  
  /** Current location if different from home city */
  currentLocation?: GeoLocation;
  
  /** Points/credits balance */
  points: number;
  
  /** User level (1-100) */
  level: number;
  
  /** Profile picture URL */
  avatarUrl?: string;
  
  /** Cover/banner image URL */
  coverUrl?: string;
  
  /** Bio/description */
  bio?: string;
  
  /** Phone number */
  phone?: string;
  
  /** Creator Mode - enables creator features */
  creatorMode: boolean;
  
  /** Subscription level/tier */
  subscriptionLevel?: string;
  
  /** Creator skills (only if creatorMode = true) */
  skills?: Skill[];
  
  /** Creator portfolio (only if creatorMode = true) */
  portfolio?: PortfolioItem[];
  
  /** Social reach (followers count across platforms) */
  socialReach?: number;
  
  /** Average engagement rate (percentage) */
  engagementRate?: number;
  
  /** Social media links */
  socialLinks?: SocialLinks;
  
  /** Preferred categories/interests */
  interests?: string[];
  
  /** Vibe tags (AI-generated or manual) */
  vibeTags?: string[];
  
  /** Total missions completed */
  missionsCompleted?: number;
  
  /** Total events attended */
  eventsAttended?: number;
  
  /** Email verified status */
  emailVerified?: boolean;
  
  /** Account creation date */
  createdAt: string; // ISO date
  
  /** Last updated date */
  updatedAt?: string; // ISO date
  
  /** Account status */
  status?: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
}

// ============================================================================
// BUSINESS PROFILE
// ============================================================================

/**
 * Business Profile
 * 
 * Represents a business entity on the platform.
 * Can create missions, rewards, and events.
 */
interface BusinessProfile {
  /** Firestore document ID */
  id: string;
  
  /** Firebase Auth UID */
  uid?: string;
  
  /** Business name */
  name: string;
  
  /** Unique handle (e.g., @starbucks_berlin) */
  handle?: string;
  
  /** Email address */
  email?: string;
  
  /** Main city */
  city: string;
  
  /** District/neighborhood */
  district?: string;
  
  /** Business category */
  category: BusinessCategory;
  
  /** Sub-category (more specific) */
  subCategory?: string;
  
  /** Vibe tags describing atmosphere */
  vibeTags?: string[];
  
  /** Physical location */
  location: GeoLocation;
  
  /** Logo URL */
  logoUrl?: string;
  
  /** Cover/banner image URL */
  coverUrl?: string;
  
  /** Gallery images */
  gallery?: string[];
  
  /** Business description */
  description?: string;
  
  /** Mission statement */
  mission?: string;
  
  /** Short tagline */
  tagline?: string;
  
  /** Phone number */
  phone?: string;
  
  /** Social media links */
  socialLinks?: SocialLinks;
  
  /** Operating hours */
  hours?: {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  };
  
  /** Languages spoken */
  languages?: string[];
  
  /** What business offers creators */
  offers?: string[];
  
  /** Year founded */
  yearFounded?: number;
  
  /** Team size */
  teamSize?: number;
  
  /** Average rating (0-5) */
  rating?: number;
  
  /** Number of reviews */
  reviewsCount?: number;
  
  /** Collaborations completed */
  collaborationsCompleted?: number;
  
  /** Verification status */
  verified?: boolean;
  
  /** Active subscription level */
  subscriptionLevel?: 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE';
  
  /** Account creation date */
  createdAt: string; // ISO date
  
  /** Last updated date */
  updatedAt?: string; // ISO date
  
  /** Account status */
  status?: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'DELETED';
}

// ============================================================================
// MISSION
// ============================================================================

/**
 * Mission
 * 
 * A task/challenge created by a business for customers/creators.
 * Completion earns points and potentially other rewards.
 */
interface Mission {
  /** Firestore document ID */
  id: string;
  
  /** Business who created the mission */
  businessId: string;
  
  /** Business name (denormalized for quick access) */
  businessName?: string;
  
  /** Business logo URL */
  businessLogo?: string;
  
  /** Mission title */
  title: string;
  
  /** Mission description */
  description: string;
  
  /** Mission type */
  type?: MissionType;
  
  /** Mission category */
  category?: string;
  
  /** Mission goal */
  goal?: 'GROWTH' | 'CONTENT' | 'TRAFFIC' | 'SALES';
  
  /** Points awarded on completion */
  points?: number;
  
  /** Reward object */
  reward?: {
    type: string;
    points: number;
    itemDescription?: string;
  };
  
  /** City where mission is available */
  city?: string;
  
  /** District/neighborhood */
  district?: string;
  
  /** Specific location if applicable */
  location?: GeoLocation | string;
  
  /** Geospatial location */
  geo?: {
    latitude: number;
    longitude: number;
  };
  
  /** Geofence radius in meters */
  radiusMeters?: number;
  
  /** Creator-only mission */
  isCreatorOnly?: boolean;
  
  /** Minimum level required */
  minLevel?: number;
  
  /** Required skills (for creator missions) */
  requiredSkills?: Skill[];
  
  /** Total slots available */
  totalSlots?: number;
  
  /** Current participants */
  currentParticipants?: number;
  
  /** Max participants */
  maxParticipants?: number;
  
  /** Slots remaining */
  slotsRemaining?: number;
  
  /** Mission image/thumbnail */
  image?: string;
  imageUrl?: string;
  
  /** Simple requirements array */
  requirements?: string[];
  
  /** Detailed requirements object */
  detailedRequirements?: {
    postType?: 'STORY' | 'POST' | 'REEL' | 'VIDEO' | 'ANY';
    hashtags?: string[];
    mentions?: string[];
    minFollowers?: number;
    caption?: string;
  };
  
  /** Mission category tags */
  tags?: string[];
  
  /** Proof type required */
  proofType?: string;
  
  /** Trigger type */
  triggerType?: 'GPS_PROXIMITY' | 'QR_SCAN' | 'MANUAL';
  
  /** QR code secret */
  qrCodeSecret?: string;
  
  /** Mission status */
  status?: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'EXPIRED';
  
  /** Lifecycle status (alternative field name used by business missions) */
  lifecycleStatus?: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'EXPIRED';
  
  /** Is mission currently active and accepting applications */
  isActive?: boolean;
  
  /** Valid until date */
  validUntil?: string;
  
  /** Creation date */
  createdAt: string; // ISO date
  
  /** Expiration date */
  expiresAt?: string; // ISO date
  
  /** Last updated date */
  updatedAt?: string; // ISO date
  
  /** Firestore ID */
  firestoreId?: string;
  
  /** Standard mission flag */
  isStandard?: boolean;
  
  /** Recurrence */
  recurrence?: 'ONCE' | 'WEEKLY' | 'MONTHLY';
  
  /** Budget */
  budget?: number;
  
  /** Approval required */
  approvalRequired?: boolean;
  
  /** Auto approve */
  autoApprove?: boolean;
  
  /** Target audience */
  targetAudience?: string[];
  
  /** Target level */
  targetLevel?: Array<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'PRO'>;
  
  /** Target categories */
  targetCategories?: string[];
}

// ============================================================================
// REWARD
// ============================================================================

/**
 * Reward
 * 
 * Redeemable items/offers that customers can claim using points.
 */
interface Reward {
  /** Firestore document ID */
  id: string;
  
  /** Business offering the reward */
  businessId: string;
  
  /** Business name (denormalized) */
  businessName?: string;
  
  /** Reward title */
  title: string;
  
  /** Reward description */
  description: string;
  
  /** Point cost to redeem */
  costPoints: number;
  
  /** City where reward is available */
  city: string;
  
  /** District/neighborhood */
  district?: string;
  
  /** Reward image */
  imageUrl?: string;
  
  /** Reward type */
  type: 'DISCOUNT' | 'FREE_ITEM' | 'VOUCHER' | 'EXPERIENCE' | 'CASHBACK';
  
  /** Discount percentage (if applicable) */
  discountPercent?: number;
  
  /** Total available */
  totalAvailable?: number;
  
  /** Remaining quantity */
  remaining?: number;
  
  /** Terms & conditions */
  terms?: string;
  
  /** Reward status */
  status: 'ACTIVE' | 'PAUSED' | 'EXPIRED' | 'OUT_OF_STOCK';
  
  /** Creation date */
  createdAt: string; // ISO date
  
  /** Expiration date */
  expiresAt?: string; // ISO date
  
  /** Last updated date */
  updatedAt?: string; // ISO date
}

// ============================================================================
// EVENT
// ============================================================================

/**
 * Event
 * 
 * Community events, business events, or creator meetups.
 */
interface Event {
  /** Firestore document ID */
  id: string;
  
  /** Business hosting the event (optional for community events) */
  businessId?: string;
  
  /** Business name (denormalized) */
  businessName?: string;
  
  /** Event title */
  title: string;
  
  /** Event description */
  description: string;
  
  /** City where event takes place */
  city: string;
  
  /** District/neighborhood */
  district?: string;
  
  /** Event date/time */
  date: string; // ISO date
  
  /** Event end date/time */
  endDate?: string; // ISO date
  
  /** Event location */
  location: GeoLocation;
  
  /** Location name (e.g., "Central Park") */
  locationName?: string;
  
  /** Event type */
  type: EventType;
  
  /** Creator-only event */
  isCreatorEvent: boolean;
  
  /** Event cover image */
  imageUrl?: string;
  
  /** Gallery images */
  gallery?: string[];
  
  /** Maximum attendees */
  maxAttendees?: number;
  
  /** Current attendee count */
  attendeeCount?: number;
  
  /** Attendee user IDs */
  attendees?: string[];
  
  /** Entry fee in points (0 = free) */
  entryFeePoints?: number;
  
  /** Tags/categories */
  tags?: string[];
  
  /** Event status */
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  
  /** Creation date */
  createdAt: string; // ISO date
  
  /** Last updated date */
  updatedAt?: string; // ISO date
}

// ============================================================================
// CONVERSATION
// ============================================================================

/**
 * Conversation Message
 */
interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
  text: string;
  type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE' | 'SYSTEM';
  imageUrl?: string;
  fileUrl?: string;
  timestamp: string; // ISO date
  isRead: boolean;
  readBy?: string[]; // User IDs who read the message
}

/**
 * Conversation
 * 
 * Chat/messaging between users and businesses.
 */
interface Conversation {
  /** Firestore document ID */
  id: string;
  
  /** Participant user IDs */
  participantIds: string[];
  
  /** Participant roles (for quick filtering) */
  participantRoles: {
    [userId: string]: UserRole;
  };
  
  /** Participant names (denormalized) */
  participantNames?: {
    [userId: string]: string;
  };
  
  /** Participant avatars (denormalized) */
  participantAvatars?: {
    [userId: string]: string;
  };
  
  /** Conversation type */
  type: ConversationType;
  
  /** Group name (for group chats) */
  groupName?: string;
  
  /** Last message preview */
  lastMessage?: string;
  
  /** Last message timestamp */
  lastMessageAt?: string; // ISO date
  
  /** Last message sender ID */
  lastMessageSenderId?: string;
  
  /** Unread counts per user */
  unreadCounts: {
    [userId: string]: number;
  };
  
  /** Related mission ID (if conversation is about a mission) */
  missionId?: string;
  
  /** Related event ID (if conversation is about an event) */
  eventId?: string;
  
  /** Conversation status */
  status?: 'ACTIVE' | 'ARCHIVED' | 'BLOCKED';
  
  /** Creation date */
  createdAt: string; // ISO date
  
  /** Last updated date */
  updatedAt?: string; // ISO date
}

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  GeoLocation,
  SocialLinks,
  PortfolioItem,
  UserProfile,
  BusinessProfile,
  Mission,
  Reward,
  Event,
  Message,
  Conversation
};
