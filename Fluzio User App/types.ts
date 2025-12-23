
export enum UserRole {
  ADMIN = 'ADMIN',
  BUSINESS = 'BUSINESS',
  MEMBER = 'MEMBER',
  CREATOR = 'CREATOR'
}

export enum AccountType {
  BUSINESS = 'business',
  CREATOR = 'creator'
}

export enum SubscriptionLevel {
  FREE = 'FREE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM'
}

// Multi-location limits by subscription level
// Geographic Targeting Limits by Subscription Tier
export const COUNTRY_LIMITS: Record<SubscriptionLevel, number> = {
  FREE: 0,      // City-only (no country targeting)
  SILVER: 1,    // Single country (home country)
  GOLD: 10,     // Up to 10 countries
  PLATINUM: 999 // Global reach (unlimited countries)
};

export enum MissionStatus {
  OPEN = 'OPEN',
  PENDING_APPROVAL = 'APPROVED', // keeping mapping for backward compat if needed
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum MissionCategory {
  COFFEE = 'Coffee',
  FOOD = 'Food',
  FASHION = 'Fashion',
  TECH = 'Tech',
  LIFESTYLE = 'Lifestyle',
  TRAVEL = 'Travel',
  PETS = 'Pets',
  BEAUTY = 'Beauty',
  OTHER = 'Other'
}

// Event Location Categories for AI Suggestions
export enum EventLocationCategory {
  // Continents
  EUROPE = 'Europe',
  ASIA = 'Asia',
  AFRICA = 'Africa',
  NORTH_AMERICA = 'North America',
  SOUTH_AMERICA = 'South America',
  OCEANIA = 'Oceania',
  
  // Geographic Features
  BEACHES = 'Beaches',
  MOUNTAINS = 'Mountains',
  LAKES = 'Lakes',
  FORESTS = 'Forests',
  DESERTS = 'Deserts',
  ISLANDS = 'Islands',
  
  // Climate/Activity Zones
  TROPICAL = 'Tropical Destinations',
  WINTER_SPORTS = 'Winter Sports',
  SUMMER_RESORTS = 'Summer Resorts',
  COASTAL = 'Coastal Areas',
  
  // Specific Countries (Popular)
  GERMANY = 'Germany',
  FRANCE = 'France',
  ITALY = 'Italy',
  SPAIN = 'Spain',
  GREECE = 'Greece',
  PORTUGAL = 'Portugal',
  SWITZERLAND = 'Switzerland',
  AUSTRIA = 'Austria',
  NETHERLANDS = 'Netherlands',
  BELGIUM = 'Belgium',
  
