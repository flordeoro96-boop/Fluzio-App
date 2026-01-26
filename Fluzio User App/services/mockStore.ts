
import { MissionCategory, ProofType, RewardType, BusinessCategory, SubscriptionLevel } from '../types';

/**
 * Mock Store - Refactored to contain only templates and configuration
 * All user data, missions, and participations now come from Firebase
 * 
 * This file only provides:
 * - Standard mission templates
 * - Category-specific text generation
 * - Subscription tier limits
 * - Business rule constants
 */

// --- Mission Template Helpers ---

export const getCategorySpecificTexts = (category: BusinessCategory) => {
    switch(category) {
        case BusinessCategory.GASTRONOMY:
            return {
                review: "Share your favorite dish",
                story: "Tag us in your food story",
                refer: "Bring a hungry friend",
                checkin: "Check-in for dessert"
            };
        case BusinessCategory.FITNESS:
            return {
                review: "Review our facilities",
                story: "Post a workout selfie",
                refer: "Workout buddy bonus",
                checkin: "Check-in at the gym"
            };
        case BusinessCategory.RETAIL:
            return {
                review: "Review your purchase",
                story: "Show off your style",
                refer: "Shopping spree with a friend",
                checkin: "Check-in while shopping"
            };
        default:
            return {
                review: "Leave us a 5-star review",
                story: "Share your experience",
                refer: "Bring a friend",
                checkin: "Check-in on Facebook"
            };
    }
};

/**
 * Generate standard mission templates for a business
 * These are reusable mission templates that businesses can activate
 */
export const generateStandardMissionTemplates = (
  businessId: string,
  businessName: string,
  businessLogo: string,
  category: BusinessCategory,
  geo?: any
): Mission[] => {
  const texts = getCategorySpecificTexts(category);
  const now = new Date().toISOString();
  const future = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString(); // 1 year valid

  return [
    {
      id: `std_google_${businessId}`,
      businessId,
      businessName,
      businessLogo,
      title: "Google Review",
      description: texts.review,
      category: MissionCategory.OTHER,
      requirements: ["5 Stars", "Screenshot"],
      reward: { type: RewardType.POINTS_ONLY, points: 50 },
      proofType: ProofType.SCREENSHOT,
      createdAt: now,
      validUntil: future,
      isStandard: true,
      isActive: false,
      recurrence: 'ONCE',
      currentParticipants: 0,
      maxParticipants: 1000,
      geo,
      triggerType: 'MANUAL'
    },
    {
      id: `std_ig_${businessId}`,
      businessId,
      businessName,
      businessLogo,
      title: "Instagram Story",
      description: texts.story,
      category: MissionCategory.LIFESTYLE,
      requirements: ["Tag Us", "Story"],
      reward: { type: RewardType.POINTS_ONLY, points: 30 },
      proofType: ProofType.LINK,
      createdAt: now,
      validUntil: future,
      isStandard: true,
      isActive: false,
      recurrence: 'WEEKLY',
      currentParticipants: 0,
      maxParticipants: 1000,
      geo,
      triggerType: 'MANUAL'
    },
    {
      id: `std_refer_${businessId}`,
      businessId,
      businessName,
      businessLogo,
      title: "Refer a Friend",
      description: texts.refer,
      category: MissionCategory.OTHER,
      requirements: ["Bring Friend", "Purchase"],
      reward: { type: RewardType.POINTS_AND_DISCOUNT, points: 100, itemDescription: "10% Off" },
      proofType: ProofType.PHOTO,
      createdAt: now,
      validUntil: future,
      isStandard: true,
      isActive: false,
      recurrence: 'MONTHLY',
      currentParticipants: 0,
      maxParticipants: 1000,
      geo,
      triggerType: 'GPS_PROXIMITY'
    },
    {
      id: `std_fb_${businessId}`,
      businessId,
      businessName,
      businessLogo,
      title: "Facebook Check-in",
      description: texts.checkin,
      category: MissionCategory.OTHER,
      requirements: ["Check-in"],
      reward: { type: RewardType.POINTS_ONLY, points: 20 },
      proofType: ProofType.LINK,
      createdAt: now,
      validUntil: future,
      isStandard: true,
      isActive: false,
      recurrence: 'WEEKLY',
      currentParticipants: 0,
      maxParticipants: 1000,
      geo,
      triggerType: 'GPS_PROXIMITY'
    }
  ];
};

