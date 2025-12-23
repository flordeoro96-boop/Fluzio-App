
export enum UserRole {
  ADMIN = 'ADMIN',
  BUSINESS = 'BUSINESS',
  MEMBER = 'MEMBER'
}

export enum SubscriptionLevel {
  FREE = 'FREE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM'
}

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

// Event location category enum
export enum EventLocationCategory {
  EUROPE = 'EUROPE',
  ASIA = 'ASIA',
  AFRICA = 'AFRICA',
  NORTH_AMERICA = 'NORTH_AMERICA',
  SOUTH_AMERICA = 'SOUTH_AMERICA',
  OCEANIA = 'OCEANIA',
  BEACHES = 'BEACHES',
  MOUNTAINS = 'MOUNTAINS',
  LAKES = 'LAKES',
  FORESTS = 'FORESTS',
  DESERTS = 'DESERTS',
  ISLANDS = 'ISLANDS',
  TROPICAL = 'TROPICAL',
  WINTER_SPORTS = 'WINTER_SPORTS',
  SUMMER_RESORTS = 'SUMMER_RESORTS',
  COASTAL = 'COASTAL',
  GERMANY = 'GERMANY',
  FRANCE = 'FRANCE',
  ITALY = 'ITALY',
  SPAIN = 'SPAIN',
  GREECE = 'GREECE',
  PORTUGAL = 'PORTUGAL',
  SWITZERLAND = 'SWITZERLAND',
  AUSTRIA = 'AUSTRIA',
  NETHERLANDS = 'NETHERLANDS',
  BELGIUM = 'BELGIUM',
  MAJOR_CITIES = 'MAJOR_CITIES',
  SMALL_TOWNS = 'SMALL_TOWNS',
  HISTORIC_CITIES = 'HISTORIC_CITIES',
  MODERN_CITIES = 'MODERN_CITIES'
}

// Admin types
export enum AdminRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  MODERATOR = 'MODERATOR',
  SUPPORT = 'SUPPORT',
  COUNTRY_ADMIN = 'COUNTRY_ADMIN',
  CITY_ADMIN = 'CITY_ADMIN',
  EVENT_ADMIN = 'EVENT_ADMIN',
  SUPPORT_ADMIN = 'SUPPORT_ADMIN'
}

export interface AdminUser {
  id: string;
  userId: string;
  email: string;
  role: AdminRole;
  name: string;
  permissions: string[];
  createdAt: string;
  isActive?: boolean;
  countryId?: string;
  cityId?: string;
  assignedEventIds?: string[];
  notes?: string;
}

// Business location type
export interface BusinessLocation {
  id: string;
  name: string;
  address: Address | string;
  geo: GeoPoint;
  isMain?: boolean;
  isPrimary?: boolean;
  isActive?: boolean;
  phone?: string;
  city?: string;
  country?: string;
  createdAt?: string;
}