  // Cities
  MAJOR_CITIES = 'Major Cities',
  SMALL_TOWNS = 'Small Towns',
  HISTORIC_CITIES = 'Historic Cities',
  MODERN_CITIES = 'Modern Cities'
}

export enum BusinessCategory {
  GASTRONOMY = 'GASTRONOMY',
  RETAIL = 'RETAIL',
  SERVICES = 'SERVICES',
  FITNESS = 'FITNESS',
  OTHER = 'OTHER'
}

export enum ProofType {
  PHOTO = 'PHOTO',
  LINK = 'LINK',
  TEXT = 'TEXT',
  SCREENSHOT = 'SCREENSHOT'
}

export enum RewardType {
  POINTS_ONLY = 'POINTS_ONLY',
  POINTS_AND_ITEM = 'POINTS_AND_ITEM',
  POINTS_AND_DISCOUNT = 'POINTS_AND_DISCOUNT'
}

export type BusinessGoal = 'PHOTOSHOOT' | 'GIVEAWAY' | 'POP_UP' | 'CO_MARKETING';

export interface ActiveGoal {
  type: BusinessGoal;
  budget: number;
  deadline: string; // ISO Date string
}

export interface StrategicMatch {
  candidateId: string;
  matchScore: number; // 0-100
  collaborationPitch: string;
}

export interface SocialConnection {
  connected: boolean;
  username?: string;
  lastSync?: string; // ISO Date
  expired?: boolean; // OAuth token expired
  accessToken?: string; // For backend use
  refreshToken?: string; // For backend use
}

export interface SocialAccount {
  handle?: string;
  url?: string;
  providerUserId?: string;
  connected: boolean;
  lastSyncedAt?: string; // ISO Date or Firestore Timestamp
  displayName?: string; // User's display name on platform
  photoURL?: string; // Profile picture URL
}

export interface SocialLinks {
  instagram?: SocialConnection;
  tiktok?: SocialConnection;
  website?: string; // Simple URL string
  youtube?: string; // Legacy string support
  linkedin?: string;
  facebook?: string;
  google?: SocialConnection;
  googleMaps?: string;
}

export interface OpeningHours {
  mon?: string;
  tue?: string;
  wed?: string;
  thu?: string;
  fri?: string;
  sat?: string;
  sun?: string;
}

export interface Address {
  street: string;
  city: string;
  zipCode: string;
  country: string;
  googleMapLink?: string;
}

export interface BusinessLocation {
  id: string;
  name: string; // Location name (e.g., "Downtown Store", "Mall Branch")
  address: string;
  city: string;
  country: string;
  geo?: {
    latitude: number;
    longitude: number;
  };
  phone?: string;
  isActive: boolean;
  isPrimary: boolean;
  createdAt: string;
}

export interface UserPreferences {
    notifications_squad?: boolean;
    notifications_missions?: boolean;
    notifications_push?: boolean;
    notifications_email?: boolean;
    notifications_messages?: boolean;
    profile_visibility?: 'public' | 'private' | 'friends';
    show_activity?: boolean;
    show_location?: boolean;
    language?: string;
    theme?: 'light' | 'dark' | 'auto';
}


// --- Geospatial Types ---
export interface GeoPoint {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  district?: string; // e.g. 'Mitte', 'Kreuzberg'
}

// --- Wallet Types ---
export interface CreatorWallet {
  pointsBalance: number;
  cashBalance: number;
  lifetimeEarnings: number;
  networkStats: {
    recruitedCount: number;
    networkRevenue: number; // Total spend generated by network
  };
  level: {
    current: string;
    next: string;
    progress: number; // 0-100
    xpNeeded: number;
  };
}

export interface DailyStreakResult {
  success: boolean;
  message: string;
  streak: number;
  pointsAwarded: number;
  breakdown?: {
    basePoints: number;
    streakBonus: number;
    milestoneBonus: number;
  };
  newBalance: number;
  milestoneReached?: boolean;
  alreadyClaimed?: boolean;
}

export interface User {
  id: string;
  firebaseUid?: string; // Firebase Auth UID for real users
  name: string;
  email: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  preferFemaleOnly?: boolean; // For female users - prefer female-only meetups/squads
  role: UserRole;
  avatarUrl: string;
  coverUrl?: string;
  bio: string;
  location: string; // Legacy display string
  geo?: GeoPoint;   // New Geospatial Data
  points: number;
  level: number;
  subscriptionLevel: SubscriptionLevel;
  badges: string[];
  socialLinks: SocialLinks;
  vibeTags?: string[]; // AI-suggested or manual vibe tags
  
  // Social Follow System
  following?: string[]; // Array of user IDs this user follows
  followers?: string[]; // Array of user IDs following this user
  followingCount?: number; // Cached count for performance
  followersCount?: number; // Cached count for performance
  
  // Daily Login Streak
  lastLoginAt?: string; // ISO Date string
  loginStreak?: number; // Current consecutive days
  longestLoginStreak?: number; // All-time record
  lastStreakRewardClaimed?: string; // ISO Date string
  totalStreakPointsEarned?: number; // Lifetime streak points
  
  // Onboarding
  hasCompletedOnboarding?: boolean; // Track first-time user onboarding completion
  
  // Creator Preferences for Mission Matching
  creatorLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'PRO'; // Experience level
  preferredMissionTypes?: Array<'STORY' | 'POST' | 'REEL' | 'VIDEO'>; // Content they prefer creating
  
  // Social Media Accounts (OAuth-based connections)
  socialAccounts?: {
    instagram?: SocialAccount;
    tiktok?: SocialAccount;
    twitter?: SocialAccount;
    facebook?: SocialAccount;
    linkedin?: SocialAccount;
    google?: SocialAccount;
  };
  
  // Auth Providers
  googleId?: string;
  appleId?: string;
  shopifyStoreUrl?: string;