// --- Subscription Tier Limits ---

/**
 * Get max participants allowed based on subscription level
 */
export const getMaxParticipantsBySubscription = (subscriptionLevel: SubscriptionLevel): number => {
  switch (subscriptionLevel) {
    case SubscriptionLevel.PLATINUM:
      return 100;
    case SubscriptionLevel.GOLD:
      return 50;
    case SubscriptionLevel.SILVER:
      return 10;
    case SubscriptionLevel.FREE:
    default:
      return 5;
  }
};

/**
 * Get max missions allowed based on subscription level
 */
export const getMaxMissionsBySubscription = (subscriptionLevel: SubscriptionLevel): number => {
  switch (subscriptionLevel) {
    case SubscriptionLevel.PLATINUM:
      return -1; // Unlimited
    case SubscriptionLevel.GOLD:
      return 20;
    case SubscriptionLevel.SILVER:
      return 5;
    case SubscriptionLevel.FREE:
    default:
      return 2;
  }
};

/**
 * Get features enabled by subscription level
 */
export const getSubscriptionFeatures = (subscriptionLevel: SubscriptionLevel) => {
  const baseFeatures = {
    canCreateMissions: true,
    canViewAnalytics: true,
    canReceiveNotifications: true
  };

  switch (subscriptionLevel) {
    case SubscriptionLevel.PLATINUM:
      return {
        ...baseFeatures,
        maxMissions: -1,
        maxParticipants: 100,
        advancedAnalytics: true,
        prioritySupport: true,
        customBranding: true,
        apiAccess: true
      };
    case SubscriptionLevel.GOLD:
      return {
        ...baseFeatures,
        maxMissions: 20,
        maxParticipants: 50,
        advancedAnalytics: true,
        prioritySupport: true,
        customBranding: false,
        apiAccess: false
      };
    case SubscriptionLevel.SILVER:
      return {
        ...baseFeatures,
        maxMissions: 5,
        maxParticipants: 10,
        advancedAnalytics: false,
        prioritySupport: false,
        customBranding: false,
        apiAccess: false
      };
  }
};

// --- Temporary Compatibility Layer ---
// These functions provide backward compatibility during Firebase migration
// They will be removed once all components are updated

import { User, Mission, BusinessStats, Conversation, Participation, Squad, Project, Transaction, MissionStatus } from '../types';

class MockStore {
  // Stub methods that log warnings
  
  getUsers(): User[] {
    console.warn('[MockStore] getUsers() - Use userService.searchUsers() or userService.getUsersByRole()');
    return [];
  }

  getAllUsers(): User[] {
    console.warn('[MockStore] getAllUsers() - Use userService.searchUsers() or userService.getUsersByRole()');
    return [];
  }

  getUser(id: string): User | undefined {
    console.warn('[MockStore] getUser() - Use apiService.getUser() instead');
    return undefined;
  }

  getUserByFirebaseUid(uid: string): User | undefined {
    console.warn('[MockStore] getUserByFirebaseUid() - User data comes from AuthContext.userProfile');
    return undefined;
  }