// Check-in types
export interface CheckIn {
  id: string;
  userId: string;
  businessId: string;
  timestamp: string;
  location: {
    latitude: number;
    longitude: number;
  };
  distance: number;
  pointsEarned: number;
  verified: boolean;
  userName?: string;
  userAvatar?: string;
  userLevel?: number;
  businessPointsEarned?: number;
}

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
  
  // Daily Login Streak
  lastLoginAt?: string; // ISO Date string
  loginStreak?: number; // Current consecutive days
  longestLoginStreak?: number; // All-time record
  lastStreakRewardClaimed?: string; // ISO Date string
  totalStreakPointsEarned?: number; // Lifetime streak points
  
  // Creator Preferences for Mission Matching
  interests?: string[]; // Categories user is interested in (unified type)
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
  rating?: number; // Average rating 1-5
  reviewCount?: number; // Total number of reviews
  
  // KYC / Legal
  legalName?: string;
  vatId?: string;
  registrationNumber?: string;

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
  businessRating?: number; // Average business rating (renamed to avoid duplicate)
  reviewsCount?: number;
  collabsCompleted?: number;
  creatorFavorites?: number;
  responseTime?: string; // e.g., "Within 2 hours"
  handle?: string; // Business username/handle

  // Member Specific (City Logic)
  currentCity?: string;
  isGlobalRoamer?: boolean;
  city?: string; // User's home city
  
  // Account Type
  accountType?: string; // 'creator', 'business', 'customer', etc.
  
  // Location Override for Platinum Users
  temporaryLocation?: {
    city: string;
    country?: string;
    setAt: string; // ISO date
    expiresAt: string; // ISO date (30 days from setAt)
  };
  
  // Creator Mode
  creatorMode?: boolean;
  skills?: string[];
  gender?: 'MALE' | 'FEMALE' | 'NON_BINARY' | 'PREFER_NOT_TO_SAY'; // Gender field for matching
  locationTrackingEnabled?: boolean; // Whether location tracking is enabled
  
  // Creator Profile (for B2B marketplace)
  creator?: {
    roles?: string[]; // e.g., ['PHOTOGRAPHER', 'VIDEOGRAPHER', 'CONTENT_CREATOR']
    city?: string;
    radiusKm?: number; // Service radius
    portfolio?: string[]; // Image URLs
    bio?: string;
    hourlyRate?: number;
    availability?: 'FULL_TIME' | 'PART_TIME' | 'WEEKENDS';
  };
  
  // Timestamps
  createdAt?: string; // ISO date
  
  // Stats
  missionsCompleted?: number;
  
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
  geo?: GeoPoint;    // New Geospatial Data
  radiusMeters?: number; // Geofence radius (e.g., 500m)
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
  autoApprove?: boolean; // Auto-approve submissions
  targetAudience?: string[]; // Target demographics or interests
  targetLevel?: Array<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'PRO'>; // Target creator levels
  targetCategories?: MissionCategory[]; // Which interests should see this
  
  // Enhanced properties for mission tracking
  shopifyVisit?: {
    minDuration?: number;
    targetUrl?: string;
  };
  expiresAt?: string;
  status?: 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'DRAFT';
  points?: number; // Alias for reward points
  pointsReward?: number; // Original points field (alias)
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
export type NotificationType = 'VERIFY_MISSION' | 'B2B_MATCH' | 'SQUAD_ALERT' | 'SYSTEM' | 'NEW_MESSAGE' | 'MEETUP_REQUEST' | 'MISSION_POSTED' | 'MISSION_APPROVED' | 'MISSION_REJECTED' | 'MISSION_APPLICATION' | 'REWARD_REDEEMED' | 'POINTS_ACTIVITY' | 'STREAK_CLAIMED';

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
  ANALYTICS = 'ANALYTICS',
  CUSTOMERS = 'CUSTOMERS',
  MISSIONS = 'MISSIONS',
  REWARDS = 'REWARDS',
  PEOPLE = 'PEOPLE',
  B2B = 'B2B',
  SETTINGS = 'SETTINGS'
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
  authMethod?: 'EMAIL' | 'GOOGLE' | 'APPLE';
  isAspiringBusiness?: boolean;
  locationPermissionGranted?: boolean;
  email?: string;
  password?: string;
  handle?: string; // Business Name or Creator Username
  city?: string;
  category?: string;
  subCategory?: string;
  businessMode?: 'PHYSICAL' | 'ONLINE' | 'HYBRID';
  website?: string;
  instagram?: string;
  referralCode?: string;
  vibes: string[];
  
  // Personal Information Fields
  firstName?: string;
  lastName?: string;
  gender?: string;
  dateOfBirth?: string;
  
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
  
  // Business Assessment Fields
  businessStage?: string;
  businessAge?: string;
  customerBase?: string;
  monthlyRevenue?: string;
  teamSize?: string;
  onlinePresence?: string;
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
  name?: string; // Squad name
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
}

export interface BusinessRole {
  id?: string; // Added for unique identification
  businessId: string;
  businessName: string;
  role: string;
  title?: string; // Display title for the role
  costShare: number;
  status: 'INVITED' | 'CONFIRMED' | 'DECLINED';
  contribution?: {
    products?: string[];
    services?: string[];
    location?: string;
  };
  visibility?: string; // Visibility/exposure benefit
  benefit?: string; // Benefit description
}

export interface CreatorRole {
  id?: string; // Unique identifier
  roleId: string;
  roleName: string; // e.g., 'PHOTOGRAPHER', 'VIDEOGRAPHER'
  title: string; // Display name for the role
  description: string;
  budget: number;
  quantity?: number; // Number of creators needed for this role
  status: 'DRAFT' | 'OPEN' | 'FILLED' | 'CLOSED';
  applicants?: string[]; // Creator user IDs
  selectedCreatorId?: string;
}

export interface ProjectTask {
  id: string;
  title: string;
  description?: string;
  assignedTo?: string; // User ID
  dueDate?: string;
  status?: 'TODO' | 'IN_PROGRESS' | 'COMPLETED'; // Added task status
  completed: boolean;
  completedAt?: string;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  totalCost: number;
  organizerId: string;
  leadBusinessId?: string;
  slots: ProjectSlot[];
  
  // B2B Collaboration
  businessRoles?: BusinessRole[];
  creatorRoles?: CreatorRole[];
  
  // Project Details
  projectType?: 'PHOTOSHOOT' | 'EVENT' | 'CAMPAIGN' | 'CONTENT';
  status?: 'DRAFT' | 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  city?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  images?: string[];
  tasks?: ProjectTask[];
  
  // Timestamps
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
  
  // Rewards & Missions (Partner Only)
  rewardId?: string;
  rewardTitle?: string;
  rewardType?: 'FREE_ITEM' | 'DISCOUNT' | 'XP_BOOST' | 'BONUS_COINS';
  rewardValue?: number;
  
  missions: string[]; // mission IDs
  xpReward: number;
  stamp?: PassportStamp;
  
  status: MeetupStatus;
  aiGenerated: boolean;
  partnerPriority: number; // 0-100 ranking score
  
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
  category: 'WORKSHOP' | 'SPORTS' | 'NETWORKING' | 'RETREAT' | 'CONFERENCE';
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