  // Business Specific (City Logic)
  businessType?: string; 
  businessMode?: 'PHYSICAL' | 'ONLINE' | 'HYBRID'; // NEW: Physical location, online-only, or hybrid
  checkInVerificationMethod?: 'QR_ONLY' | 'GPS' | 'BOTH'; // NEW: How customers verify check-ins
  category?: BusinessCategory;
  subCategory?: string; // NEW: More specific
  vibe?: string[];       
  address?: Address;
  openingHours?: OpeningHours;
  phone?: string;
  countryCode?: string;
  country?: string; // Business country
  targetCountries?: string[]; // Countries business targets (subscription-based)
  gallery?: string[]; 
  isVerified?: boolean; // Legacy boolean
  verificationStatus?: VerificationStatus; // New Status
  collaborationPreferences?: string;
  activeGoal?: ActiveGoal;
  preferences?: UserPreferences;
  
  // Ratings & Reviews
  reviewCount?: number; // Total number of reviews
  averageRating?: number; // Average rating from Google or manual
  
  // Google Business Profile Integration
  googleBusinessName?: string;
  googleMapsLink?: string;
  googlePlaceId?: string;
  googleAttributes?: Array<{
    key: string;
    displayName: string;
    group: string;
    value: any;
  }>;
  googlePhotos?: Array<{
    url: string;
    category: string;
    description?: string;
  }>;
  specialHours?: Array<{
    startDate?: { year: number; month: number; day: number };
    endDate?: { year: number; month: number; day: number };
    closed?: boolean;
    openTime?: string;
    closeTime?: string;
  }>;
  businessDescription?: string; // From Google Business Profile
  lastGoogleSync?: string; // ISO timestamp of last sync
  
  // KYC / Legal
  legalName?: string;
  vatId?: string;
  registrationNumber?: string;
  
  // Business Approval System
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED'; // For business signups
  approvalNotes?: string; // Admin notes for approval/rejection
  approvedAt?: string; // ISO timestamp when approved
  approvedBy?: string; // Admin UID who approved

  // New Business Fields for City-Logic
  homeCity?: string;
  subscriptionScope?: 'CITY' | 'GLOBAL';
  isAspiringBusiness?: boolean; // New for Aspiring Entrepreneurs

  // Business Profile Extended Fields
  mission?: string; // Mission statement
  tagline?: string; // Short 1-line tagline for the business
  aboutText?: string; // AI-generated or manual about text
  aboutAiSource?: 'AI' | 'MANUAL' | null; // How the about text was created
  aboutAiLastUpdated?: string; // ISO timestamp of last AI generation
  aboutAiMeta?: {
    tokensUsed?: number;
    model?: string;
    language?: string;
    sourceUrl?: string;
  };
  languages?: string[]; // Languages spoken
  offers?: string[]; // What business offers creators
  yearFounded?: number;
  teamSize?: number;
  rating?: number; // Average rating
  reviewsCount?: number;
  
  // Social media integrations status
  integrations?: {
    instagram?: {
      connected?: boolean;
      username?: string;
      lastVerified?: string;
    };
    googleBusiness?: {
      connected?: boolean;
      placeId?: string;
      lastSynced?: string;
    };
  };
  collabsCompleted?: number;
  creatorFavorites?: number;
  responseTime?: string; // e.g., "Within 2 hours"
  handle?: string; // Business username/handle

  // Multi-Location Support for Businesses
  locations?: BusinessLocation[]; // Array of business locations

  // Member Specific (City Logic)
  interests?: string[];
  currentCity?: string;
  isGlobalRoamer?: boolean;
  city?: string; // User's home city
  
  // Location Override for Platinum Users
  temporaryLocation?: {
    city: string;
    country?: string;
    setAt: string; // ISO date
    expiresAt: string; // ISO date (30 days from setAt)
  };
  
  // Account Type (business or creator) - IMMUTABLE after signup
  accountType?: AccountType;
  
  // Creator-specific fields
  skills?: string[];
  
  // Creator Profile (comprehensive)
  creator?: {
    /** Creator roles/specializations */
    roles: string[]; // e.g., ["model", "photographer", "videographer", "content_creator", "smm"]
    
    /** Creator's base city for opportunities */
    city: string;
    
    /** Search radius in kilometers (default 25) */
    radiusKm: number;
    
    /** Availability status */
    availability: 'open' | 'busy';
    
    /** Portfolio (optional for v1) */
    portfolio?: {
      images: string[]; // URLs
      links: string[]; // External portfolio links
    };
    
    /** Verified creator status */
    verified: boolean;
  };
  
  // Activity Tracking
  eventsAttended?: number;
  checkInsCount?: number;
  savedPlaces?: string[]; // Array of business IDs
  missionsCompleted?: number;
  rewardsClaimed?: number;
  