  createUserFromFirebase(firebaseProfile: any): User {
    console.warn('[MockStore] createUserFromFirebase() - Creating temporary user object from Firebase profile');
    console.log('[MockStore] firebaseProfile.accountType:', firebaseProfile.accountType);
    console.log('[MockStore] firebaseProfile.role:', firebaseProfile.role);
    
    // Create a minimal User object from Firebase profile
    const role = firebaseProfile.role === 'BUSINESS' ? 'BUSINESS' : 
                 firebaseProfile.role === 'MEMBER' ? 'MEMBER' : 'CREATOR';
    
    // Set accountType based on role if not explicitly provided
    let accountType = firebaseProfile.accountType;
    if (!accountType && firebaseProfile.role === 'BUSINESS') {
      accountType = 'business';
    } else if (!accountType && firebaseProfile.role === 'CREATOR') {
      accountType = 'creator';
    }
    // MEMBER role (customers) should NOT have accountType set - leave undefined
    
    console.log('[MockStore] Determined role:', role, 'accountType:', accountType);
    
    const user: User = {
      id: firebaseProfile.uid,
      firebaseUid: firebaseProfile.uid,
      name: firebaseProfile.name || firebaseProfile.email?.split('@')[0] || 'User',
      email: firebaseProfile.email || `${firebaseProfile.uid}@fluzio.com`,
      role: role as any,
      accountType: accountType as any,
      avatarUrl: firebaseProfile.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(firebaseProfile.name || 'User')}&background=7209B7&color=fff`,
      bio: firebaseProfile.bio || (role === 'BUSINESS' ? 'Business owner' : 'Creator'),
      location: firebaseProfile.city || 'Munich, Germany',
      currentCity: firebaseProfile.city || 'Munich',
      homeCity: firebaseProfile.city || 'Munich',
      points: 0,
      level: firebaseProfile.businessLevel || firebaseProfile.level || 1,
      subscriptionLevel: (firebaseProfile.subscriptionLevel || 'FREE') as any,
      badges: [],
      socialLinks: firebaseProfile.socialLinks || {},
      category: firebaseProfile.category,
      businessType: firebaseProfile.category,
      vibe: firebaseProfile.vibeTags || firebaseProfile.vibe || [],
      isVerified: false,
      verificationStatus: firebaseProfile.verificationStatus || 'APPROVED',
      isAspiringBusiness: firebaseProfile.isAspiringBusiness || false,
      geo: firebaseProfile.geo || {
        latitude: 48.1351,
        longitude: 11.5820,
        city: firebaseProfile.city || 'Munich',
        address: firebaseProfile.city || 'Munich, Germany'
      }
    };
    
    return user;
  }

  getMissions(): Mission[] {
    console.warn('[MockStore] getMissions() - Use missionService.getActiveMissions()');
    return [];
  }

  getMissionsByBusiness(businessId: string): Mission[] {
    console.warn('[MockStore] getMissionsByBusiness() - Use missionService.getMissionsByBusiness()');
    return [];
  }

  getMission(id: string): Mission | undefined {
    console.warn('[MockStore] getMission() - Use missionService.getMissionById()');
    return undefined;
  }

  getStandardMissions(businessId: string): Mission[] {
    console.warn('[MockStore] getStandardMissions() - Use generateStandardMissionTemplates() from mockStore');
    return [];
  }

  toggleMissionStatus(missionId: string): Mission {
    console.warn('[MockStore] toggleMissionStatus() - Use missionService.toggleMissionStatus()');
    return {} as Mission;
  }

  getBusinessStats(businessId: string): BusinessStats {
    // Deprecated: Use real stats calculation in components
    return {
      activeMissions: 0,
      totalApplications: 0,
      completedMissions: 0,
      pendingReviews: 0,
      storeCheckIns: 0,
      socialReach: 0,
      activeAmbassadors: 0,
      followerGrowth: 0,
      localRank: 0,
      districtName: 'Unknown'
    };
  }

  getParticipationsForBusiness(businessId: string): Participation[] {
    console.warn('[MockStore] getParticipationsForBusiness() - Use participationService');
    return [];
  }

  getAllConversations(): Conversation[] {
    console.warn('[MockStore] getAllConversations() - Use conversationService');
    return [];
  }

  getConversation(id: string): Conversation | undefined {
    console.warn('[MockStore] getConversation() - Use conversationService');
    return undefined;
  }

  createConversation(data: Partial<Conversation>): Conversation {
    console.warn('[MockStore] createConversation() - Use conversationService');
    return {} as Conversation;
  }

  getConversationsForUser(userId: string): Conversation[] {
    console.warn('[MockStore] getConversationsForUser() - Use conversationService');
    return [];
  }

  getMessages(conversationId: string): any[] {
    console.warn('[MockStore] getMessages() - Use conversationService');
    return [];
  }

  sendMessage(conversationId: string, senderId: string, content: string, type?: any, proposal?: any): string {
    console.warn('[MockStore] sendMessage() - Use conversationService');
    return '';
  }

  markConversationAsRead(conversationId: string, userId: string): void {
    console.warn('[MockStore] markConversationAsRead() - Use conversationService');
  }

  voteOnActivityProposal(conversationId: string, proposalId: string, userId: string, vote: boolean): void {
    console.warn('[MockStore] voteOnActivityProposal() - Use chatService');
  }

  getActivityProposal(conversationId: string, proposalId: string): any {
    console.warn('[MockStore] getActivityProposal() - Use chatService');
    return undefined;
  }

  createNotification(notification: any): void {
    console.warn('[MockStore] createNotification() - Use notificationService');
  }

  getSquadForUser(userId: string): Squad | undefined {
    console.warn('[MockStore] getSquadForUser() - Use squadService');
    return undefined;
  }

  getProjects(): Project[] {
    console.warn('[MockStore] getProjects() - Use projectService');
    return [];
  }

  getWalletTransactions(userId: string): Transaction[] {
    console.warn('[MockStore] getWalletTransactions() - Implement wallet service');
    return [];
  }

  getBillingHistory(userId: string): any[] {
    console.warn('[MockStore] getBillingHistory() - Implement billing service');
    return [];
  }

  getSubscriptionUsage(userId: string): any {
    console.warn('[MockStore] getSubscriptionUsage() - Implement subscription service');
    return {
      matchesUsed: 0,
      matchLimit: 0,
      renewalDate: '01 Dec 2025',
      monthlyPrice: 0
    };
  }

  updateUserSubscription(userId: string, newLevel: SubscriptionLevel): void {
    console.warn('[MockStore] updateUserSubscription() - Use apiService.updateUser()');
    localStorage.setItem(`user_${userId}_subscription`, newLevel);
  }

  login(role: any): User {
    console.warn('[MockStore] login() - Use AuthContext');
    return {} as User;
  }

  signup(data: any): User {
    console.warn('[MockStore] signup() - Use AuthContext');
    return {} as User;
  }

  logout(): void {
    console.warn('[MockStore] logout() - Use AuthContext');
  }

  setCurrentUser(user: User): void {
    console.warn('[MockStore] setCurrentUser() - Managed by AuthContext');
  }

  getCurrentUser(): User | null {
    console.warn('[MockStore] getCurrentUser() - Use AuthContext.user or userProfile');
    return null;
  }

  updateUser(id: string, data: Partial<User>): User {
    console.warn('[MockStore] updateUser() - Use apiService.updateUser()');
    return {} as User;
  }

  awardPoints(userId: string, points: number): User {
    console.warn('[MockStore] awardPoints() - Implement points service');
    return {} as User;
  }

  createMission(missionData: any): Mission {
    console.warn('[MockStore] createMission() - Use missionService.createMission()');
    return {} as Mission;
  }

  applyForMission(missionId: string, userId: string): Participation {
    console.warn('[MockStore] applyForMission() - Use missionService.applyToMission()');
    return {} as Participation;
  }

  submitProof(participationId: string, proofUrl: string): Participation {
    console.warn('[MockStore] submitProof() - Use missionService.submitMissionProof()');
    return {} as Participation;
  }

  getParticipationsForUser(userId: string): Participation[] {
    console.warn('[MockStore] getParticipationsForUser() - Use missionService.getUserParticipations()');
    return [];
  }

  getParticipation(missionId: string, userId: string): Participation | undefined {
    console.warn('[MockStore] getParticipation() - Use participationService');
    return undefined;
  }

  updateParticipationStatus(id: string, status: MissionStatus): Participation {
    console.warn('[MockStore] updateParticipationStatus() - Use missionService.reviewParticipation()');
    return {} as Participation;
  }

  getAllMissions(): Mission[] {
    console.warn('[MockStore] getAllMissions() - Use missionService.getActiveMissions()');
    return [];
  }

  getAllMissionsWithUserBusiness(userId: string, userBusinessName?: string, userBusinessLogo?: string): Mission[] {
    console.warn('[MockStore] getAllMissionsWithUserBusiness() - Use missionService');
    return [];
  }

  hostEvent(businessId: string, details: any): void {
    console.warn('[MockStore] hostEvent() - Implement events service');
  }

  getNotifications(userId: string): any[] {
    console.warn('[MockStore] getNotifications() - Use notificationService');
    return [];
  }

  markNotificationAsRead(id: string): void {
    console.warn('[MockStore] markNotificationAsRead() - Use notificationService');
  }
}

export const store = new MockStore();