  // Timestamps
  createdAt?: string; // ISO date
  
  // Contact
  contactEmail?: string;
  website?: string;
  
  // Media
  photoUrl?: string;
  
  // New Creator Wallet
  creatorWallet?: CreatorWallet;
}

// --- Person Tracking Types (Creators & Regulars Dashboard) ---
export interface PersonInsight {
  userId: string;
  name: string;
  handle?: string;
  avatarUrl: string;
  visitsCount: number; // For physical businesses
  missionsCompleted: number;
  checkInsCount: number; // QR/NFC/GPS check-ins at location
  lastVisitAt?: string; // ISO timestamp
  lastActivityAt?: string; // ISO timestamp
  referralsCount: number; // People they brought
  favoriteMissionType?: string; // e.g., "Story Post", "Reel"
}

export interface CreatorInsight extends PersonInsight {
  totalReach: number; // Total followers/reach across platforms
  avgEngagement: number; // Average engagement rate
  postsCreated: number; // Total content pieces
  conversionsGenerated?: number; // For online businesses
}

export interface RegularInsight extends PersonInsight {
  customerNotes?: string; // Business notes about this regular
  preferredProducts?: string[]; // What they usually get
  totalSpend?: number; // For tracking value (optional)
  ordersInfluenced?: number; // For online businesses
}

export interface Reward {
  type: RewardType;
  points: number;
  itemDescription?: string;
}

// Mission Requirements
export interface MissionRequirements {
  postType: 'STORY' | 'POST' | 'REEL' | 'VIDEO' | 'ANY';
  hashtags?: string[]; // Required hashtags
  mentions?: string[]; // Required @mentions
  minFollowers?: number; // Minimum follower count
  location?: string; // Required location tag
  caption?: string; // Required caption text/keywords
  minEngagement?: number; // Minimum engagement rate percentage
}

// Mission Status
export type MissionLifecycleStatus = 
  | 'DRAFT' // Being created
  | 'ACTIVE' // Live and accepting applications
  | 'PAUSED' // Temporarily disabled
  | 'COMPLETED' // All slots filled
  | 'EXPIRED' // Past deadline
  | 'CANCELLED'; // Cancelled by business

export interface Mission {
  id: string;
  businessId: string;
  businessName?: string;
  businessLogo?: string;
  title: string;
  description: string;
  category: MissionCategory;
  requirements: string[];
  location?: string; // Legacy display string
  locationId?: string; // Business location ID for multi-location support
  geo?: GeoPoint;    // New Geospatial Data
  radiusMeters?: number; // Geofence radius (e.g., 500m)
  city?: string; // City for admin filtering
  country?: string; // Country for admin filtering
  goal?: 'GROWTH' | 'CONTENT' | 'TRAFFIC' | 'SALES';
  maxParticipants?: number;
  currentParticipants: number;
  reward: Reward;
  image?: string;
  proofType: ProofType;
  createdAt: string;
  validUntil: string;
  
  // Trigger Logic
  triggerType: 'GPS_PROXIMITY' | 'QR_SCAN' | 'MANUAL';
  qrCodeSecret?: string;
  
  // Check-In Verification (for VISIT_CHECKIN missions)
  checkInMethod?: 'QR_ONLY' | 'GPS' | 'BOTH'; // How customers verify check-ins for this specific mission

  // New fields for Standard Missions
  isStandard?: boolean;
  isActive?: boolean;
  recurrence?: 'ONCE' | 'WEEKLY' | 'MONTHLY';
  
  // Firestore mission ID for syncing
  firestoreId?: string;
  
  // Enhanced mission creation fields
  detailedRequirements?: MissionRequirements;
  lifecycleStatus?: MissionLifecycleStatus;
  budget?: number; // Total budget for this mission
  approvalRequired?: boolean; // Does submission need business approval
  requiresApproval?: boolean; // Does submission need business approval (alias)
  autoApprove?: boolean; // Auto-approve submissions
  targetAudience?: string[]; // Target demographics or interests
  targetLevel?: Array<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'PRO'>; // Target creator levels
  targetCategories?: MissionCategory[]; // Which interests should see this
  
  // Priority system for mission visibility and sorting
  priority?: 'HIGH' | 'MEDIUM' | 'LOW'; // Mission priority level
  priorityScore?: number; // Calculated priority score (0-100)
  
  // Creator-only missions filter
  isCreatorOnly?: boolean; // If true, only visible to users with creatorMode enabled
  
  // Remote work option
  isRemote?: boolean; // If true, work can be done remotely
  
  // Creator roles/skills needed
  requiredRoles?: string[]; // e.g., ['photographer', 'videographer', 'model']
  
  // Deadline for applications
  deadline?: string; // ISO date string
  
  // Mission template reference
  missionTemplateId?: string; // Reference to mission template used for creation
}

// --- Smart Mission Creator Types ---
export interface MissionTheme {
  id: string;
  category: 'GASTRONOMY' | 'NIGHTLIFE' | 'ECOMMERCE' | 'RETAIL' | 'WELLNESS' | 'ALL';
  code: string; // e.g. 'THE_FOODIE_CLOSEUP'
  title: string; // Display name
  defaultDescription: string; // The script
  requirements: string[];
  goal: 'GROWTH' | 'CONTENT' | 'TRAFFIC' | 'SALES';
  suggestedPoints: number;
  icon: string; // Lucide-react icon name
  isPremium: boolean; // True for video/complex tasks
}

export interface Participation {
  id: string;
  missionId: string;
  userId: string;
  status: MissionStatus;
  proofUrl?: string;
  proofText?: string;
  submittedAt?: string;
  
  // AI Validation Data
  aiValidation?: {
      detectedTags: string[];
      confidenceScore: number; // 0-100
      isMatch: boolean;
  };
}

// Messaging Types
export interface ActivityProposal {
  id: string;
  title: string;
  location: string;
  description: string;
  duration: string;
  estimatedCost: string;
  bestTimeOfDay: string;
  meetupType: 'fun' | 'work';
  proposedBy: string; // userId
  proposedAt: string;
  votes: { [userId: string]: boolean }; // userId -> voted yes/no
  status: 'PROPOSED' | 'ACCEPTED' | 'REJECTED';
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string; 
  type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE' | 'AUDIO' | 'SYSTEM' | 'ACTIVITY_PROPOSAL'; 
  timestamp: string;
  isRead: boolean;
  activityProposal?: ActivityProposal; // Only for ACTIVITY_PROPOSAL type
  attachment?: {
    url: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    thumbnailUrl?: string;
  };
}

export type ChatType = 'SQUAD_GROUP' | 'B2B_DM' | 'AMBASSADOR_DM';

export interface Conversation {
  id: string;
  type: ChatType;
  name?: string; // Display name for the chat (e.g. Squad Name)
  participants: User[];
  lastMessage: Message;
  unreadCount: number;
  contextTag?: string; // E.g. "Project: Winter Shoot"
  relatedMissionId?: string;
}

// Notification Types
export type NotificationType = 'VERIFY_MISSION' | 'B2B_MATCH' | 'SQUAD_ALERT' | 'SYSTEM' | 'NEW_MESSAGE' | 'MEETUP_REQUEST' | 'MISSION_POSTED' | 'MISSION_APPROVED' | 'MISSION_REJECTED' | 'MISSION_APPLICATION' | 'REWARD_REDEEMED' | 'POINTS_ACTIVITY' | 'STREAK_CLAIMED' | 'PROJECT_APPLICATION' | 'PROJECT_ACCEPTED' | 'PROJECT_REJECTED' | 'NEW_OPPORTUNITY';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  timestamp: string; // ISO Date
  actionLink: string; // Internal route
}

// Wallet Types
export enum TransactionType {
  CREDIT = 'CREDIT', // Incoming
  DEBIT = 'DEBIT'    // Outgoing
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: TransactionType;
  description: string;
  date: string; // ISO Date
  category?: string;
  currency?: 'POINTS' | 'EUR';
}

// Dashboard Stats
export interface BusinessStats {
  activeMissions: number;
  totalApplications: number;
  completedMissions: number;
  pendingReviews: number;
  // Impact Facts
  storeCheckIns: number;
  localRank?: number; // e.g., 1 (1st place)
  districtName?: string; // e.g., 'Mitte'
  socialReach: number;
  activeAmbassadors: number;
  followerGrowth: number;
}

// Navigation Types
export enum MainTab {
  DASHBOARD = 'DASHBOARD',
  CUSTOMERS = 'CUSTOMERS',
  MISSIONS = 'MISSIONS',
  REWARDS = 'REWARDS',
  PEOPLE = 'PEOPLE',
  B2B = 'B2B',
  SETTINGS = 'SETTINGS',
  LEADERBOARD = 'LEADERBOARD',
  ACHIEVEMENTS = 'ACHIEVEMENTS'
}

export enum ViewState {
  LOGIN = 'LOGIN',
  SIGNUP = 'SIGNUP',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APP = 'APP'
}

export interface OnboardingState {
  step: number;
  role: 'BUSINESS' | 'CREATOR' | 'MEMBER' | null;
  accountType?: 'business' | 'creator'; // Immutable after signup
  authMethod?: 'EMAIL' | 'GOOGLE' | 'APPLE';
  isAspiringBusiness?: boolean;
  locationPermissionGranted?: boolean;
  email?: string;
  password?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  preferFemaleOnly?: boolean; // Only for female users
  handle?: string; // Business Name or Creator Username
  city?: string;
  category?: string;
  subCategory?: string;
  businessMode?: 'PHYSICAL' | 'ONLINE' | 'HYBRID';
  website?: string;
  instagram?: string;
  referralCode?: string;
  vibes: string[];
  
  // Business Verification Fields
  legalName?: string;
  vatId?: string;
  registrationNumber?: string;
  street?: string;
  zipCode?: string;
  phone?: string;
  linkedin?: string;
  documents?: string[]; // Names of uploaded files
  isAuthorized?: boolean;
  verifiedSources?: {
      google?: boolean;
      shopify?: boolean;
  };
  
  // Business Maturity Assessment (for intelligent level assignment)
  businessStage?: 'validating' | 'early_customers' | 'operating' | 'growing' | 'established' | 'leader';
  businessAge?: 'not_launched' | 'under_6m' | '6_24m' | '2_5y' | '5plus';
  customerBase?: 'none' | 'small' | 'steady' | 'hundreds' | 'large';
  monthlyRevenue?: 'none' | '1_1k' | '1k_10k' | '10k_50k' | '50k_200k' | '200k_plus';
  teamSize?: 'solo' | '2_3' | '4_10' | '11_20' | '20_plus';
  onlinePresence?: 'none' | 'building' | 'small' | 'strong' | 'large';
  mainGoal?: 'followers' | 'clients' | 'collaborate' | 'events' | 'international' | 'branding';
  growthSpeed?: 'slow' | 'steady' | 'fast' | 'explosive';
  willingToCollaborate?: 'yes' | 'no' | 'selective';
  calculatedLevel?: 'FREE' | 'SILVER' | 'GOLD' | 'PLATINUM';
}

// --- B2B Logic Types ---

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // ISO String
  location: string;
  description?: string;
  type: 'FUN' | 'WORK';
}

export interface Squad {
  id: string;
  month: string; // e.g., "November"
  members: string[]; // User IDs (BusinessProfile IDs)
  chatId: string | null;
  events: CalendarEvent[];
  // Deprecated: Keeping for backward compatibility temporarily
  schedule?: {
    funMeetup: {
      date: string;
      location: string;
    };
    deepDive: {
      date: string;
      hostId: string;
    };
  };
}

export interface ProjectSlot {
  role: string; // e.g., "Photographer", "Venue"
  cost: number;
  status: 'OPEN' | 'FUNDED';
  businessId?: string; // ID of business funding this slot
}

export type ProjectType = 'PHOTOSHOOT' | 'CAMPAIGN' | 'EVENT_ACTIVATION' | 'CONTENT_DAY';
export type ProjectStatus = 'PLANNING' | 'READY' | 'IN_PROGRESS' | 'COMPLETED';
export type BusinessRoleStatus = 'OPEN' | 'PENDING' | 'CONFIRMED';
export type CreatorRoleStatus = 'DRAFT' | 'OPEN' | 'FILLED';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED';

export interface BusinessRole {
  id: string;
  title: string; // e.g., "Styling Partner", "Jewelry Partner"
  contribution: {
    products?: string[];
    services?: string[];
    location?: string;
  };
  visibility: string; // e.g., "Brand featured in final visuals"
  costShare: number; // € amount
  benefit: string; // e.g., "Full usage rights to final assets"
  status: BusinessRoleStatus;
  businessId?: string; // ID of business who joined this role
}

export interface CreatorRole {
  id: string;
  title: string; // e.g., "Photographer", "Model"
  budget: number;
  quantity?: number; // Number of creators needed for this role
  status: CreatorRoleStatus;
  creatorId?: string; // ID of accepted creator
}

export interface ProjectTask {
  id: string;
  title: string;
  status: TaskStatus;
}

export interface Project {
  id: string;
  title: string;
  description: string; // 1-2 sentence project goal
  projectType: ProjectType;
  city: string;
  dateRange: {
    start: string; // ISO date
    end: string; // ISO date
  };
  totalCost: number;
  organizerId: string; // Lead business ID
  leadBusinessId: string; // Same as organizerId (for clarity)
  participatingBusinesses: string[]; // Array of business IDs who funded slots
  status: ProjectStatus;
  businessRoles: BusinessRole[];
  creatorRoles: CreatorRole[];
  tasks: ProjectTask[];
  chatId?: string; // Project chat conversation ID
  slots: ProjectSlot[]; // Legacy - can be removed later
  createdAt?: string;
  updatedAt?: string;
}

export interface ServiceListing {
  id: string;
  providerId: string;
  serviceName: string;
  costInPoints: number;
}

export interface Review {
  id: string;
  businessId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number; // 1-5
  comment?: string;
  createdAt: string; // ISO Date
  verified?: boolean; // From actual mission completion
}

// --- Meetups System Types ---

export type MeetupCategory = 
  | 'COFFEE' 
  | 'DINNER' 
  | 'CREATIVE' 
  | 'FITNESS' 
  | 'PET' 
  | 'INTERNATIONAL' 
  | 'BUSINESS' 
  | 'WELLNESS'
  | 'NIGHTLIFE'
  | 'CULTURE';

export type MeetupStatus = 'upcoming' | 'live' | 'ended' | 'cancelled';

export type PassportStamp = 
  | 'Coffee Explorer'
  | 'Dinner Socializer'
  | 'Creative Mind'
  | 'Fitness Enthusiast'
  | 'Pet Lover'
  | 'International Friend'
  | 'Business Networker'
  | 'Wellness Warrior'
  | 'Night Owl'
  | 'Culture Vulture';

// Check-in System
export interface CheckIn {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userLevel: number;
  businessId: string;
  businessName: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy: number; // meters
  };
  distance: number; // meters from business location
  timestamp: string; // ISO timestamp
  pointsEarned: number; // Points customer earned
  businessPointsEarned: number; // Points business earned
  verified: boolean; // Whether geofence validation passed
}

export interface MeetupParticipant {
  userId: string;
  userName: string;
  userAvatar?: string;
  userLevel: number;
  joinedAt: string; // ISO timestamp
  checkedIn: boolean;
  missionsCompleted: string[]; // mission IDs
}

export interface Meetup {
  id: string;
  businessId: string;
  businessName?: string;
  businessLogo?: string;
  businessIsPartner: boolean;
  
  category: MeetupCategory;
  title: string;
  description: string;
  
  startTime: string; // ISO timestamp
  endTime: string; // ISO timestamp
  
  capacity: 4; // Always 4 seats
  participants: MeetupParticipant[];
  
  location: {
    latitude: number;
    longitude: number;
    address: string;
    city: string;
    district?: string;
  };
  
  levelRequired: number;
  
  /** Female-only meetup (only females can join) */
  femaleOnly?: boolean;
  
  // Rewards & Missions (Partner Only)
  rewardId?: string;
  rewardTitle?: string;
  rewardType?: 'FREE_ITEM' | 'DISCOUNT' | 'XP_BOOST' | 'BONUS_COINS';
  rewardValue?: number;
  
  missions: string[]; // mission IDs
  xpReward: number;
  stamp?: PassportStamp;
  
  // Event Media
  photos?: string[]; // Event photo URLs
  coverPhoto?: string; // Main event cover image
  
  status: MeetupStatus;
  aiGenerated: boolean;
  partnerPriority: number; // 0-100 ranking score
  
  // AI Location Suggestions
  aiLocationSuggestion?: {
    category: EventLocationCategory;
    specificLocation?: string; // e.g., "Santorini, Greece"
    confidence: number; // 0-100
    reasoning?: string;
  }
  
  // Smart Matching
  weatherRelevance?: 'indoor' | 'outdoor' | 'any';
  timeOfDay?: 'morning' | 'lunch' | 'afternoon' | 'evening' | 'night';
  vibeMatch?: string[]; // vibe tags that fit this meetup
  distanceLimit: number; // meters
  
  // Chat
  chatId?: string;
  chatExpiresAt?: string; // 24h after endTime
  
  // Analytics
  viewCount: number;
  joinRequestCount: number;
  
  createdAt: string;
  updatedAt: string;
  
  // Additional properties for EventCard display
  isPartnerEvent?: boolean;
  isPremium?: boolean;
  image?: string;
  venue?: string;
  vibeTags?: string[];
  attendees?: string[];
}

// --- Service Marketplace Types ---
export interface ServiceProvider {
  id: string;
  name: string;
  category: 'PHOTOGRAPHY' | 'VIDEOGRAPHY' | 'DESIGN' | 'COPYWRITING' | 'SOCIAL_MEDIA' | 'MARKETING';
  bio: string;
  avatarUrl: string;
  portfolio: string[]; // URLs to portfolio items
  priceRange: string; // e.g., "€50-100/hour"
  city: string;
  rating: number;
  reviewCount: number;
  skills: string[];
  availability: 'IMMEDIATE' | 'WITHIN_WEEK' | 'BOOKED';
  contactEmail?: string;
  phone?: string;
  website?: string;
  socialLinks?: {
    instagram?: string;
    linkedin?: string;
    behance?: string;
  };
  yearsExperience?: number;
  featured?: boolean;
  createdAt: string;
}

// --- Premium Events Types ---
export interface PremiumEvent {
  id: string;
  title: string;
  description: string;
  category: 'WORKSHOP' | 'SPORTS' | 'SOCCER' | 'BASKETBALL' | 'TENNIS' | 'GOLF' | 'RUNNING' | 'CYCLING' | 'SWIMMING' | 'YOGA' | 'MARTIAL_ARTS' | 'GAMING' | 'DANCING' | 'COMEDY' | 'COOKING' | 'WINE_TASTING' | 'PHOTOGRAPHY' | 'ADVENTURE' | 'HIKING' | 'SAILING' | 'SKIING' | 'NETWORKING' | 'RETREAT' | 'CONFERENCE' | 'WELLNESS' | 'TECH' | 'FOOD' | 'TRAVEL' | 'ART' | 'MUSIC' | 'OUTDOORS' | 'BUSINESS' | 'ENTREPRENEURSHIP' | 'LEADERSHIP' | 'MARKETING' | 'FINANCE' | 'PERSONAL_DEVELOPMENT' | 'CONTENT_CREATION' | 'SOCIAL_MEDIA' | 'BRANDING' | 'INNOVATION' | 'MINDFULNESS' | 'FITNESS' | 'CAREER' | 'CREATIVITY' | 'COMMUNITY';
  categories?: string[]; // Multiple categories
  location: {
    city: string;
    country: string;
    venue: string;
    address: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  dates: {
    start: string; // ISO date
    end: string;
    duration: number; // days
  };
  pricing: {
    points: number; // e.g., 5000
    cash: number; // e.g., 500 (in EUR)
  };
  capacity: number;
  registered: number;
  registrants?: string[]; // User IDs
  images: string[];
  includes: string[]; // ["Accommodation", "Meals", "Materials"]
  schedule: Array<{
    day: number;
    title: string;
    activities: string[];
  }>;
  createdBy: 'ADMIN';
  createdByUserId?: string;
  status: 'UPCOMING' | 'REGISTRATION_OPEN' | 'SOLD_OUT' | 'COMPLETED' | 'CANCELLED';
  highlights?: string[];
  whatToBring?: string[];
  
  // Level Restrictions
  allowedLevels?: number[]; // e.g., [1, 2, 3] or empty/undefined for all levels
  isForEveryone?: boolean; // If true, all levels can join
  
  // Gender Restrictions
  genderRestriction?: 'mixed' | 'men' | 'women'; // Gender restriction for event
  
  // Registration Approval
  requiresAdminApproval: boolean; // If true, registrations need admin approval
  pendingApprovals?: string[]; // User IDs pending approval
  approvedRegistrants?: string[]; // User IDs approved by admin
  rejectedRegistrants?: string[]; // User IDs rejected by admin
  
  createdAt: string;
  updatedAt: string;
}

// --- AI Collaboration Suggestion Types ---
export interface CollaborationSuggestion {
  businessId: string;
  business?: User; // Populated on frontend
  matchScore: number; // 0-100
  collaborationIdea: string;
  synergy: string;
  sharedInterests?: string[];
  potentialRevenue?: string;
  suggestedAt: string;
}
